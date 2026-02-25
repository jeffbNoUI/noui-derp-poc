// Package api provides HTTP routing for the workspace composition service.
//
// Follows the same middleware chain as connector and intelligence:
// CORS -> RequestID -> Logging
//
// Consumed by: main.go (creates router from handlers)
// Depends on: handlers.go (route handlers)
package api

import (
	"log"
	"net/http"
	"time"
)

// NewRouter creates the HTTP router with all endpoints registered.
func NewRouter(h *Handlers) http.Handler {
	mux := http.NewServeMux()

	// Health and readiness checks
	mux.HandleFunc("/healthz", h.Health)
	mux.HandleFunc("/readyz", h.Ready)

	// Composition API
	mux.HandleFunc("/api/v1/composition/evaluate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.EvaluateComposition(w, r)
	})

	return corsMiddleware(logMiddleware(mux))
}

// corsMiddleware adds permissive CORS headers for the POC.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// logMiddleware logs request method, path, and duration.
func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}
