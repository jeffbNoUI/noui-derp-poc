package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/benefit"
	"github.com/noui-derp-poc/intelligence/internal/connector"
	drocalc "github.com/noui-derp-poc/intelligence/internal/dro"
	"github.com/noui-derp-poc/intelligence/internal/eligibility"
	"github.com/noui-derp-poc/intelligence/internal/models"
)

// Handlers provides HTTP handlers backed by the connector client.
type Handlers struct {
	conn *connector.Client
}

// NewHandlers creates a new Handlers instance.
func NewHandlers(conn *connector.Client) *Handlers {
	return &Handlers{conn: conn}
}

// Health handles GET /healthz
func (h *Handlers) Health(w http.ResponseWriter, r *http.Request) {
	WriteJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "intelligence",
		"version": "0.1.0",
	})
}

// EvaluateEligibility handles POST /api/v1/eligibility/evaluate
func (h *Handlers) EvaluateEligibility(w http.ResponseWriter, r *http.Request) {
	var req models.EligibilityRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id is required")
		return
	}

	retDate := time.Now()
	if req.RetirementDate != "" {
		var err error
		retDate, err = time.Parse("2006-01-02", req.RetirementDate)
		if err != nil {
			WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format (use YYYY-MM-DD)")
			return
		}
	}

	// Fetch member data from connector
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	// Fetch service credit
	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	result := eligibility.Evaluate(*member, *svcCredit, retDate)
	WriteJSON(w, http.StatusOK, result)
}

// CalculateBenefit handles POST /api/v1/benefit/calculate
func (h *Handlers) CalculateBenefit(w http.ResponseWriter, r *http.Request) {
	var req models.BenefitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" || req.RetirementDate == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_date are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", req.RetirementDate)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format")
		return
	}

	// Fetch member, salary/AMS, service credit from connector
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	// Evaluate eligibility first
	elig := eligibility.Evaluate(*member, *svcCredit, retDate)

	if elig.RetirementType == "not_eligible" || elig.RetirementType == "deferred" {
		WriteJSON(w, http.StatusOK, map[string]interface{}{
			"member_id":   req.MemberID,
			"eligibility": elig,
			"note":        "Member is not eligible for immediate retirement benefit",
		})
		return
	}

	// Calculate benefit
	input := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                salary.AMS.AMS,
		ServiceYears:       svcCredit.TotalForBenefit,
		ReductionFactor:    elig.ReductionFactor,
		RetirementType:     elig.RetirementType,
		AgeAtRetirement:    int(elig.AgeAtRetirement),
		EarnedServiceYears: svcCredit.TotalForIPR,
	}
	result := benefit.CalculateBenefit(input)
	result.MemberID = req.MemberID
	result.RetirementDate = req.RetirementDate
	result.AMS = *salary.AMS

	WriteJSON(w, http.StatusOK, result)
}

// CalculatePaymentOptions handles POST /api/v1/benefit/options
func (h *Handlers) CalculatePaymentOptions(w http.ResponseWriter, r *http.Request) {
	var req models.PaymentOptionsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" || req.RetirementDate == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_date are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", req.RetirementDate)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format")
		return
	}

	// Get benefit calculation
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	elig := eligibility.Evaluate(*member, *svcCredit, retDate)

	input := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                salary.AMS.AMS,
		ServiceYears:       svcCredit.TotalForBenefit,
		ReductionFactor:    elig.ReductionFactor,
		RetirementType:     elig.RetirementType,
		AgeAtRetirement:    int(elig.AgeAtRetirement),
		EarnedServiceYears: svcCredit.TotalForIPR,
	}
	benefitResult := benefit.CalculateBenefit(input)

	// Check for DRO — split before payment options
	baseBenefit := benefitResult.MaximumMonthlyBenefit
	var droResult *models.DROResult

	droResp, err := h.conn.GetDROs(req.MemberID)
	if err == nil && droResp.HasDRO && len(droResp.DROs) > 0 {
		dro := droResp.DROs[0] // Use first active DRO
		if dro.MarriageDate != nil && dro.DivorceDate != nil {
			droInput := drocalc.CalculationInput{
				TotalServiceYears: svcCredit.TotalForBenefit,
				HireDate:          *member.HireDate,
				RetirementDate:    retDate,
				MarriageDate:      *dro.MarriageDate,
				DivorceDate:       *dro.DivorceDate,
				DivisionMethod:    dro.DivisionMethod,
				MaximumBenefit:    baseBenefit,
				AltPayeeName:      dro.AltPayeeName,
			}
			if dro.DivisionPct != nil {
				droInput.DivisionPct = *dro.DivisionPct
			}
			if dro.DivisionAmt != nil {
				droInput.DivisionAmt = *dro.DivisionAmt
			}
			dr := drocalc.Calculate(droInput)
			droResult = &dr
			baseBenefit = dr.MemberRemainingBenefit
		}
	}

	// Calculate payment options on post-DRO base
	options := benefit.CalculatePaymentOptions(baseBenefit)

	resp := models.PaymentOptionsResult{
		MemberID:         req.MemberID,
		BaseBenefit:      baseBenefit,
		Maximum:          options.Maximum,
		JointSurvivor100: &options.JointSurvivor100,
		JointSurvivor75:  &options.JointSurvivor75,
		JointSurvivor50:  &options.JointSurvivor50,
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"payment_options": resp,
		"dro":             droResult,
	})
}

