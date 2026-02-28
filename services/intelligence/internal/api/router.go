// HTTP router and middleware for the DERP Intelligence Service.
// Consumed by: main.go
// Depends on: handlers.go (endpoint implementations), response.go (request ID context), auth.go (identity)
package api

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime/debug"
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

	// Refund: POST /api/v1/refund/calculate
	mux.HandleFunc("/api/v1/refund/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateRefund(w, r)
	})

	// Death & Survivor: POST /api/v1/death/process, POST /api/v1/survivor/calculate
	mux.HandleFunc("/api/v1/death/process", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.ProcessDeath(w, r)
	})

	mux.HandleFunc("/api/v1/survivor/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateSurvivor(w, r)
	})

	// Employer overview
	mux.HandleFunc("/api/v1/employer/overview", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetEmployerOverview(w, r)
	})

	// Vendor IPR calculation
	mux.HandleFunc("/api/v1/vendor/ipr/calculate", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is supported")
			return
		}
		h.CalculateVendorIPR(w, r)
	})

	// Apply middleware chain: Recover → CORS → Auth → Request ID → Logging
	return recoverMiddleware(corsMiddleware(authMiddleware(DefaultAuthenticator())(requestIDMiddleware(logMiddleware(mux)))))
}

// requestIDMiddleware generates a UUID v4 request ID and attaches it to the context.
func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := newRequestID()
		ctx := ContextWithRequestID(r.Context(), id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// allowedOrigins returns the configured CORS origins from ALLOWED_ORIGINS env var.
func allowedOrigins() []string {
	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		return []string{"http://localhost:5175"}
	}
	parts := strings.Split(origins, ",")
	result := make([]string, 0, len(parts))
	for _, p := range parts {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			result = append(result, trimmed)
		}
	}
	return result
}

// corsMiddleware adds CORS headers with configurable allowed origins.
func corsMiddleware(next http.Handler) http.Handler {
	origins := allowedOrigins()
	allowed := make(map[string]bool, len(origins))
	for _, o := range origins {
		allowed[o] = true
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}
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

// recoverMiddleware catches panics in downstream handlers and returns a 500 JSON error.
func recoverMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				stack := debug.Stack()
				reqID := RequestIDFromContext(r.Context())
				log.Printf("PANIC: %v\nRequest: %s %s\nRequestID: %s\nStack:\n%s",
					err, r.Method, r.URL.Path, reqID, stack)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusInternalServerError)
				fmt.Fprintf(w, `{"error":{"code":"INTERNAL_ERROR","message":"Internal server error"},"meta":{"requestId":%q}}`, reqID)
			}
		}()
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
		log.Printf(`{"requestId":%q,"method":%q,"path":%q,"status":%d,"duration":%q}`,
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
