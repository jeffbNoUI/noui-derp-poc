// Package api — HTTP handlers for death and survivor benefit endpoints.
// Provides REST endpoints for death notification, survivor claims, and
// death benefit election retrieval.
//
// Consumed by: router.go (registers these handlers on the mux)
// Depends on: db/death_queries.go (database access), models/death_survivor.go (types)
package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/noui-derp-poc/connector/internal/models"
)

// GetDeathRecord handles GET /api/v1/members/{id}/death
// Returns the death record and processing status for a member.
func (h *Handlers) GetDeathRecord(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	deathRec, err := h.q.GetDeathRecord(memberID)
	if err != nil {
		log.Printf("ERROR: GetDeathRecord(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve death record")
		return
	}

	// Also get death benefit election and overpayments if death record exists
	var election *models.DeathBenefitElection
	var overpayments []models.OverpaymentRecord
	if deathRec != nil {
		election, _ = h.q.GetDeathBenefitElection(memberID)
		overpayments, _ = h.q.GetOverpaymentRecords(memberID)
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"member_id":               memberID,
		"death_record":            deathRec,
		"death_benefit_election":  election,
		"overpayment_records":     overpayments,
		"has_death_record":        deathRec != nil,
	})
}

// GetSurvivorClaims handles GET /api/v1/members/{id}/survivor-claims
// Returns all survivor benefit claims for a deceased member.
func (h *Handlers) GetSurvivorClaims(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	claims, err := h.q.GetSurvivorClaims(memberID)
	if err != nil {
		log.Printf("ERROR: GetSurvivorClaims(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve survivor claims")
		return
	}

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"member_id":       memberID,
		"claim_count":     len(claims),
		"survivor_claims": claims,
	})
}

// PostDeathNotification handles POST /api/v1/members/{id}/death/notify
// Registers a death notification and immediately suspends benefit payments.
func (h *Handlers) PostDeathNotification(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	// Verify member exists
	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, r, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB limit
	var req models.DeathNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body: "+err.Error())
		return
	}
	req.MemberID = memberID

	if req.NotifySource == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "notification_source is required")
		return
	}

	deathRecID, err := h.q.SaveDeathNotification(&req)
	if err != nil {
		log.Printf("ERROR: SaveDeathNotification(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save death notification: "+err.Error())
		return
	}

	WriteJSON(w, r, http.StatusCreated, map[string]interface{}{
		"member_id":       memberID,
		"death_record_id": deathRecID,
		"status":          "NOTIFIED",
		"benefit_suspended": true,
		"message":         "Death notification recorded. Benefit payments suspended pending death certificate verification.",
	})
}

// PostSurvivorClaim handles POST /api/v1/members/{id}/survivor-claims
// Creates a new survivor benefit claim.
func (h *Handlers) PostSurvivorClaim(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	// Verify death record exists
	deathRec, err := h.q.GetDeathRecord(memberID)
	if err != nil {
		log.Printf("ERROR: GetDeathRecord(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve death record")
		return
	}
	if deathRec == nil {
		WriteError(w, r, http.StatusBadRequest, "NO_DEATH_RECORD",
			"No death record found for member "+memberID+". Submit a death notification first.")
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB limit
	var req models.SurvivorClaimRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body: "+err.Error())
		return
	}
	req.MemberID = memberID

	if req.ClaimType == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "claim_type is required")
		return
	}
	if req.SurvivorFirst == "" || req.SurvivorLast == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "survivor name is required")
		return
	}

	claimID, err := h.q.SaveSurvivorClaim(&req, deathRec.DeathRecordID)
	if err != nil {
		log.Printf("ERROR: SaveSurvivorClaim(%s): %v", memberID, err)
		WriteError(w, r, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to save survivor claim: "+err.Error())
		return
	}

	WriteJSON(w, r, http.StatusCreated, map[string]interface{}{
		"member_id": memberID,
		"claim_id":  claimID,
		"status":    "PENDING",
		"message":   "Survivor benefit claim submitted for review.",
	})
}
