// Refund-domain HTTP handler for the intelligence service.
// Provides the POST /api/v1/refund/calculate endpoint for full refund computation.
//
// Consumed by: intelligence/internal/api/router.go
// Depends on: intelligence/internal/refund/calculator.go, intelligence/internal/models/models.go
package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/refund"
)

// RefundRequest is the request body for POST /api/v1/refund/calculate.
type RefundRequest struct {
	MemberID        string  `json:"member_id"`
	StatusCode      string  `json:"status_code"`
	TerminationDate string  `json:"termination_date"`  // YYYY-MM-DD
	ApplicationDate string  `json:"application_date"`   // YYYY-MM-DD
	HireDate        string  `json:"hire_date"`          // YYYY-MM-DD
	ServiceYears    float64 `json:"service_years"`
	HasRetirementApp bool   `json:"has_retirement_application"`
	Tier            int     `json:"tier"`
	AMS             float64 `json:"ams,omitempty"`      // For deferred comparison (vested)
	CurrentAge      int     `json:"current_age"`
	// MonthlySalaries contains the salary history for contribution calculation
	MonthlySalaries []refund.MonthlySalary `json:"monthly_salaries"`
}

// CalculateRefund handles POST /api/v1/refund/calculate
func (h *Handlers) CalculateRefund(w http.ResponseWriter, r *http.Request) {
	var req RefundRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id is required")
		return
	}
	if req.TerminationDate == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "termination_date is required")
		return
	}
	if req.ApplicationDate == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "application_date is required")
		return
	}
	if req.HireDate == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "hire_date is required")
		return
	}

	termDate, err := time.Parse("2006-01-02", req.TerminationDate)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid termination_date format (use YYYY-MM-DD)")
		return
	}
	appDate, err := time.Parse("2006-01-02", req.ApplicationDate)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid application_date format (use YYYY-MM-DD)")
		return
	}
	hireDate, err := time.Parse("2006-01-02", req.HireDate)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid hire_date format (use YYYY-MM-DD)")
		return
	}

	eligInput := refund.EligibilityInput{
		StatusCode:       req.StatusCode,
		TerminationDate:  termDate,
		ApplicationDate:  appDate,
		ServiceYears:     req.ServiceYears,
		HasRetirementApp: req.HasRetirementApp,
	}

	result := refund.CalculateRefundSummary(
		req.MemberID,
		eligInput,
		req.MonthlySalaries,
		hireDate,
		termDate,
		req.Tier,
		req.AMS,
		req.CurrentAge,
	)

	log.Printf("AUDIT: CalculateRefund member=%s contributions=%.2f interest=%.2f gross=%.2f vested=%v",
		req.MemberID, result.Contributions.TotalContributions, result.Interest.TotalInterest,
		result.GrossRefund, result.Eligibility.Vested)

	WriteJSON(w, r, http.StatusOK, result)
}
