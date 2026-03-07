package main

import (
	"database/sql"
	"log"

	"github.com/noui/connector-lab/schema"
)

// SchemaAdapter provides database-specific query implementations for schema introspection.
// Per CLAUDE.md: "Connector DB adapter must be swappable per target — no MariaDB-specific
// code in core connector logic."
type SchemaAdapter interface {
	GetTables(db *sql.DB, dbName string) ([]schema.TableInfo, error)
	GetColumns(db *sql.DB, dbName, tableName string) ([]schema.ColumnInfo, error)
	GetForeignKeys(db *sql.DB, dbName, tableName string) ([]schema.ForeignKey, error)
}

// NewAdapter returns the appropriate SchemaAdapter for the given driver.
// Supported drivers: "mysql" (default), "postgres", "mssql".
func NewAdapter(driver string) SchemaAdapter {
	switch driver {
	case "postgres":
		return &PostgresAdapter{}
	case "mssql":
		return &MSSQLAdapter{}
	case "mysql", "":
		return &MySQLAdapter{}
	default:
		log.Printf("WARNING: unknown driver %q, defaulting to MySQL adapter", driver)
		return &MySQLAdapter{}
	}
}
