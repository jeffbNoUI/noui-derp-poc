// HTTP router and middleware for the DERP Intelligence Service.
// Consumed by: main.go
// Depends on: handlers.go (endpoint implementations), response.go (request ID context)
package api

import (
	"log"
	"net/http"
	"strings"
	"time"
)

// NewRouter creates the HTTP router with all endpoints registered.
func NewRouter(h *Handlers) http.Handler {
	mux := http.NewServeMux()

	// Health/readiness checks
	mux.HandleFunc("/healthz", h.Health)
	mux.HandleFunc("/readyz", h.Ready)

	// Eligibility: GET /api/v1/eligibility/{memberId} or POST /api/v1/eligibility/evaluate
	mux.HandleFunc("/api/v1/eligibility/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/eligibility/")

		if r.Method == http.MethodGet {
			// GET /api/v1/eligibility/{memberId}?retirementDate=...
			if path == "" || path == "evaluate" {
				WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required in URL path")
				return
			}
			h.EvaluateEligibility(w, r)
			return
		}

		if r.Method == http.MethodPost && (path == "evaluate" || path == "evaluate/") {
			h.EvaluateEligibility(w, r)
			return
		}

		WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Use GET /api/v1/eligibility/{memberId} or POST /api/v1/eligibility/evaluate")
	})

	// Benefit: GET /api/v1/benefit/{memberId} or POST endpoints
	mux.HandleFunc("/api/v1/benefit/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/benefit/")

		// POST endpoints
		if r.Method == http.MethodPost {
			switch {
			case path == "calculate" || path == "calculate/":
				h.CalculateBenefit(w, r)
			case path == "options" || path == "options/":
				h.CalculatePaymentOptions(w, r)
			case path == "scenario" || path == "scenario/":
				h.CalculateScenario(w, r)
			default:
				WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "Unknown benefit endpoint: "+path)
			}
			return
		}

		// GET /api/v1/benefit/{memberId} or GET /api/v1/benefit/options/{memberId}
		if r.Method == http.MethodGet {
			if path == "" || path == "calculate" || path == "options" || path == "scenario" {
				WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required in URL path")
				return
			}
			// GET /api/v1/benefit/options/{memberId}?retirementDate=...
			if strings.HasPrefix(path, "options/") {
				h.CalculatePaymentOptions(w, r)
				return
			}
			h.CalculateBenefit(w, r)
			return
		}

		WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET and POST are supported")
	})

	// DRO: GET /api/v1/dro/{memberId}?retirementDate=... or POST /api/v1/dro/calculate
	mux.HandleFunc("/api/v1/dro/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/dro/")

		if r.Method == http.MethodPost && (path == "calculate" || path == "calculate/") {
			h.CalculateDRO(w, r)
			return
		}

		if r.Method == http.MethodGet {
			if path == "" || path == "calculate" {
				WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required in URL path")
				return
			}
			h.CalculateDRO(w, r)
			return
		}

		WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Use GET /api/v1/dro/{memberId} or POST /api/v1/dro/calculate")
	})

	// Scenario: GET /api/v1/scenario/{memberId}?retirementDate=...&what_if_retirement_date=...
	mux.HandleFunc("/api/v1/scenario/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/scenario/")

		if r.Method == http.MethodGet {
			if path == "" {
				WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required in URL path")
				return
			}
			h.CalculateScenario(w, r)
			return
		}

		WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Use GET /api/v1/scenario/{memberId}")
	})

	// Full pipeline: GET /api/v1/retirement-estimate/{memberId}?retirementDate=...
	mux.HandleFunc("/api/v1/retirement-estimate/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/retirement-estimate/")

		if r.Method == http.MethodGet {
			if path == "" {
				WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required in URL path")
				return
			}
			h.RetirementEstimate(w, r)
			return
		}

		WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Use GET /api/v1/retirement-estimate/{memberId}")
	})

	// Data Quality: GET /api/v1/data-quality/summary
	mux.HandleFunc("/api/v1/data-quality/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/data-quality/")

		if r.Method == http.MethodGet {
			if path == "summary" || path == "summary/" || path == "" {
				h.CheckDataQuality(w, r)
				return
			}
			WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "Unknown data-quality endpoint: "+path)
			return
		}

		WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Use GET /api/v1/data-quality/summary")
	})

	// Apply middleware chain: CORS → Request ID → Logging
	return corsMiddleware(requestIDMiddleware(logMiddleware(mux)))
}

// requestIDMiddleware generates a UUID v4 request ID and attaches it to the context.
func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := newRequestID()
		ctx := ContextWithRequestID(r.Context(), id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// corsMiddleware adds CORS headers for frontend development.
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID")
		w.Header().Set("Access-Control-Expose-Headers", "X-Request-ID")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// logMiddleware logs request method, path, status, and duration in structured JSON.
func logMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(sw, r)
		reqID := RequestIDFromContext(r.Context())
		log.Printf(`{"requestId":"%s","method":"%s","path":"%s","status":%d,"duration":"%v"}`,
			reqID, r.Method, r.URL.Path, sw.status, time.Since(start))
	})
}

// statusWriter wraps http.ResponseWriter to capture the status code.
type statusWriter struct {
	http.ResponseWriter
	status int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.status = code
	sw.ResponseWriter.WriteHeader(code)
}
