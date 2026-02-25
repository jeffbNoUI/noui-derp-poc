// HTTP router and middleware for the DERP Data Connector service.
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

		// All other endpoints are GET only
		if r.Method != http.MethodGet {
			WriteError(w, r, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported for this resource")
			return
		}

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

	// Apply middleware chain: CORS → Request ID → Logging
	return corsMiddleware(requestIDMiddleware(logMiddleware(mux)))
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

