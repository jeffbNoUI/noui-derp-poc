// HTTP router and middleware for the DERP Data Connector service.
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

	// Member search
	mux.HandleFunc("/api/v1/members/search", h.SearchMembers)

	// Data quality endpoint (XS-13: lives in Connector)
	mux.HandleFunc("/api/v1/data-quality/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetDataQuality(w, r)
	})

	// Member APIs
	mux.HandleFunc("/api/v1/members/", func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/members/")
		parts := strings.Split(path, "/")

		// POST endpoints
		if r.Method == http.MethodPost && len(parts) == 2 && parts[1] == "retirement-election" {
			h.SaveElection(w, r)
			return
		}
		if r.Method == http.MethodPost && len(parts) == 2 && parts[1] == "refund" {
			h.SaveRefundApplication(w, r)
			return
		}

		// Death & survivor POST endpoints
		if r.Method == http.MethodPost {
			if len(parts) == 3 && parts[1] == "death" && parts[2] == "notify" {
				h.PostDeathNotification(w, r)
				return
			}
			if len(parts) == 2 && parts[1] == "survivor-claims" {
				h.PostSurvivorClaim(w, r)
				return
			}
			// Unrecognized POST — reject
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported for this resource")
			return
		}

		// All remaining non-GET methods are rejected
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported for this resource")
			return
		}

		// GET endpoints
		if len(parts) == 1 && parts[0] != "" {
			// GET /api/v1/members/{id}
			h.GetMember(w, r)
		} else if len(parts) == 2 {
			switch parts[1] {
			case "employment":
				h.GetEmployment(w, r)
			case "salary":
				h.GetSalary(w, r)
			case "beneficiaries":
				h.GetBeneficiaries(w, r)
			case "dro":
				h.GetDRO(w, r)
			case "contributions":
				h.GetContributions(w, r)
			case "service-credit":
				h.GetServiceCredit(w, r)
			case "refund":
				h.GetRefundApplication(w, r)
			case "death":
				h.GetDeathRecord(w, r)
			case "survivor-claims":
				h.GetSurvivorClaims(w, r)
			default:
				WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "Unknown resource: "+parts[1])
			}
		} else if len(parts) == 3 {
			// /api/v1/members/{id}/contributions/history
			if parts[1] == "contributions" && parts[2] == "history" {
				h.GetContributionHistory(w, r)
			} else {
				WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "Unknown resource: "+parts[1]+"/"+parts[2])
			}
		} else {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid path")
		}
	})

	// Employer APIs
	mux.HandleFunc("/api/v1/employer/departments", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetDepartments(w, r)
	})
	mux.HandleFunc("/api/v1/employer/departments/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/employer/departments/")
		parts := strings.Split(path, "/")
		if len(parts) == 2 {
			switch parts[1] {
			case "employees":
				h.GetDepartmentEmployees(w, r)
			case "stats":
				h.GetDepartmentStats(w, r)
			default:
				WriteError(w, r, http.StatusNotFound, "NOT_FOUND", "Unknown department resource: "+parts[1])
			}
		} else {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid employer path")
		}
	})
	mux.HandleFunc("/api/v1/employer/contributions", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetContributionReports(w, r)
	})
	mux.HandleFunc("/api/v1/employer/retirements", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetPendingRetirements(w, r)
	})

	// Vendor APIs
	mux.HandleFunc("/api/v1/vendor/enrollment-queue", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetEnrollmentQueue(w, r)
	})
	mux.HandleFunc("/api/v1/vendor/stats", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported")
			return
		}
		h.GetVendorStats(w, r)
	})

	// Apply middleware chain: Recover → CORS → Auth → Request ID → Logging
	return recoverMiddleware(corsMiddleware(authMiddleware(DefaultAuthenticator())(requestIDMiddleware(logMiddleware(mux)))))
}

// requestIDMiddleware generates a UUID v4 request ID and attaches it to the context.
// The ID is propagated in all responses via ResponseMeta.requestId.
func requestIDMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := newRequestID()
		ctx := ContextWithRequestID(r.Context(), id)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// allowedOrigins returns the configured CORS origins from ALLOWED_ORIGINS env var.
// Defaults to http://localhost:5175 for local development.
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
// Set ALLOWED_ORIGINS env var (comma-separated) to control which origins are permitted.
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

// logMiddleware logs request method, path, status, and duration in structured JSON format.
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

