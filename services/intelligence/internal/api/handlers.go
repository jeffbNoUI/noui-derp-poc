// HTTP handlers for the DERP Intelligence Service.
// Consumed by: router.go
// Depends on: connector (data fetching), eligibility (evaluation), benefit (calculation),
//             dro (DRO split), models (types)
//
// Supports both GET (path params + query string) and POST (JSON body) for all endpoints.
// GET uses path params for member ID and query string for retirement date.
// POST uses JSON body for all parameters.
package api

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"strings"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/benefit"
	"github.com/noui-derp-poc/intelligence/internal/connector"
	drocalc "github.com/noui-derp-poc/intelligence/internal/dro"
	"github.com/noui-derp-poc/intelligence/internal/eligibility"
	"github.com/noui-derp-poc/intelligence/internal/models"
	"github.com/noui-derp-poc/intelligence/internal/rules"
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
	WriteJSON(w, r, http.StatusOK, map[string]string{
		"status":  "ok",
		"service": "intelligence",
		"version": "0.1.0",
	})
}

// Ready handles GET /readyz — checks connector reachability.
func (h *Handlers) Ready(w http.ResponseWriter, r *http.Request) {
	if err := h.conn.Ping(); err != nil {
		log.Printf("ERROR: readyz connector ping failed: %v", err)
		WriteError(w, r, http.StatusServiceUnavailable, "CONNECTOR_UNAVAILABLE",
			"Connector service is not reachable")
		return
	}
	WriteJSON(w, r, http.StatusOK, map[string]string{
		"status":    "ok",
		"service":   "intelligence",
		"version":   "0.1.0",
		"connector": "reachable",
	})
}

// extractPathParam extracts a member ID from a path like /api/v1/eligibility/{id}
// or /api/v1/benefit/{id}
func extractPathParam(path, prefix string) string {
	trimmed := strings.TrimPrefix(path, prefix)
	trimmed = strings.TrimPrefix(trimmed, "/")
	if idx := strings.Index(trimmed, "/"); idx >= 0 {
		trimmed = trimmed[:idx]
	}
	if idx := strings.Index(trimmed, "?"); idx >= 0 {
		trimmed = trimmed[:idx]
	}
	return trimmed
}

// EvaluateEligibility handles eligibility evaluation.
// GET /api/v1/eligibility/{memberId}?retirementDate=YYYY-MM-DD
// POST /api/v1/eligibility/evaluate (JSON body with member_id, retirement_date)
func (h *Handlers) EvaluateEligibility(w http.ResponseWriter, r *http.Request) {
	var memberID, retDateStr string

	if r.Method == http.MethodGet {
		// GET: extract member ID from path
		memberID = extractPathParam(r.URL.Path, "/api/v1/eligibility/")
		retDateStr = r.URL.Query().Get("retirementDate")
	} else {
		// POST: decode JSON body
		var req models.EligibilityRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
			return
		}
		memberID = req.MemberID
		retDateStr = req.RetirementDate
	}

	if memberID == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id is required")
		return
	}

	retDate := time.Now()
	if retDateStr != "" {
		var err error
		retDate, err = time.Parse("2006-01-02", retDateStr)
		if err != nil {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirementDate format (use YYYY-MM-DD)")
			return
		}
	}

	// Fetch member data from connector
	member, err := h.conn.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	// Fetch service credit
	svcCredit, err := h.conn.GetServiceCredit(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	result := eligibility.Evaluate(*member, *svcCredit, retDate)
	WriteJSON(w, r, http.StatusOK, result)
}

