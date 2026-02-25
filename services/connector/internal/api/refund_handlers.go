// Refund-domain HTTP handlers for the connector service.
// Provides contribution history, refund application status, and refund submission endpoints.
//
// Consumed by: connector/internal/api/router.go (registered on /api/v1/members/{id}/...)
// Depends on: connector/internal/db/refund_queries.go, connector/internal/models/refund.go
package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/noui-derp-poc/connector/internal/models"
)

// GetContributionHistory handles GET /api/v1/members/{id}/contributions/history
// Returns detailed monthly contribution ledger for refund calculation.
func (h *Handlers) GetContributionHistory(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	// Verify member exists
	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, http.StatusNotFound, "MEMBER_NOT_FOUND", "No member found with ID "+memberID)
		return
	}

	// Get contribution ledger
	ledger, err := h.q.GetContributionLedger(memberID)
	if err != nil {
		log.Printf("ERROR: GetContributionLedger(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve contribution ledger")
		return
	}

	// Get interest credits
	interests, err := h.q.GetInterestCredits(memberID)
	if err != nil {
		log.Printf("ERROR: GetInterestCredits(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve interest credits")
		return
	}

	// Sum totals
	var totalContrib, totalInterest float64
	for _, e := range ledger {
		totalContrib += e.EmplContrib
	}
	for _, ic := range interests {
		totalInterest += ic.InterestAmt
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id":          memberID,
		"contribution_ledger": ledger,
		"interest_credits":   interests,
		"total_contributions": totalContrib,
		"total_interest":     totalInterest,
		"record_count":       len(ledger),
	})
}

// GetRefundApplication handles GET /api/v1/members/{id}/refund
// Returns the current refund application status.
func (h *Handlers) GetRefundApplication(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	app, err := h.q.GetRefundApplication(memberID)
	if err != nil {
		log.Printf("ERROR: GetRefundApplication(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve refund application")
		return
	}

	if app == nil {
		WriteJSON(w, http.StatusOK, map[string]interface{}{
			"member_id":      memberID,
			"has_application": false,
		})
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id":      memberID,
		"has_application": true,
		"application":    app,
	})
}

// SaveRefundApplication handles POST /api/v1/members/{id}/refund
// Submits a new refund application.
func (h *Handlers) SaveRefundApplication(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	// Verify member exists
	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, http.StatusNotFound, "MEMBER_NOT_FOUND", "No member found with ID "+memberID)
		return
	}

	var app models.RefundApplication
	if err := json.NewDecoder(r.Body).Decode(&app); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body: "+err.Error())
		return
	}
	app.MemberID = memberID

	refundID, err := h.q.SaveRefundApplication(&app)
	if err != nil {
		log.Printf("ERROR: SaveRefundApplication(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save refund application: "+err.Error())
		return
	}

	log.Printf("AUDIT: SaveRefundApplication member=%s refund_id=%d gross=%.2f election=%s",
		memberID, refundID, app.GrossRefund, app.ElectionType)

	WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"member_id": memberID,
		"refund_id": refundID,
		"status":    app.StatusCode,
		"message":   "Refund application submitted successfully.",
	})
}
