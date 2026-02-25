// Package api — HTTP handlers for death and survivor benefit intelligence endpoints.
// Provides POST /api/v1/death/process and POST /api/v1/survivor/calculate.
//
// Consumed by: router.go (registers these handlers)
// Depends on: deathsurvivor/calculator.go (calculation engine), models/models.go (types)
package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/deathsurvivor"
)

// DeathProcessRequest is the request body for POST /api/v1/death/process.
type DeathProcessRequest struct {
	MemberID            string  `json:"member_id"`
	MemberStatus        string  `json:"member_status"`          // "active" or "retired"
	DeathDate           string  `json:"death_date"`             // YYYY-MM-DD
	NotificationDate    string  `json:"notification_date"`      // YYYY-MM-DD
	PaymentOption       string  `json:"payment_option"`         // "maximum", "75_js", etc.
	MemberBenefit       float64 `json:"member_monthly_benefit"` // Monthly benefit at death
	JSPercentage        float64 `json:"js_percentage"`          // 0.50, 0.75, 1.00, or 0
	SurvivorName        string  `json:"survivor_name"`
	DeathBenefitLumpSum float64 `json:"death_benefit_lump_sum"`
	TotalInstallments   int     `json:"total_installments"`     // 50 or 100
	RetirementDate      string  `json:"retirement_date"`        // YYYY-MM-DD
	DeathCertVerified   bool    `json:"death_certificate_verified"`
	// Payments deposited near death date for overpayment check
	RecentPayments []struct {
		DepositDate string  `json:"deposit_date"` // YYYY-MM-DD
		Amount      float64 `json:"amount"`
	} `json:"recent_payments"`
}

// SurvivorCalcRequest is the request body for POST /api/v1/survivor/calculate.
type SurvivorCalcRequest struct {
	MemberBenefit float64 `json:"member_monthly_benefit"`
	JSPercentage  float64 `json:"js_percentage"`
	SurvivorName  string  `json:"survivor_name"`
	DeathDate     string  `json:"death_date"`
}

// ProcessDeath handles POST /api/v1/death/process
// Performs the complete death processing with full audit trace.
func (h *Handlers) ProcessDeath(w http.ResponseWriter, r *http.Request) {
	var req DeathProcessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id is required")
		return
	}
	if req.DeathDate == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "death_date is required")
		return
	}

	deathDate, err := time.Parse("2006-01-02", req.DeathDate)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid death_date format (use YYYY-MM-DD)")
		return
	}

	notifyDate := time.Now()
	if req.NotificationDate != "" {
		notifyDate, err = time.Parse("2006-01-02", req.NotificationDate)
		if err != nil {
			WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid notification_date format")
			return
		}
	}

	var retDate time.Time
	if req.RetirementDate != "" {
		retDate, err = time.Parse("2006-01-02", req.RetirementDate)
		if err != nil {
			WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format")
			return
		}
	}

	// Convert payment records
	var payments []deathsurvivor.PaymentRecord
	for _, p := range req.RecentPayments {
		pd, err := time.Parse("2006-01-02", p.DepositDate)
		if err != nil {
			continue
		}
		payments = append(payments, deathsurvivor.PaymentRecord{
			DepositDate: pd,
			Amount:      p.Amount,
		})
	}

	// Run full death processing
	summary := deathsurvivor.ProcessDeathComplete(
		req.MemberID,
		req.MemberStatus,
		deathDate,
		notifyDate,
		req.PaymentOption,
		req.MemberBenefit,
		req.JSPercentage,
		req.SurvivorName,
		req.DeathBenefitLumpSum,
		req.TotalInstallments,
		retDate,
		payments,
		req.DeathCertVerified,
	)

	WriteJSON(w, http.StatusOK, summary)
}

// CalculateSurvivor handles POST /api/v1/survivor/calculate
// Calculates the J&S survivor benefit amount.
func (h *Handlers) CalculateSurvivor(w http.ResponseWriter, r *http.Request) {
	var req SurvivorCalcRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberBenefit <= 0 {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_monthly_benefit must be positive")
		return
	}
	if req.JSPercentage <= 0 || req.JSPercentage > 1.0 {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "js_percentage must be between 0 and 1.0")
		return
	}

	deathDate := time.Now()
	if req.DeathDate != "" {
		var err error
		deathDate, err = time.Parse("2006-01-02", req.DeathDate)
		if err != nil {
			WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid death_date format")
			return
		}
	}

	result := deathsurvivor.SurvivorJSBenefit(deathsurvivor.SurvivorJSInput{
		MemberBenefit: req.MemberBenefit,
		JSPercentage:  req.JSPercentage,
		SurvivorName:  req.SurvivorName,
		DeathDate:     deathDate,
	})

	WriteJSON(w, http.StatusOK, result)
}