// CalculateBenefit handles benefit calculation.
// GET /api/v1/benefit/{memberId}?retirementDate=YYYY-MM-DD
// POST /api/v1/benefit/calculate (JSON body)
func (h *Handlers) CalculateBenefit(w http.ResponseWriter, r *http.Request) {
	var memberID, retDateStr string

	if r.Method == http.MethodGet {
		memberID = extractPathParam(r.URL.Path, "/api/v1/benefit/")
		retDateStr = r.URL.Query().Get("retirementDate")
	} else {
		var req models.BenefitRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
			return
		}
		memberID = req.MemberID
		retDateStr = req.RetirementDate
	}

	if memberID == "" || retDateStr == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_date are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", retDateStr)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirementDate format")
		return
	}

	// Fetch member, salary/AMS, service credit from connector
	member, err := h.conn.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(memberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	// Evaluate eligibility first
	elig := eligibility.Evaluate(*member, *svcCredit, retDate)

	if elig.RetirementType == "not_eligible" || elig.RetirementType == "deferred" {
		WriteJSON(w, r, http.StatusOK, map[string]interface{}{
			"memberId":    memberID,
			"eligibility": elig,
			"note":        "Member is not eligible for immediate retirement benefit",
		})
		return
	}

	// Calculate benefit
	amsValue := float64(0)
	if salary.AMS != nil {
		amsValue = salary.AMS.AMS
	}

	input := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                amsValue,
		ServiceYears:       svcCredit.TotalForBenefit,
		ReductionFactor:    elig.ReductionFactor,
		RetirementType:     elig.RetirementType,
		AgeAtRetirement:    int(elig.AgeAtRetirement),
		EarnedServiceYears: svcCredit.TotalForIPR,
		RetirementYear:     retDate.Year(),
	}
	result := benefit.CalculateBenefit(input)
	result.MemberID = memberID
	result.RetirementDate = retDateStr
	if salary.AMS != nil {
		result.AMS = *salary.AMS
	}

	WriteJSON(w, r, http.StatusOK, result)
}

// CalculatePaymentOptions handles payment option calculation.
// GET /api/v1/benefit/options/{memberId}?retirementDate=YYYY-MM-DD
// POST /api/v1/benefit/options (JSON body with member_id, retirement_date)
func (h *Handlers) CalculatePaymentOptions(w http.ResponseWriter, r *http.Request) {
	var req models.PaymentOptionsRequest

	if r.Method == http.MethodGet {
		req.MemberID = extractPathParam(r.URL.Path, "/api/v1/benefit/options/")
		req.RetirementDate = r.URL.Query().Get("retirementDate")
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
			return
		}
	}

	if req.MemberID == "" || req.RetirementDate == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_date are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", req.RetirementDate)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format")
		return
	}

	// Get benefit calculation
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	elig := eligibility.Evaluate(*member, *svcCredit, retDate)

	amsValue := float64(0)
	if salary.AMS != nil {
		amsValue = salary.AMS.AMS
	}

	input := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                amsValue,
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
				AltPayeeName:     dro.AltPayeeName,
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

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"paymentOptions": resp,
		"dro":            droResult,
	})
}

