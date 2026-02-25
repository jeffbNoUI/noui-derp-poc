// Package api — vendor HTTP handlers for the DERP connector service.
// Provides endpoints for enrollment queue and vendor dashboard statistics.
// Consumed by: router.go (endpoint registration), intelligence service (via HTTP)
// Depends on: db/vendor_queries.go, models/vendor.go, response.go (envelope)
package api

import (
	"log"
	"net/http"
)

// GetEnrollmentQueue handles GET /api/v1/vendor/enrollment-queue
// Returns recently retired members pending vendor enrollment processing.
func (h *Handlers) GetEnrollmentQueue(w http.ResponseWriter, r *http.Request) {
	items, err := h.q.GetEnrollmentQueue()
	if err != nil {
		log.Printf("ERROR: GetEnrollmentQueue: %v", err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve enrollment queue")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"queue": items,
		"count": len(items),
	})
}

// GetVendorStats handles GET /api/v1/vendor/stats
// Returns aggregate vendor dashboard statistics.
func (h *Handlers) GetVendorStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.q.GetVendorStats()
	if err != nil {
		log.Printf("ERROR: GetVendorStats: %v", err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve vendor stats")
		return
	}

	WriteJSON(w, r, http.StatusOK, stats)
}
