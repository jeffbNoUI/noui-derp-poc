// Package db provides PostgreSQL database access for the DERP connector service.
package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

// Connect establishes a connection to the PostgreSQL database using environment variables.
// Retries up to 10 times with 2-second intervals to handle container startup ordering.
func Connect() (*sql.DB, error) {
	host := envOrDefault("DB_HOST", "localhost")
	port := envOrDefault("DB_PORT", "5432")
	user := envOrDefault("DB_USER", "derp_app")
	pass := envOrDefault("DB_PASS", "derp_app_pwd")
	name := envOrDefault("DB_NAME", "derp_legacy")
	sslmode := envOrDefault("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, pass, name, sslmode,
	)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	// Retry ping to handle container startup ordering
	for attempt := 1; attempt <= 10; attempt++ {
		if err := db.Ping(); err != nil {
			if attempt == 10 {
				return nil, fmt.Errorf("failed to ping database after %d attempts: %w", attempt, err)
			}
			log.Printf("Database not ready (attempt %d/10): %v — retrying in 2s", attempt, err)
			time.Sleep(2 * time.Second)
			continue
		}
		break
	}

	return db, nil
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