// CalculateScenario handles scenario modeling.
// GET /api/v1/scenario/{memberId}?retirementDate=YYYY-MM-DD&what_if_retirement_date=YYYY-MM-DD,...
// POST /api/v1/benefit/scenario (JSON body with member_id, retirement_dates)
func (h *Handlers) CalculateScenario(w http.ResponseWriter, r *http.Request) {
	var req models.ScenarioRequest

	if r.Method == http.MethodGet {
		req.MemberID = extractPathParam(r.URL.Path, "/api/v1/scenario/")
		if req.MemberID == "" {
			req.MemberID = extractPathParam(r.URL.Path, "/api/v1/benefit/scenario/")
		}
		// Parse retirementDate as the "current" scenario and what_if dates
		currentDate := r.URL.Query().Get("retirementDate")
		if currentDate != "" {
			req.RetirementDates = append(req.RetirementDates, currentDate)
		}
		whatIfDates := r.URL.Query()["what_if_retirement_date"]
		req.RetirementDates = append(req.RetirementDates, whatIfDates...)
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
			return
		}
	}

	if req.MemberID == "" || len(req.RetirementDates) == 0 {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_dates are required")
		return
	}

	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	amsValue := float64(0)
	if salary.AMS != nil {
		amsValue = salary.AMS.AMS
	}

	// Salary growth assumption: 3% annual per XS-29
	const salaryGrowthRate = 0.03

	// Parse the first date as "current" and the rest as "what-if" scenarios
	firstDateStr := req.RetirementDates[0]
	firstDate, err := time.Parse("2006-01-02", firstDateStr)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid date: "+firstDateStr)
		return
	}

	// Build current scenario
	currentElig := eligibility.Evaluate(*member, *svcCredit, firstDate)
	currentScenario := models.ScenarioResult{
		RetirementDate: firstDateStr,
		IsEstimate:     false,
		Eligibility:    currentElig,
	}
	var currentBenefit float64
	if currentElig.RetirementType != "not_eligible" && currentElig.RetirementType != "deferred" {
		input := benefit.CalculationInput{
			Tier:               currentElig.Tier,
			AMS:                amsValue,
			ServiceYears:       svcCredit.TotalForBenefit,
			ReductionFactor:    currentElig.ReductionFactor,
			RetirementType:     currentElig.RetirementType,
			AgeAtRetirement:    int(currentElig.AgeAtRetirement),
			EarnedServiceYears: svcCredit.TotalForIPR,
			RetirementYear:     firstDate.Year(),
		}
		result := benefit.CalculateBenefit(input)
		result.MemberID = req.MemberID
		result.RetirementDate = firstDateStr
		if salary.AMS != nil {
			result.AMS = *salary.AMS
		}
		currentScenario.Benefit = &result
		currentBenefit = result.MaximumMonthlyBenefit
	}

	// Build what-if scenarios with salary growth projection
	var whatIfScenarios []models.ScenarioResult
	var comparisons []models.ScenarioComparison

	for _, dateStr := range req.RetirementDates[1:] {
		retDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}

		// Project service credit forward
		yearsForward := retDate.Sub(firstDate).Hours() / (365.25 * 24)
		projectedSvc := models.ServiceCreditSummary{
			EarnedYears:    svcCredit.EarnedYears + yearsForward,
			PurchasedYears: svcCredit.PurchasedYears,
			TotalForBenefit: svcCredit.TotalForBenefit + yearsForward,
			TotalForElig:   svcCredit.TotalForElig + yearsForward,
			TotalForIPR:    svcCredit.TotalForIPR + yearsForward,
		}

		// Project AMS with 3% annual salary growth
		projectedAMS := amsValue * math.Pow(1+salaryGrowthRate, yearsForward)
		projectedAMS = math.Round(projectedAMS)

		elig := eligibility.Evaluate(*member, projectedSvc, retDate)
		scenario := models.ScenarioResult{
			RetirementDate: dateStr,
			IsEstimate:     true,
			Eligibility:    elig,
		}

		var whatIfBenefit float64
		if elig.RetirementType != "not_eligible" && elig.RetirementType != "deferred" {
			input := benefit.CalculationInput{
				Tier:               elig.Tier,
				AMS:                projectedAMS,
				ServiceYears:       projectedSvc.TotalForBenefit,
				ReductionFactor:    elig.ReductionFactor,
				RetirementType:     elig.RetirementType,
				AgeAtRetirement:    int(elig.AgeAtRetirement),
				EarnedServiceYears: projectedSvc.TotalForIPR,
				RetirementYear:     retDate.Year(),
			}
			result := benefit.CalculateBenefit(input)
			result.MemberID = req.MemberID
			result.RetirementDate = dateStr
			scenario.Benefit = &result
			whatIfBenefit = result.MaximumMonthlyBenefit
		}

		whatIfScenarios = append(whatIfScenarios, scenario)

		// Build comparison
		if currentBenefit > 0 && whatIfBenefit > 0 {
			monthlyDiff := whatIfBenefit - currentBenefit
			pctIncrease := math.Round((monthlyDiff / currentBenefit) * 100)
			monthsToWait := int(math.Round(yearsForward * 12))

			var breakevenMonths int
			if monthlyDiff > 0 {
				foregone := currentBenefit * float64(monthsToWait)
				breakevenMonths = int(math.Ceil(foregone / monthlyDiff))
			}

			comparison := models.ScenarioComparison{
				CurrentBenefit:  currentBenefit,
				WhatIfBenefit:   whatIfBenefit,
				MonthlyDiff:     math.Round(monthlyDiff*100) / 100,
				PercentIncrease: pctIncrease,
				BreakevenMonths: breakevenMonths,
				MonthsToWait:    monthsToWait,
			}
			if pctIncrease > 20 {
				comparison.Note = fmt.Sprintf("Waiting %d months increases monthly benefit by %.0f%%", monthsToWait, pctIncrease)
			}
			comparisons = append(comparisons, comparison)
		}
	}

	// Threshold proximity detection
	thresholds := detectThresholdProximity(currentElig, *member, *svcCredit)

	resp := models.ScenarioResponse{
		MemberID:     req.MemberID,
		Current:      &currentScenario,
		Scenarios:    whatIfScenarios,
		Comparisons:  comparisons,
		Thresholds:   thresholds,
		SalaryGrowth: salaryGrowthRate,
	}

	WriteJSON(w, r, http.StatusOK, resp)
}

