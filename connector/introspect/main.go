// connector/introspect — NoUI Schema Discovery Engine
//
// Connects to a legacy database and produces a schema manifest:
// a structured JSON description of all tables, columns, data types,
// row counts, and foreign key relationships.
//
// Supports multiple database backends via swappable adapters:
//   - mysql: MySQL / MariaDB (default)
//   - postgres: PostgreSQL
//
// Usage:
//
//	go run ./introspect/ \
//	  --driver mysql \
//	  --dsn "root:admin@tcp(127.0.0.1:3307)/" \
//	  --db frontend \
//	  --output ../targets/erpnext/schema-manifest/manifest.json
//
//	go run ./introspect/ \
//	  --driver postgres \
//	  --dsn "postgres://user:pass@localhost:5432/mydb?sslmode=disable" \
//	  --db public \
//	  --output manifest.json
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

	"github.com/noui/connector-lab/schema"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/microsoft/go-mssqldb"
)

func main() {
	driver := flag.String("driver", "mysql", "Database driver: mysql | postgres")
	dsn := flag.String("dsn", "root:admin@tcp(127.0.0.1:3307)/", "Data source name")
	dbName := flag.String("db", "", "Database/schema name to introspect (auto-detected if empty)")
	output := flag.String("output", "manifest.json", "Output file path")
	flag.Parse()

	log.Printf("Connecting to %s database...", *driver)
	sqlDriver := *driver
	if sqlDriver == "mssql" {
		sqlDriver = "sqlserver" // go-mssqldb registers as "sqlserver" for URL-style DSNs
	}
	db, err := sql.Open(sqlDriver, *dsn)
	if err != nil {
		log.Fatalf("Failed to open connection: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected.")

	adapter := NewAdapter(*driver)
	manifest, err := introspect(db, adapter, *driver, *dbName)
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

func introspect(db *sql.DB, adapter SchemaAdapter, driver, dbName string) (*schema.SchemaManifest, error) {
	manifest := &schema.SchemaManifest{
		Source:         dbName,
		Driver:         driver,
		Database:       dbName,
		IntrospectedAt: time.Now().UTC().Format(time.RFC3339),
	}

	tables, err := adapter.GetTables(db, dbName)
	if err != nil {
		return nil, fmt.Errorf("getting tables: %w", err)
	}

	for i, t := range tables {
		cols, err := adapter.GetColumns(db, dbName, t.Name)
		if err != nil {
			return nil, fmt.Errorf("getting columns for %s: %w", t.Name, err)
		}
		tables[i].Columns = cols

		fks, err := adapter.GetForeignKeys(db, dbName, t.Name)
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
