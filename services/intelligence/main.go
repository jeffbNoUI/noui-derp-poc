// Intelligence Service for DERP NoUI POC
//
// The intelligence service implements the DERP rules engine — deterministic
// business logic for eligibility evaluation, benefit calculation, payment
// options, and DRO processing. It fetches member data from the connector
// service and applies governing plan provisions.
//
// AI does NOT execute business rules. All calculations are deterministic code
// executing certified rule configurations.
//
// Endpoints:
//   POST /api/v1/eligibility/evaluate  - Evaluate retirement eligibility
//   POST /api/v1/benefit/calculate     - Calculate retirement benefit
//   POST /api/v1/benefit/options       - Calculate payment options
//   POST /api/v1/benefit/scenario      - Compare retirement scenarios
//   POST /api/v1/dro/calculate         - Calculate DRO impact
//   GET  /healthz                      - Health check
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/api"
	"github.com/noui-derp-poc/intelligence/internal/connector"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting DERP Intelligence service v0.1.0")

	// Create connector client
	conn := connector.NewClient()
	log.Printf("Connector URL: %s", os.Getenv("CONNECTOR_URL"))

	// Set up handlers and router
	handlers := api.NewHandlers(conn)
	router := api.NewRouter(handlers)

	// Configure server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second, // Higher than connector — calculations take longer
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
