// Workspace Composition Service for DERP NoUI POC
//
// The workspace service determines which UI components to render based on member
// data, process type, and context. It fetches member data from the connector
// service and applies composition rules to select stages and components.
//
// AI composes the workspace to show the right information for each situation.
// The rules engine (intelligence service) decides what the numbers are.
//
// Endpoints:
//   POST /api/v1/composition/evaluate  - Evaluate workspace composition
//   GET  /healthz                      - Health check
//   GET  /readyz                       - Readiness check (pings connector)
package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/noui/workspace/internal/api"
	"github.com/noui/workspace/internal/composition"
	"github.com/noui/workspace/internal/connector"
)

func main() {
	log.SetFlags(log.LstdFlags | log.Lshortfile)
	log.Println("Starting DERP Workspace Composition service v0.1.0")

	// Create connector client
	connURL := os.Getenv("CONNECTOR_URL")
	if connURL == "" {
		connURL = "http://localhost:8081"
	}
	conn := connector.NewClient(connURL)
	log.Printf("Connector URL: %s", connURL)

	// Create composition engine
	engine := composition.NewEngine()

	// Set up handlers and router
	handlers := api.NewHandlers(engine, conn)
	router := api.NewRouter(handlers)

	// Configure server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8083"
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
