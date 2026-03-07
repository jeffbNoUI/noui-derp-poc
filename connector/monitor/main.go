// connector/monitor — NoUI Monitoring Checks Engine
//
// Connects to a legacy database (ERPNext/MariaDB), establishes statistical
// baselines from historical HR/payroll data, and runs data quality checks
// to detect anomalies.
//
// Usage:
//
//	go run ./monitor/ \
//	  --driver mysql \
//	  --dsn "root:admin@tcp(127.0.0.1:3307)/_0919b4e09c48d335" \
//	  --output monitor-report.json
//
// Flags:
//
//	--driver         Database driver (default: mysql)
//	--dsn            Data source name (default: root:admin@tcp(127.0.0.1:3307)/_0919b4e09c48d335)
//	--db             Database name override (extracted from DSN if omitted)
//	--output         Output JSON report path (default: monitor-report.json)
//	--baseline-only  Only compute baselines, skip checks
//	--checks-only    Only run checks, skip baseline computation
//	--schedule       Run interval for periodic monitoring (e.g. 5m, 1h). Runs once if omitted.
//	--history-dir    Directory for timestamped report history (used with --schedule)

package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/go-sql-driver/mysql"
	_ "github.com/lib/pq"
	_ "github.com/microsoft/go-mssqldb"
)

func main() {
	driver := flag.String("driver", "mysql", "Database driver: mysql | postgres")
	dsn := flag.String("dsn", "root:admin@tcp(127.0.0.1:3307)/_0919b4e09c48d335", "Data source name")
	dbName := flag.String("db", "", "Database name override (extracted from DSN if empty)")
	output := flag.String("output", "monitor-report.json", "Output JSON report path")
	baselineOnly := flag.Bool("baseline-only", false, "Only compute baselines, skip checks")
	checksOnly := flag.Bool("checks-only", false, "Only run checks, skip baseline computation")
	schedule := flag.String("schedule", "", "Run interval for periodic monitoring (e.g. 5m, 1h)")
	historyDir := flag.String("history-dir", "", "Directory for timestamped report history")
	flag.Parse()

	// Extract database name from DSN if not specified
	database := *dbName
	if database == "" {
		database = extractDBFromDSN(*dsn)
	}

	log.Printf("Connecting to %s database (%s)...", *driver, database)
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

	adapter := NewMonitorAdapter(*driver)
	log.Printf("Using %s monitor adapter", *driver)

	// Scheduled mode: run in a loop until interrupted
	if *schedule != "" {
		interval, err := time.ParseDuration(*schedule)
		if err != nil {
			log.Fatalf("Invalid schedule interval %q: %v", *schedule, err)
		}
		RunScheduled(db, adapter, *driver, database, *output, *historyDir, interval, *baselineOnly, *checksOnly)
		return
	}

	// Single-run mode
	report, err := RunMonitor(db, adapter, *driver, database, *baselineOnly, *checksOnly)
	if err != nil {
		log.Fatalf("Monitor run failed: %v", err)
	}

	data, err := json.MarshalIndent(report, "", "  ")
	if err != nil {
		log.Fatalf("Failed to marshal report: %v", err)
	}

	if err := os.WriteFile(*output, data, 0644); err != nil {
		log.Fatalf("Failed to write output: %v", err)
	}

	log.Printf("Monitor report written to %s", *output)
}

// extractDBFromDSN extracts the database name from a MySQL DSN string.
// DSN format: user:password@tcp(host:port)/dbname
func extractDBFromDSN(dsn string) string {
	// Find the last "/" and take everything after it (before any "?" params)
	slashIdx := strings.LastIndex(dsn, "/")
	if slashIdx < 0 || slashIdx >= len(dsn)-1 {
		return ""
	}
	dbPart := dsn[slashIdx+1:]
	// Strip query parameters
	if qIdx := strings.Index(dbPart, "?"); qIdx >= 0 {
		dbPart = dbPart[:qIdx]
	}
	return dbPart
}
