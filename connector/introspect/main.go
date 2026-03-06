// connector/introspect — NoUI Schema Discovery Engine
//
// Connects to a legacy database and produces a schema manifest:
// a structured JSON description of all tables, columns, data types,
// row counts, and foreign key relationships.
//
// Usage:
//   go run ./introspect/cmd \
//     --driver mysql \
//     --dsn "orangehrm:orangehrm@tcp(127.0.0.1:3306)/orangehrm" \
//     --output ../../targets/orangehrm/schema-manifest/manifest.json
//
// The manifest is the input to the concept tagger (connector/tagger).
// It is a generated artifact — do not commit to version control.

package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

// SchemaManifest is the top-level output structure.
type SchemaManifest struct {
	Source         string       `json:"source"`
	Driver         string       `json:"driver"`
	Database       string       `json:"database"`
	IntrospectedAt string       `json:"introspected_at"`
	TableCount     int          `json:"table_count"`
	Tables         []TableInfo  `json:"tables"`
}

// TableInfo describes a single table.
type TableInfo struct {
	Name        string       `json:"name"`
	RowCount    int64        `json:"row_count"`
	Columns     []ColumnInfo `json:"columns"`
	ForeignKeys []ForeignKey `json:"foreign_keys"`
	NoUITags    []string     `json:"noui_tags"` // populated by tagger
}

// ColumnInfo describes a single column.
type ColumnInfo struct {
	Name       string `json:"name"`
	DataType   string `json:"data_type"`
	IsNullable bool   `json:"is_nullable"`
	IsKey      string `json:"key_type"` // PRI, UNI, MUL, ""
}

// ForeignKey describes a referential constraint.
type ForeignKey struct {
	ConstraintName      string `json:"constraint_name"`
	Column              string `json:"column"`
	ReferencedTable     string `json:"referenced_table"`
	ReferencedColumn    string `json:"referenced_column"`
}

func main() {
	driver := flag.String("driver", "mysql", "Database driver: mysql | postgres")
	dsn := flag.String("dsn", "orangehrm:orangehrm@tcp(127.0.0.1:3306)/orangehrm", "Data source name")
	dbName := flag.String("db", "orangehrm", "Database/schema name to introspect")
	output := flag.String("output", "manifest.json", "Output file path")
	flag.Parse()

	log.Printf("Connecting to %s database...", *driver)
	db, err := sql.Open(*driver, *dsn)
	if err != nil {
		log.Fatalf("Failed to open connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected.")

	manifest, err := introspect(db, *dbName)
	if err != nil {
		log.Fatalf("Introspection failed: %v", err)
	}

	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal manifest: %v", err)
	}

	if err := os.WriteFile(*output, data, 0644); err != nil {
		log.Fatalf("Failed to write output: %v", err)
	}

	log.Printf("Schema manifest written to %s", *output)
	log.Printf("Tables discovered: %d", manifest.TableCount)
}

func introspect(db *sql.DB, dbName string) (*SchemaManifest, error) {
	manifest := &SchemaManifest{
		Source:         dbName,
		Driver:         "mysql",
		Database:       dbName,
		IntrospectedAt: time.Now().UTC().Format(time.RFC3339),
	}

	tables, err := getTables(db, dbName)
	if err != nil {
		return nil, fmt.Errorf("getting tables: %w", err)
	}

	for i, t := range tables {
		cols, err := getColumns(db, dbName, t.Name)
		if err != nil {
			return nil, fmt.Errorf("getting columns for %s: %w", t.Name, err)
		}
		tables[i].Columns = cols

		fks, err := getForeignKeys(db, dbName, t.Name)
		if err != nil {
			return nil, fmt.Errorf("getting FKs for %s: %w", t.Name, err)
		}
		tables[i].ForeignKeys = fks
		tables[i].NoUITags = []string{} // populated by tagger
	}

	manifest.Tables = tables
	manifest.TableCount = len(tables)
	return manifest, nil
}

func getTables(db *sql.DB, dbName string) ([]TableInfo, error) {
	rows, err := db.Query(`
		SELECT TABLE_NAME, COALESCE(TABLE_ROWS, 0)
		FROM information_schema.TABLES
		WHERE TABLE_SCHEMA = ?
		  AND TABLE_TYPE = 'BASE TABLE'
		ORDER BY TABLE_NAME
	`, dbName)
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

func getColumns(db *sql.DB, dbName, tableName string) ([]ColumnInfo, error) {
	rows, err := db.Query(`
		SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COALESCE(COLUMN_KEY, '')
		FROM information_schema.COLUMNS
		WHERE TABLE_SCHEMA = ?
		  AND TABLE_NAME = ?
		ORDER BY ORDINAL_POSITION
	`, dbName, tableName)
	if err != nil {
		return nil, err
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

func getForeignKeys(db *sql.DB, dbName, tableName string) ([]ForeignKey, error) {
	rows, err := db.Query(`
		SELECT CONSTRAINT_NAME, COLUMN_NAME,
		       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
		FROM information_schema.KEY_COLUMN_USAGE
		WHERE TABLE_SCHEMA = ?
		  AND TABLE_NAME = ?
		  AND REFERENCED_TABLE_NAME IS NOT NULL
		ORDER BY CONSTRAINT_NAME
	`, dbName, tableName)
	if err != nil {
		return nil, err
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