// detectThresholdProximity identifies thresholds within 24 months.
func detectThresholdProximity(elig models.EligibilityResult, member models.MemberData, svcCredit models.ServiceCreditSummary) []models.ThresholdProximity {
	var thresholds []models.ThresholdProximity
	age := int(elig.AgeAtRetirement)

	// Rule of 75/85 proximity
	ruleThreshold := rules.RuleOfNThreshold(elig.Tier)
	ruleMinAge := rules.RuleOfNMinAge(elig.Tier)
	ruleName := fmt.Sprintf("rule_of_%d", ruleThreshold)

	if !elig.RuleOfNQualifies && age >= ruleMinAge {
		gap := float64(ruleThreshold) - elig.RuleOfNSum
		if gap > 0 && gap <= 4.0 {
			// Each month adds ~1/12 to both age and service ≈ 2/12 to sum
			monthsNeeded := int(math.Ceil(gap / (2.0 / 12.0)))
			thresholds = append(thresholds, models.ThresholdProximity{
				ThresholdName:   ruleName,
				CurrentValue:    elig.RuleOfNSum,
				ThresholdValue:  float64(ruleThreshold),
				Gap:             math.Round(gap*100) / 100,
				EstMonthsToMeet: monthsNeeded,
				Impact:          "Eliminates early retirement reduction — benefit increases significantly",
			})
		}
	}

	// Normal retirement age proximity
	if !elig.NormalRetirementEligible && elig.Vested {
		yearsToNormal := rules.NormalRetirementAge - age
		if yearsToNormal > 0 && yearsToNormal <= 2 {
			thresholds = append(thresholds, models.ThresholdProximity{
				ThresholdName:   "normal_retirement_age",
				CurrentValue:    float64(age),
				ThresholdValue:  float64(rules.NormalRetirementAge),
				Gap:             float64(yearsToNormal),
				EstMonthsToMeet: yearsToNormal * 12,
				Impact:          "Qualifies for normal retirement — no reduction",
			})
		}
	}

	// Vesting proximity
	if !elig.Vested {
		gap := rules.VestingYears - svcCredit.TotalForElig
		if gap > 0 && gap <= 2.0 {
			monthsNeeded := int(math.Ceil(gap * 12))
			thresholds = append(thresholds, models.ThresholdProximity{
				ThresholdName:   "vesting",
				CurrentValue:    svcCredit.TotalForElig,
				ThresholdValue:  rules.VestingYears,
				Gap:             math.Round(gap*100) / 100,
				EstMonthsToMeet: monthsNeeded,
				Impact:          "Qualifies for retirement benefits",
			})
		}
	}

	return thresholds
}

