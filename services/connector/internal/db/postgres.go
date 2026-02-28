// Package db provides PostgreSQL database access for the DERP connector service.
// Consumed by: api.Handlers (via db.Queries)
// Depends on: database/sql, lib/pq (PostgreSQL driver)
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
// DB_PASS is required (no default) to prevent accidental use of hardcoded credentials.
// DB_SSLMODE defaults to "require" — override to "disable" for local dev via docker-compose.
// Retries up to 10 times with 2-second intervals to handle container startup ordering.
func Connect() (*sql.DB, error) {
	host := envOrDefault("DB_HOST", "localhost")
	port := envOrDefault("DB_PORT", "5432")
	user := envOrDefault("DB_USER", "derp_app")
	name := envOrDefault("DB_NAME", "derp_legacy")
	sslmode := envOrDefault("DB_SSLMODE", "require")

	pass := os.Getenv("DB_PASS")
	if pass == "" {
		return nil, fmt.Errorf("DB_PASS environment variable is required")
	}

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		host, port, user, pass, name, sslmode,
	)

	database, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(5)
	database.SetConnMaxLifetime(30 * time.Minute)
	database.SetConnMaxIdleTime(5 * time.Minute)

	// Retry ping to handle container startup ordering
	for attempt := 1; attempt <= 10; attempt++ {
		if err := database.Ping(); err != nil {
			if attempt == 10 {
				return nil, fmt.Errorf("failed to ping database after %d attempts: %w", attempt, err)
			}
			log.Printf("Database not ready (attempt %d/10): %v — retrying in 2s", attempt, err)
			time.Sleep(2 * time.Second)
			continue
		}
		break
	}

	return database, nil
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
