// Package api — vendor HTTP handlers for the DERP intelligence service.
// Provides IPR calculation endpoint that applies the deterministic rules engine
// to compute Insurance Premium Reimbursement for a specific member.
// Consumed by: router.go (endpoint registration), frontend vendor portal
// Depends on: connector/client.go (upstream data), rules/tables.go (IPR rates),
//             response.go (envelope)
package api

import (
	"encoding/json"
	"log"
	"math"
	"net/http"
)

// IPRRequest is the request body for POST /api/v1/vendor/ipr/calculate.
type IPRRequest struct {
	MemberID string `json:"member_id"`
}

// IPRCalculationResult contains the complete IPR calculation worksheet.
// Every field is transparent and verifiable — the rules engine shows its work.
type IPRCalculationResult struct {
	MemberID            string  `json:"member_id"`
	EarnedServiceYears  float64 `json:"earned_service_years"`
	PreMedicareRate     float64 `json:"pre_medicare_rate"`
	PostMedicareRate    float64 `json:"post_medicare_rate"`
	PreMedicareMonthly  float64 `json:"pre_medicare_monthly"`
	PostMedicareMonthly float64 `json:"post_medicare_monthly"`
	Formula             string  `json:"formula"`
	SourceReference     string  `json:"source_reference"`
	Note                string  `json:"note,omitempty"`
}

// CalculateVendorIPR handles POST /api/v1/vendor/ipr/calculate
// Fetches earned service credit from the connector and calculates IPR.
//
// CRITICAL: Purchased service is EXCLUDED from IPR calculation (RMC §18-412).
// The connector service-credit endpoint already separates earned vs purchased;
// we use total_for_ipr which excludes purchased service.
//
// IPR formula:
//   Pre-Medicare: earned_years × $12.50/month
//   Post-Medicare: earned_years × $6.25/month
func (h *Handlers) CalculateVendorIPR(w http.ResponseWriter, r *http.Request) {
	var req IPRRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id is required")
		return
	}

	// Fetch service credit summary from connector — uses earned service only for IPR
	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	// IPR rates per year of earned service — Source: RMC §18-412
	const preRate = 12.50
	const postRate = 6.25

	earnedYears := svcCredit.TotalForIPR
	preMedicare := bankersRound(earnedYears*preRate, 2)
	postMedicare := bankersRound(earnedYears*postRate, 2)

	result := IPRCalculationResult{
		MemberID:            req.MemberID,
		EarnedServiceYears:  earnedYears,
		PreMedicareRate:     preRate,
		PostMedicareRate:    postRate,
		PreMedicareMonthly:  preMedicare,
		PostMedicareMonthly: postMedicare,
		Formula:             "earned_service_years × rate_per_year",
		SourceReference:     "RMC §18-412 — Insurance Premium Reimbursement",
	}

	if svcCredit.PurchasedYears > 0 {
		result.Note = "Purchased service excluded from IPR per RMC §18-412"
	}

	WriteJSON(w, r, http.StatusOK, result)
}

// bankersRound implements banker's rounding (round half to even).
// Mirrors the implementation in benefit/calculator.go for consistency.
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
