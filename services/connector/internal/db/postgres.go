// Package db provides PostgreSQL database access for the DERP connector service.
package db

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

// Connect establishes a connection to the PostgreSQL database using environment variables.
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

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
