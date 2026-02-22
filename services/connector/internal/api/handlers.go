package api

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/noui-derp-poc/connector/internal/ams"
	"github.com/noui-derp-poc/connector/internal/db"
	"github.com/noui-derp-poc/connector/internal/models"
)

// Handlers provides HTTP handlers backed by database queries.
type Handlers struct {
	q *db.Queries
}

// NewHandlers creates a new Handlers instance.
func NewHandlers(q *db.Queries) *Handlers {
	return &Handlers{q: q}
}

// extractMemberID extracts the member ID from the URL path.
// Expected path format: /api/v1/members/{id} or /api/v1/members/{id}/resource
func extractMemberID(path string) string {
	parts := strings.Split(strings.TrimPrefix(path, "/"), "/")
	// /api/v1/members/{id}...  → parts: [api, v1, members, {id}, ...]
	if len(parts) >= 4 && parts[0] == "api" && parts[1] == "v1" && parts[2] == "members" {
		return parts[3]
	}
	return ""
}

// Health handles GET /healthz
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "connector",
		"version": "0.1.0",
	})
}

// GetMember handles GET /api/v1/members/{id}
func (h *Handlers) GetMember(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	WriteJSON(w, http.StatusOK, member)
}

// GetEmployment handles GET /api/v1/members/{id}/employment
func (h *Handlers) GetEmployment(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	// First verify member exists
	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	events, err := h.q.GetEmploymentHistory(memberID)
	if err != nil {
		log.Printf("ERROR: GetEmploymentHistory(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve employment history")
		return
	}

	// Get service credit summary
	credits, err := h.q.GetServiceCredits(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredits(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve service credits")
		return
	}

	summary := buildServiceCreditSummary(credits)

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id":      memberID,
		"events":         events,
		"service_credit": summary,
	})
}

// SalaryResponse wraps the salary history and AMS calculation.
type SalaryResponse struct {
	MemberID       string                `json:"member_id"`
	Tier           int                   `json:"tier"`
	AMS            *models.AMSCalculation `json:"ams_calculation"`
	LeaveEligible  bool                  `json:"leave_payout_eligible"`
	LeaveNote      string                `json:"leave_payout_note,omitempty"`
	RecordCount    int                   `json:"salary_record_count"`
}

// GetSalary handles GET /api/v1/members/{id}/salary
func (h *Handlers) GetSalary(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	member, err := h.q.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve member")
		return
	}
	if member == nil {
		WriteError(w, http.StatusNotFound, "MEMBER_NOT_FOUND",
			"No member found with ID "+memberID)
		return
	}

	records, err := h.q.GetSalaryHistory(memberID, nil, nil)
	if err != nil {
		log.Printf("ERROR: GetSalaryHistory(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve salary history")
		return
	}

	// Aggregate biweekly records into monthly
	monthlies := ams.AggregateBiweeklyToMonthly(records)

	// Determine leave payout eligibility
	// RULE-LEAVE-PAYOUT: hired before Jan 1, 2010 AND sick/vacation leave
	leaveEligible := false
	leaveNote := ""
	if member.HireDate != nil {
		cutoff := time.Date(2010, 1, 1, 0, 0, 0, 0, time.UTC)
		if member.HireDate.Before(cutoff) {
			// Check if any records have SICK_VAC leave payout
			for _, rec := range records {
				if rec.LeavePayoutAmt != nil && *rec.LeavePayoutAmt > 0 &&
					(rec.LeavePayoutTyp == "SICK_VAC" || rec.LeavePayoutTyp == "sick_vacation") {
					leaveEligible = true
					leaveNote = "Hired before 2010-01-01 with sick/vacation leave"
					break
				}
			}
			if !leaveEligible {
				leaveNote = "Hired before 2010-01-01 but no sick/vacation leave payout found"
			}
		} else {
			leaveNote = "Not eligible — hired on or after 2010-01-01"
		}
	}

	windowSize := ams.WindowSize(member.Tier)
	amsResult := ams.Calculate(monthlies, windowSize, leaveEligible)

	resp := SalaryResponse{
		MemberID:      memberID,
		Tier:          member.Tier,
		AMS:           amsResult,
		LeaveEligible: leaveEligible,
		LeaveNote:     leaveNote,
		RecordCount:   len(records),
	}

	WriteJSON(w, http.StatusOK, resp)
}

// GetBeneficiaries handles GET /api/v1/members/{id}/beneficiaries
func (h *Handlers) GetBeneficiaries(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	benes, err := h.q.GetBeneficiaries(memberID)
	if err != nil {
		log.Printf("ERROR: GetBeneficiaries(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve beneficiaries")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id":     memberID,
		"beneficiaries": benes,
	})
}

// GetDRO handles GET /api/v1/members/{id}/dro
func (h *Handlers) GetDRO(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	dros, err := h.q.GetDROs(memberID)
	if err != nil {
		log.Printf("ERROR: GetDROs(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve DRO records")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id": memberID,
		"has_dro":   len(dros) > 0,
		"dro_count": len(dros),
		"dros":      dros,
	})
}

// GetContributions handles GET /api/v1/members/{id}/contributions
func (h *Handlers) GetContributions(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	summary, err := h.q.GetContributionSummary(memberID)
	if err != nil {
		log.Printf("ERROR: GetContributionSummary(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve contributions")
		return
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id": memberID,
		"summary":   summary,
	})
}

// GetServiceCredit handles GET /api/v1/members/{id}/service-credit
func (h *Handlers) GetServiceCredit(w http.ResponseWriter, r *http.Request) {
	memberID := extractMemberID(r.URL.Path)
	if memberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Member ID is required")
		return
	}

	credits, err := h.q.GetServiceCredits(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredits(%s): %v", memberID, err)
		WriteError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to retrieve service credits")
		return
	}

	summary := buildServiceCreditSummary(credits)

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id": memberID,
		"records":   credits,
		"summary":   summary,
	})
}

// buildServiceCreditSummary computes the separated service totals from credit records.
// CRITICAL: This correctly separates earned vs purchased service for different rule contexts.
// - BENEFIT CALCULATION uses total (earned + purchased)
// - RULE OF 75/85 and IPR use earned only
func buildServiceCreditSummary(credits []models.ServiceCredit) models.ServiceCreditSummary {
	var s models.ServiceCreditSummary
	for _, c := range credits {
		switch c.ServiceType {
		case "EMPL":
			s.EarnedYears += c.YearsCredit
		case "PURCH":
			s.PurchasedYears += c.YearsCredit
		case "MILITARY":
			s.MilitaryYears += c.YearsCredit
		case "LEAVE":
			s.LeaveYears += c.YearsCredit
		}

		if c.InclBenefit {
			s.TotalForBenefit += c.YearsCredit
		}
		if c.InclElig {
			s.TotalForElig += c.YearsCredit
		}
		if c.InclIPR {
			s.TotalForIPR += c.YearsCredit
		}
	}
	return s
}
