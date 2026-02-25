package api

import (
	"log"
	"net/http"
	"time"
)

// NewRouter creates the HTTP router with all endpoints registered.
func NewRouter(h *Handlers) http.Handler {
	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/healthz", h.Health)

	// Intelligence APIs
	mux.HandleFunc("/api/v1/eligibility/evaluate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.EvaluateEligibility(w, r)
	})

	mux.HandleFunc("/api/v1/benefit/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateBenefit(w, r)
	})

	mux.HandleFunc("/api/v1/benefit/options", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculatePaymentOptions(w, r)
	})

	mux.HandleFunc("/api/v1/benefit/scenario", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateScenario(w, r)
	})

	mux.HandleFunc("/api/v1/dro/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateDRO(w, r)
	})

	mux.HandleFunc("/api/v1/refund/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateRefund(w, r)
	})

	return logMiddleware(mux)
}

// logMiddleware logs request method, path, and duration.
func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s %v", r.Method, r.URL.Path, time.Since(start))
	})
}