// CalculateScenario handles POST /api/v1/benefit/scenario
func (h *Handlers) CalculateScenario(w http.ResponseWriter, r *http.Request) {
	var req models.ScenarioRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" || len(req.RetirementDates) == 0 {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_dates are required")
		return
	}

	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	var scenarios []models.ScenarioResult
	for _, dateStr := range req.RetirementDates {
		retDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}

		elig := eligibility.Evaluate(*member, *svcCredit, retDate)
		scenario := models.ScenarioResult{
			RetirementDate: dateStr,
			Eligibility:    elig,
		}

		if elig.RetirementType != "not_eligible" && elig.RetirementType != "deferred" {
			input := benefit.CalculationInput{
				Tier:               elig.Tier,
				AMS:                salary.AMS.AMS,
				ServiceYears:       svcCredit.TotalForBenefit,
				ReductionFactor:    elig.ReductionFactor,
				RetirementType:     elig.RetirementType,
				AgeAtRetirement:    int(elig.AgeAtRetirement),
				EarnedServiceYears: svcCredit.TotalForIPR,
			}
			result := benefit.CalculateBenefit(input)
			result.MemberID = req.MemberID
			result.RetirementDate = dateStr
			result.AMS = *salary.AMS
			scenario.Benefit = &result
		}

		scenarios = append(scenarios, scenario)
	}

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"member_id": req.MemberID,
		"scenarios": scenarios,
	})
}

// CalculateDRO handles POST /api/v1/dro/calculate
func (h *Handlers) CalculateDRO(w http.ResponseWriter, r *http.Request) {
	var req models.DRORequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
		return
	}
	if req.MemberID == "" || req.RetirementDate == "" {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_date are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", req.RetirementDate)
	if err != nil {
		WriteError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format")
		return
	}

	// Fetch all needed data
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	droResp, err := h.conn.GetDROs(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetDROs(%s): %v", req.MemberID, err)
		WriteError(w, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch DRO records")
		return
	}

	if !droResp.HasDRO || len(droResp.DROs) == 0 {
		WriteJSON(w, http.StatusOK, map[string]interface{}{
			"member_id": req.MemberID,
			"has_dro":   false,
		})
		return
	}

	// Calculate benefit to know maximum
	elig := eligibility.Evaluate(*member, *svcCredit, retDate)
	input := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                salary.AMS.AMS,
		ServiceYears:       svcCredit.TotalForBenefit,
		ReductionFactor:    elig.ReductionFactor,
		RetirementType:     elig.RetirementType,
		AgeAtRetirement:    int(elig.AgeAtRetirement),
		EarnedServiceYears: svcCredit.TotalForIPR,
	}
	benefitResult := benefit.CalculateBenefit(input)

	// Calculate DRO split
	dro := droResp.DROs[0]
	droInput := drocalc.CalculationInput{
		TotalServiceYears: svcCredit.TotalForBenefit,
		MaximumBenefit:    benefitResult.MaximumMonthlyBenefit,
		AltPayeeName:      dro.AltPayeeName,
	}
	if member.HireDate != nil {
		droInput.HireDate = *member.HireDate
	}
	droInput.RetirementDate = retDate
	if dro.MarriageDate != nil {
		droInput.MarriageDate = *dro.MarriageDate
	}
	if dro.DivorceDate != nil {
		droInput.DivorceDate = *dro.DivorceDate
	}
	droInput.DivisionMethod = dro.DivisionMethod
	if dro.DivisionPct != nil {
		droInput.DivisionPct = *dro.DivisionPct
	}
	if dro.DivisionAmt != nil {
		droInput.DivisionAmt = *dro.DivisionAmt
	}

	result := drocalc.Calculate(droInput)
	result.MemberID = req.MemberID

	// Payment options on member's remainder
	options := benefit.CalculatePaymentOptions(result.MemberRemainingBenefit)

	WriteJSON(w, http.StatusOK, map[string]interface{}{
		"dro_calculation":  result,
		"payment_options":  options,
		"benefit":          benefitResult,
	})
}
