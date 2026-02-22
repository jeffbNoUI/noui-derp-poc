// Data Connector Service for DERP NoUI POC
//
// The connector is the sole interface between the legacy PostgreSQL database
// and all other services. No other service accesses the database directly.
//
// Endpoints:
//   GET /healthz                           - Health check
//   GET /api/v1/members/{id}               - Member profile
//   GET /api/v1/members/{id}/employment    - Employment history + service credit
//   GET /api/v1/members/{id}/salary        - Salary history + AMS calculation
//   GET /api/v1/members/{id}/beneficiaries - Beneficiary records
//   GET /api/v1/members/{id}/dro           - Domestic Relations Orders
//   GET /api/v1/members/{id}/contributions - Contribution history + summary
//   GET /api/v1/members/{id}/service-credit - Service credit breakdown
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/noui-derp-poc/connector/internal/api"
	"github.com/noui-derp-poc/connector/internal/db"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting DERP Data Connector service v0.1.0")

	// Connect to database
	database, err := db.Connect()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()
	log.Println("Connected to database")

	// Set up handlers and router
	queries := db.NewQueries(database)
	handlers := api.NewHandlers(queries)
	router := api.NewRouter(handlers)

	// Configure server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	sig := <-quit
	log.Printf("Received signal %v, shutting down...", sig)

	// Graceful shutdown with 30 second timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}
	log.Println("Server stopped gracefully")
}
