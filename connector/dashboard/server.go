package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// Server is the monitoring dashboard HTTP server.
type Server struct {
	reportFile string
	startTime  time.Time

	mu    sync.RWMutex
	state DashboardState
}

// NewServer creates a new dashboard server that reads reports from the given file.
func NewServer(reportFile string) *Server {
	return &Server{
		reportFile: reportFile,
		startTime:  time.Now(),
		state: DashboardState{
			RunHistory: []RunSummary{},
		},
	}
}

// LoadReport reads the monitor report from disk and updates the cached state.
func (s *Server) LoadReport() error {
	data, err := os.ReadFile(s.reportFile)
	if err != nil {
		return fmt.Errorf("reading report file: %w", err)
	}

	var report MonitorReport
	if err := json.Unmarshal(data, &report); err != nil {
		return fmt.Errorf("parsing report JSON: %w", err)
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.state.Report = &report
	s.state.LastRun = time.Now()

	// Append to run history, capping at 100 entries.
	s.state.RunHistory = append(s.state.RunHistory, RunSummary{
		RunAt:       report.RunAt,
		TotalChecks: report.Summary.TotalChecks,
		Passed:      report.Summary.Passed,
		Warnings:    report.Summary.Warnings,
		Failed:      report.Summary.Failed,
	})
	if len(s.state.RunHistory) > 100 {
		s.state.RunHistory = s.state.RunHistory[len(s.state.RunHistory)-100:]
	}

	return nil
}

// Handler returns the root http.Handler with all routes registered.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/v1/health", s.handleHealth)
	mux.HandleFunc("/api/v1/monitor/report", s.handleReport)
	mux.HandleFunc("/api/v1/monitor/summary", s.handleSummary)
	mux.HandleFunc("/api/v1/monitor/checks", s.handleChecks)
	mux.HandleFunc("/api/v1/monitor/checks/", s.handleCheckByName)
	mux.HandleFunc("/api/v1/monitor/baselines", s.handleBaselines)
	mux.HandleFunc("/api/v1/monitor/history", s.handleHistory)

	return withCORS(withLogging(mux))
}

// ListenAndServe starts the HTTP server and blocks until the context is cancelled.
func (s *Server) ListenAndServe(ctx context.Context, addr string) error {
	srv := &http.Server{
		Addr:         addr,
		Handler:      s.Handler(),
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("Dashboard server listening on %s", addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
		close(errCh)
	}()

	select {
	case <-ctx.Done():
		log.Println("Shutting down dashboard server...")
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		return srv.Shutdown(shutdownCtx)
	case err := <-errCh:
		return err
	}
}

// --- Endpoint handlers ---

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	uptime := time.Since(s.startTime).Round(time.Second).String()
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "ok",
		"uptime": uptime,
	})
}

func (s *Server) handleReport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// Refresh from disk if requested.
	if r.URL.Query().Get("refresh") == "true" {
		if err := s.LoadReport(); err != nil {
			writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to refresh report: %v", err))
			return
		}
	}

	s.mu.RLock()
	report := s.state.Report
	s.mu.RUnlock()

	if report == nil {
		writeError(w, http.StatusNotFound, "no report loaded")
		return
	}

	writeJSON(w, http.StatusOK, report)
}

func (s *Server) handleSummary(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	s.mu.RLock()
	report := s.state.Report
	s.mu.RUnlock()

	if report == nil {
		writeError(w, http.StatusNotFound, "no report loaded")
		return
	}

	// Return summary + baselines for dashboard widgets.
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"run_at":    report.RunAt,
		"summary":   report.Summary,
		"baselines": report.Baselines,
	})
}

func (s *Server) handleChecks(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	s.mu.RLock()
	report := s.state.Report
	s.mu.RUnlock()

	if report == nil {
		writeError(w, http.StatusNotFound, "no report loaded")
		return
	}

	checks := report.Checks

	// Filter by status if requested.
	if statusFilter := r.URL.Query().Get("status"); statusFilter != "" {
		checks = filterChecks(checks, func(c CheckResult) bool {
			return strings.EqualFold(c.Status, statusFilter)
		})
	}

	// Filter by category if requested.
	if categoryFilter := r.URL.Query().Get("category"); categoryFilter != "" {
		checks = filterChecks(checks, func(c CheckResult) bool {
			return strings.EqualFold(c.Category, categoryFilter)
		})
	}

	writeJSON(w, http.StatusOK, checks)
}

func (s *Server) handleCheckByName(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// Extract check name from URL path: /api/v1/monitor/checks/{name}
	prefix := "/api/v1/monitor/checks/"
	name := strings.TrimPrefix(r.URL.Path, prefix)
	if name == "" {
		writeError(w, http.StatusBadRequest, "check name required")
		return
	}

	s.mu.RLock()
	report := s.state.Report
	s.mu.RUnlock()

	if report == nil {
		writeError(w, http.StatusNotFound, "no report loaded")
		return
	}

	for _, check := range report.Checks {
		if strings.EqualFold(check.CheckName, name) {
			writeJSON(w, http.StatusOK, check)
			return
		}
	}

	writeError(w, http.StatusNotFound, fmt.Sprintf("check %q not found", name))
}

func (s *Server) handleBaselines(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	s.mu.RLock()
	report := s.state.Report
	s.mu.RUnlock()

	if report == nil {
		writeError(w, http.StatusNotFound, "no report loaded")
		return
	}

	writeJSON(w, http.StatusOK, report.Baselines)
}

func (s *Server) handleHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	s.mu.RLock()
	history := s.state.RunHistory
	s.mu.RUnlock()

	writeJSON(w, http.StatusOK, history)
}

// --- Helpers ---

func filterChecks(checks []CheckResult, fn func(CheckResult) bool) []CheckResult {
	var result []CheckResult
	for _, c := range checks {
		if fn(c) {
			result = append(result, c)
		}
	}
	return result
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	if err := enc.Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

// withCORS wraps a handler to add CORS headers for local development.
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// withLogging wraps a handler to log each request to stdout.
func withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		lw := &loggingResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(lw, r)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, lw.statusCode, time.Since(start).Round(time.Microsecond))
	})
}

// loggingResponseWriter captures the status code for logging.
type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lw *loggingResponseWriter) WriteHeader(code int) {
	lw.statusCode = code
	lw.ResponseWriter.WriteHeader(code)
}
