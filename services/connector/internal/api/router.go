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

	// Health check
	mux.HandleFunc("/healthz", h.Health)

	// Member APIs
	mux.HandleFunc("/api/v1/members/", func(w http.ResponseWriter, r *http.Request) {
		// Route based on path suffix
		path := strings.TrimPrefix(r.URL.Path, "/api/v1/members/")
		parts := strings.Split(path, "/")

		// POST endpoints
		if r.Method == http.MethodPost && len(parts) == 2 && parts[1] == "retirement-election" {
			h.SaveElection(w, r)
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
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported for this resource")
			return
		}

		// All remaining non-GET methods are rejected
		if r.Method != http.MethodGet {
			WriteError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only GET is supported for this resource")
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
			case "death":
				h.GetDeathRecord(w, r)
			case "survivor-claims":
				h.GetSurvivorClaims(w, r)
			default:
				WriteError(w, http.StatusNotFound, "NOT_FOUND", "Unknown resource: "+parts[1])
			}
		} else {
			WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid path")
		}
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