// CalculateDRO handles DRO calculation.
// GET /api/v1/dro/{memberId}?retirementDate=YYYY-MM-DD
// POST /api/v1/dro/calculate (JSON body with member_id, retirement_date)
func (h *Handlers) CalculateDRO(w http.ResponseWriter, r *http.Request) {
	var req models.DRORequest

	if r.Method == http.MethodGet {
		req.MemberID = extractPathParam(r.URL.Path, "/api/v1/dro/")
		req.RetirementDate = r.URL.Query().Get("retirementDate")
	} else {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid JSON body")
			return
		}
	}

	if req.MemberID == "" || req.RetirementDate == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirement_date are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", req.RetirementDate)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirement_date format")
		return
	}

	// Fetch all needed data
	member, err := h.conn.GetMember(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	droResp, err := h.conn.GetDROs(req.MemberID)
	if err != nil {
		log.Printf("ERROR: GetDROs(%s): %v", req.MemberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch DRO records")
		return
	}

	if !droResp.HasDRO || len(droResp.DROs) == 0 {
		WriteJSON(w, r, http.StatusOK, map[string]interface{}{
			"memberId": req.MemberID,
			"hasDro":   false,
		})
		return
	}

	// Calculate benefit to know maximum
	elig := eligibility.Evaluate(*member, *svcCredit, retDate)

	amsValue := float64(0)
	if salary.AMS != nil {
		amsValue = salary.AMS.AMS
	}

	input := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                amsValue,
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
		AltPayeeName:     dro.AltPayeeName,
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

	WriteJSON(w, r, http.StatusOK, map[string]interface{}{
		"droCalculation": result,
		"paymentOptions": options,
		"benefit":        benefitResult,
	})
}

// RetirementEstimate handles GET /api/v1/retirement-estimate/{memberId}?retirementDate=YYYY-MM-DD
// Master endpoint — runs the complete pipeline and returns everything in one response.
func (h *Handlers) RetirementEstimate(w http.ResponseWriter, r *http.Request) {
	memberID := extractPathParam(r.URL.Path, "/api/v1/retirement-estimate/")
	retDateStr := r.URL.Query().Get("retirementDate")

	if memberID == "" || retDateStr == "" {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "member_id and retirementDate are required")
		return
	}

	retDate, err := time.Parse("2006-01-02", retDateStr)
	if err != nil {
		WriteError(w, r, http.StatusBadRequest, "INVALID_REQUEST", "Invalid retirementDate format")
		return
	}

	// Fetch all data from connector
	member, err := h.conn.GetMember(memberID)
	if err != nil {
		log.Printf("ERROR: GetMember(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch member data")
		return
	}

	salary, err := h.conn.GetSalary(memberID)
	if err != nil {
		log.Printf("ERROR: GetSalary(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch salary data")
		return
	}

	svcCredit, err := h.conn.GetServiceCredit(memberID)
	if err != nil {
		log.Printf("ERROR: GetServiceCredit(%s): %v", memberID, err)
		WriteError(w, r, http.StatusBadGateway, "CONNECTOR_ERROR", "Failed to fetch service credit")
		return
	}

	// Step 1: Eligibility
	elig := eligibility.Evaluate(*member, *svcCredit, retDate)

	result := map[string]interface{}{
		"memberId":       memberID,
		"retirementDate": retDateStr,
		"eligibility":    elig,
	}

	if elig.RetirementType == "not_eligible" || elig.RetirementType == "deferred" {
		result["note"] = "Member is not eligible for immediate retirement benefit"
		WriteJSON(w, r, http.StatusOK, result)
		return
	}

	// Step 2: Benefit calculation
	amsValue := float64(0)
	if salary.AMS != nil {
		amsValue = salary.AMS.AMS
	}

	benefitInput := benefit.CalculationInput{
		Tier:               elig.Tier,
		AMS:                amsValue,
		ServiceYears:       svcCredit.TotalForBenefit,
		ReductionFactor:    elig.ReductionFactor,
		RetirementType:     elig.RetirementType,
		AgeAtRetirement:    int(elig.AgeAtRetirement),
		EarnedServiceYears: svcCredit.TotalForIPR,
		RetirementYear:     retDate.Year(),
	}
	benefitResult := benefit.CalculateBenefit(benefitInput)
	benefitResult.MemberID = memberID
	benefitResult.RetirementDate = retDateStr
	if salary.AMS != nil {
		benefitResult.AMS = *salary.AMS
	}
	result["benefit"] = benefitResult

	// Step 3: DRO (if applicable)
	baseBenefit := benefitResult.MaximumMonthlyBenefit
	droResp, err := h.conn.GetDROs(memberID)
	if err == nil && droResp.HasDRO && len(droResp.DROs) > 0 {
		dro := droResp.DROs[0]
		if dro.MarriageDate != nil && dro.DivorceDate != nil {
			droInput := drocalc.CalculationInput{
				TotalServiceYears: svcCredit.TotalForBenefit,
				MaximumBenefit:    baseBenefit,
				AltPayeeName:     dro.AltPayeeName,
				DivisionMethod:   dro.DivisionMethod,
			}
			if member.HireDate != nil {
				droInput.HireDate = *member.HireDate
			}
			droInput.RetirementDate = retDate
			droInput.MarriageDate = *dro.MarriageDate
			droInput.DivorceDate = *dro.DivorceDate
			if dro.DivisionPct != nil {
				droInput.DivisionPct = *dro.DivisionPct
			}
			if dro.DivisionAmt != nil {
				droInput.DivisionAmt = *dro.DivisionAmt
			}
			dr := drocalc.Calculate(droInput)
			dr.MemberID = memberID
			result["dro"] = dr
			baseBenefit = dr.MemberRemainingBenefit
		}
	}

	// Step 4: Payment options (on post-DRO base)
	options := benefit.CalculatePaymentOptions(baseBenefit)
	result["paymentOptions"] = map[string]interface{}{
		"baseBenefit":      baseBenefit,
		"maximum":          options.Maximum,
		"jointSurvivor100": options.JointSurvivor100,
		"jointSurvivor75":  options.JointSurvivor75,
		"jointSurvivor50":  options.JointSurvivor50,
		"assumption":       "[Q-CALC-04] J&S factors are illustrative placeholders pending actuarial tables",
	}

	// Step 5: COLA eligibility
	colaYear := retDate.Year() + 2
	result["cola"] = map[string]interface{}{
		"firstEligibleDate": fmt.Sprintf("%d-01-01", colaYear),
		"status":            "pending_board_action",
		"note":              "COLA is discretionary and requires board approval",
	}

	WriteJSON(w, r, http.StatusOK, result)
}

// Unused import guard
var _ = fmt.Sprintf
