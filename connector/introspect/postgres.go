package main

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

// PostgresAdapter implements SchemaAdapter for PostgreSQL databases.
type PostgresAdapter struct{}

func (a *PostgresAdapter) GetTables(db *sql.DB, dbName string) ([]TableInfo, error) {
	// PostgreSQL: use pg_stat_user_tables for accurate row counts (n_live_tup)
	// instead of information_schema.tables which doesn't expose TABLE_ROWS.
	// dbName maps to schema_name (typically "public").
	schema := dbName
	if schema == "" {
		schema = "public"
	}

	rows, err := db.Query(`
		SELECT t.table_name, COALESCE(s.n_live_tup, 0)
		FROM information_schema.tables t
		LEFT JOIN pg_stat_user_tables s
		  ON t.table_name = s.relname AND t.table_schema = s.schemaname
		WHERE t.table_schema = $1
		  AND t.table_type = 'BASE TABLE'
		ORDER BY t.table_name
	`, schema)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []TableInfo
	for rows.Next() {
		var t TableInfo
		if err := rows.Scan(&t.Name, &t.RowCount); err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}
	return tables, rows.Err()
}

func (a *PostgresAdapter) GetColumns(db *sql.DB, dbName, tableName string) ([]ColumnInfo, error) {
	schema := dbName
	if schema == "" {
		schema = "public"
	}

	// PostgreSQL: information_schema.columns has no COLUMN_KEY.
	// We determine key type by joining with constraint information.
	rows, err := db.Query(`
		SELECT
			c.column_name,
			c.data_type,
			c.is_nullable,
			COALESCE(
				(SELECT CASE tc.constraint_type
					WHEN 'PRIMARY KEY' THEN 'PRI'
					WHEN 'UNIQUE' THEN 'UNI'
					WHEN 'FOREIGN KEY' THEN 'MUL'
				END
				FROM information_schema.key_column_usage kcu
				JOIN information_schema.table_constraints tc
				  ON kcu.constraint_name = tc.constraint_name
				  AND kcu.constraint_schema = tc.constraint_schema
				WHERE kcu.table_schema = c.table_schema
				  AND kcu.table_name = c.table_name
				  AND kcu.column_name = c.column_name
				ORDER BY CASE tc.constraint_type
					WHEN 'PRIMARY KEY' THEN 1
					WHEN 'UNIQUE' THEN 2
					WHEN 'FOREIGN KEY' THEN 3
				END
				LIMIT 1),
				''
			) AS key_type
		FROM information_schema.columns c
		WHERE c.table_schema = $1
		  AND c.table_name = $2
		ORDER BY c.ordinal_position
	`, schema, tableName)
	if err != nil {
		return nil, fmt.Errorf("querying columns for %s.%s: %w", schema, tableName, err)
	}
	defer rows.Close()

	var cols []ColumnInfo
	for rows.Next() {
		var c ColumnInfo
		var nullable string
		if err := rows.Scan(&c.Name, &c.DataType, &nullable, &c.IsKey); err != nil {
			return nil, err
		}
		c.IsNullable = nullable == "YES"
		cols = append(cols, c)
	}
	return cols, rows.Err()
}

func (a *PostgresAdapter) GetForeignKeys(db *sql.DB, dbName, tableName string) ([]ForeignKey, error) {
	schema := dbName
	if schema == "" {
		schema = "public"
	}

	// PostgreSQL: information_schema.KEY_COLUMN_USAGE lacks REFERENCED_TABLE_NAME.
	// Use referential_constraints to bridge source and target key_column_usage entries.
	rows, err := db.Query(`
		SELECT
			tc.constraint_name,
			kcu.column_name,
			ccu.table_name AS referenced_table,
			ccu.column_name AS referenced_column
		FROM information_schema.table_constraints tc
		JOIN information_schema.key_column_usage kcu
		  ON tc.constraint_name = kcu.constraint_name
		  AND tc.constraint_schema = kcu.constraint_schema
		JOIN information_schema.constraint_column_usage ccu
		  ON tc.constraint_name = ccu.constraint_name
		  AND tc.constraint_schema = ccu.constraint_schema
		WHERE tc.constraint_type = 'FOREIGN KEY'
		  AND tc.table_schema = $1
		  AND tc.table_name = $2
		ORDER BY tc.constraint_name
	`, schema, tableName)
	if err != nil {
		return nil, fmt.Errorf("querying FKs for %s.%s: %w", schema, tableName, err)
	}
	defer rows.Close()

	var fks []ForeignKey
	for rows.Next() {
		var fk ForeignKey
		if err := rows.Scan(&fk.ConstraintName, &fk.Column,
			&fk.ReferencedTable, &fk.ReferencedColumn); err != nil {
			return nil, err
		}
		fks = append(fks, fk)
	}
	return fks, rows.Err()
}
