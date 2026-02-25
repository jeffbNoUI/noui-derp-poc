// Package eligibility implements the DERP eligibility evaluation logic.
// Consumed by: api/handlers.go
// Depends on: models (types), rules (statutory tables and constants)
//
// Evaluation order per RULE-ELIG-HIERARCHY:
//   1. Determine tier from hire date
//   2. Calculate age at retirement
//   3. Separate earned vs purchased service
//   4. Check vesting (5 years earned)
//   5. Check normal retirement (age 65+, 5 years)
//   6. Check Rule of 75/85 (tier-specific, earned service only)
//   7. Check early retirement (tier-specific min age, 5 years)
//   8. If none qualify → deferred
//
// CRITICAL: Rule of 75/85 and IPR use EARNED service only.
// Benefit calculation uses TOTAL service (earned + purchased).
package eligibility

import (
	"fmt"
	"math"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/models"
	"github.com/noui-derp-poc/intelligence/internal/rules"
)

// Evaluate performs the complete eligibility evaluation for a member.
//
// CRITICAL: Rule of 75/85 and IPR use EARNED service only.
// Benefit calculation uses TOTAL service (earned + purchased).
// See RULE-SVC-PURCHASED, RULE-SVC-SEPARATION.
func Evaluate(member models.MemberData, svcCredit models.ServiceCreditSummary, retirementDate time.Time) models.EligibilityResult {
	result := models.EligibilityResult{
		MemberID:              member.MemberID,
		Tier:                  member.Tier,
		EvaluationDate:        retirementDate.Format("2006-01-02"),
		EarnedServiceYears:    svcCredit.EarnedYears,
		PurchasedServiceYears: svcCredit.PurchasedYears,
		TotalServiceYears:     svcCredit.TotalForBenefit,
	}

	result.ServiceAtDate.Earned = fmt.Sprintf("%.2f", svcCredit.EarnedYears)
	result.ServiceAtDate.Total = fmt.Sprintf("%.2f", svcCredit.TotalForBenefit)

	// Calculate age at retirement using integer completed years
	if member.DateOfBirth != nil {
		result.AgeAtRetirement = ageAtDate(*member.DateOfBirth, retirementDate)
	}
	age := int(result.AgeAtRetirement)

	// Initialize trace
	trace := &models.CalculationTrace{
		TraceID:         fmt.Sprintf("calc-%s-%s-elig", retirementDate.Format("20060102"), member.MemberID),
		MemberID:        member.MemberID,
		CalculationType: "eligibility",
		EngineVersion:   "1.0.0",
		Assumptions: []string{
			"[Q-CALC-03] Using integer age (completed years), not monthly proration",
		},
	}
	stepNum := 0

	// Step 1: Age calculation
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-AGE-CALC",
		RuleName:        "Age at Retirement Date",
		SourceReference: "Standard actuarial practice",
		Description:     "Calculate member age in completed years at retirement date",
		Formula:         "retirement_year - birth_year, adjusted for birthday",
		Substitution:    fmt.Sprintf("%d - %d", retirementDate.Year(), member.DateOfBirth.Year()),
		Result:          fmt.Sprintf("%d completed years", age),
	})

	// Step 2: Vesting — 5 years earned service. Source: RMC §18-401
	result.Vested = svcCredit.TotalForElig >= rules.VestingYears
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-VESTING",
		RuleName:        "Vesting Requirement",
		SourceReference: "RMC §18-402(31)",
		Description:     "Check if member has 5 or more years of earned service",
		Formula:         "earnedServiceYears >= 5.00",
		Substitution:    fmt.Sprintf("%.2f >= 5.00", svcCredit.TotalForElig),
		Result:          fmt.Sprintf("vested = %v", result.Vested),
		Notes:           "Purchased service is EXCLUDED from vesting check",
	})

	// Leave payout eligibility: hired before Jan 1, 2010. Source: RULE-LEAVE-PAYOUT
	if member.HireDate != nil {
		cutoff := time.Date(2010, 1, 1, 0, 0, 0, 0, time.UTC)
		result.LeavePayoutEligible = member.HireDate.Before(cutoff)
		if result.LeavePayoutEligible {
			result.LeavePayoutNote = "Hired before 2010-01-01 — eligible for sick/vacation leave payout"
		} else {
			result.LeavePayoutNote = "Hired on or after 2010-01-01 — not eligible"
		}
	}

	// Initialize paths array — all pathways are evaluated for transparency
	var paths []models.EligibilityPath

	if !result.Vested {
		result.RetirementType = "not_eligible"
		result.ReductionFactor = 0

		paths = buildPaths(result, age, svcCredit)
		result.Paths = paths

		trace.FinalResult = map[string]string{
			"retirementType":  "not_eligible",
			"reason":          "Not vested (less than 5 years earned service)",
			"reductionFactor": "0",
		}
		result.Trace = trace
		return result
	}

	// Step 3: Normal retirement — age 65+, vested. Source: RMC §18-409(a)
	normalEligible := age >= rules.NormalRetirementAge
	if normalEligible {
		result.NormalRetirementEligible = true
		result.ReductionFactor = 1.0
		result.RetirementType = "normal"
	}
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-NORMAL-RET",
		RuleName:        "Normal Retirement",
		SourceReference: "RMC §18-409(a)",
		Description:     "Check if member qualifies for normal retirement (age 65+, vested)",
		Formula:         "age >= 65 AND vested",
		Substitution:    fmt.Sprintf("%d >= 65 AND %v", age, result.Vested),
		Result:          fmt.Sprintf("eligible = %v", normalEligible),
	})

	// Step 4: Rule of 75/85 — earned service only, tier-specific minimum age
	evaluateRuleOfN(&result, age, svcCredit)
	ruleOfNThreshold := rules.RuleOfNThreshold(member.Tier)
	ruleOfNMinAge := rules.RuleOfNMinAge(member.Tier)
	ruleLabel := fmt.Sprintf("Rule of %d", ruleOfNThreshold)

	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          fmt.Sprintf("RULE-RULE-OF-%d", ruleOfNThreshold),
		RuleName:        ruleLabel,
		SourceReference: "RMC §18-409(a)",
		Description:     fmt.Sprintf("Check if age + earned service >= %d with minimum age %d", ruleOfNThreshold, ruleOfNMinAge),
		Formula:         fmt.Sprintf("age + earnedService >= %d AND age >= %d", ruleOfNThreshold, ruleOfNMinAge),
		Substitution:    fmt.Sprintf("%.2f + %.2f = %.2f >= %d AND %d >= %d", result.AgeAtRetirement, svcCredit.TotalForElig, result.RuleOfNSum, ruleOfNThreshold, age, ruleOfNMinAge),
		IntermediateValues: map[string]string{
			"ageAtRetirement":    fmt.Sprintf("%.2f", result.AgeAtRetirement),
			"earnedServiceYears": fmt.Sprintf("%.2f", svcCredit.TotalForElig),
			"sum":                fmt.Sprintf("%.2f", result.RuleOfNSum),
			"threshold":          fmt.Sprintf("%d", ruleOfNThreshold),
			"minimumAge":         fmt.Sprintf("%d", ruleOfNMinAge),
		},
		Result: fmt.Sprintf("qualifies = %v", result.RuleOfNQualifies),
		Notes:  "Purchased service is EXCLUDED from Rule of N calculation",
	})

	// If normal retirement was set, keep it (Rule of N is evaluated for transparency)
	if normalEligible {
		evaluateRuleOfN(&result, age, svcCredit)
		paths = buildPaths(result, age, svcCredit)
		result.Paths = paths
		trace.FinalResult = map[string]string{
			"retirementType":  "normal",
			"reductionFactor": "1.00",
		}
		result.Trace = trace
		return result
	}

	if result.RuleOfNQualifies {
		result.ReductionFactor = 1.0
		if member.Tier == 3 {
			result.RetirementType = "rule_of_85"
		} else {
			result.RetirementType = "rule_of_75"
		}
		paths = buildPaths(result, age, svcCredit)
		result.Paths = paths
		trace.FinalResult = map[string]string{
			"retirementType":  result.RetirementType,
			"reductionFactor": "1.00",
		}
		result.Trace = trace
		return result
	}

	// Step 5: Early retirement — tier-specific minimum age, vested
	minAge := rules.MinEarlyRetirementAge(member.Tier)
	earlyEligible := age >= minAge

	if earlyEligible {
		result.EarlyRetirementEligible = true
		result.YearsUnder65 = rules.NormalRetirementAge - age

		// Look up reduction factor from statutory table
		factor := rules.ReductionFactor(member.Tier, age)
		result.ReductionFactor = factor
		result.EarlyRetirementReductionPct = math.Round((1.0 - factor) * 100)
		result.RetirementType = "early"
	}

	ratePerYear := "3%"
	ruleID := "RULE-EARLY-REDUCE-T12"
	if member.Tier == 3 {
		ratePerYear = "6%"
		ruleID = "RULE-EARLY-REDUCE-T3"
	}

	stepNum++
	earlyStep := models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          ruleID,
		RuleName:        "Early Retirement",
		SourceReference: "RMC §18-409(b)",
		Description:     fmt.Sprintf("Check early retirement eligibility (age >= %d, vested) with %s/year reduction", minAge, ratePerYear),
		Formula:         fmt.Sprintf("age >= %d AND vested; reduction = %s × (65 - age)", minAge, ratePerYear),
		Substitution:    fmt.Sprintf("%d >= %d AND %v", age, minAge, result.Vested),
		Result:          fmt.Sprintf("eligible = %v", earlyEligible),
	}
	if earlyEligible {
		earlyStep.IntermediateValues = map[string]string{
			"yearsUnder65":    fmt.Sprintf("%d", result.YearsUnder65),
			"reductionRate":   ratePerYear + " per year",
			"reductionPct":    fmt.Sprintf("%.0f%%", result.EarlyRetirementReductionPct),
			"reductionFactor": fmt.Sprintf("%.2f", result.ReductionFactor),
		}
	}
	trace.Steps = append(trace.Steps, earlyStep)

	if !earlyEligible {
		// Deferred: vested but doesn't meet any retirement type
		result.RetirementType = "deferred"
		result.ReductionFactor = 0
	}

	paths = buildPaths(result, age, svcCredit)
	result.Paths = paths

	trace.FinalResult = map[string]string{
		"retirementType":  result.RetirementType,
		"reductionFactor": fmt.Sprintf("%.2f", result.ReductionFactor),
	}
	if result.RetirementType == "early" {
		trace.FinalResult["reductionPercent"] = fmt.Sprintf("%.0f", result.EarlyRetirementReductionPct)
	}
	result.Trace = trace

	return result
}

// buildPaths constructs the paths array showing all evaluated pathways.
func buildPaths(result models.EligibilityResult, age int, svcCredit models.ServiceCreditSummary) []models.EligibilityPath {
	var paths []models.EligibilityPath

	// Normal retirement path
	paths = append(paths, models.EligibilityPath{
		PathType:         "normal",
		DisplayName:      "Normal Retirement",
		Eligible:         result.NormalRetirementEligible,
		ApplicableToTier: true,
		Conditions: []models.EligibilityCondition{
			{
				Name:     "Minimum Age",
				Met:      age >= rules.NormalRetirementAge,
				Required: "65",
				Actual:   fmt.Sprintf("%d", age),
			},
			{
				Name:     "Minimum Service",
				Met:      result.Vested,
				Required: "5",
				Actual:   fmt.Sprintf("%.2f", svcCredit.TotalForElig),
			},
		},
	})

	// Rule of 75/85 path
	ruleOfNThreshold := rules.RuleOfNThreshold(result.Tier)
	ruleOfNMinAge := rules.RuleOfNMinAge(result.Tier)
	ruleOfNName := fmt.Sprintf("Rule of %d", ruleOfNThreshold)
	isApplicable := true
	if result.Tier == 3 {
		// Rule of 75 not applicable to Tier 3
		paths = append(paths, models.EligibilityPath{
			PathType:         "rule75",
			DisplayName:      "Rule of 75",
			Eligible:         false,
			ApplicableToTier: false,
			Conditions: []models.EligibilityCondition{
				{Name: "Tier 1 or 2 only", Met: false, Required: "Tier 1 or 2", Actual: fmt.Sprintf("Tier %d", result.Tier)},
			},
		})
		// Rule of 85 is the applicable one
		paths = append(paths, models.EligibilityPath{
			PathType:         "rule85",
			DisplayName:      ruleOfNName,
			Eligible:         result.RuleOfNQualifies,
			ApplicableToTier: isApplicable,
			Conditions: []models.EligibilityCondition{
				{
					Name:     "Minimum Age",
					Met:      result.RuleOfNMinAgeMet,
					Required: fmt.Sprintf("%d", ruleOfNMinAge),
					Actual:   fmt.Sprintf("%d", age),
				},
				{
					Name:     fmt.Sprintf("Age + Earned Service ≥ %d", ruleOfNThreshold),
					Met:      result.RuleOfNSum >= float64(ruleOfNThreshold),
					Required: fmt.Sprintf("%.2f", float64(ruleOfNThreshold)),
					Actual:   fmt.Sprintf("%.2f", result.RuleOfNSum),
				},
			},
		})
	} else {
		// Rule of 75 applicable to Tiers 1&2
		paths = append(paths, models.EligibilityPath{
			PathType:         "rule75",
			DisplayName:      ruleOfNName,
			Eligible:         result.RuleOfNQualifies,
			ApplicableToTier: isApplicable,
			Conditions: []models.EligibilityCondition{
				{
					Name:     "Minimum Age",
					Met:      result.RuleOfNMinAgeMet,
					Required: fmt.Sprintf("%d", ruleOfNMinAge),
					Actual:   fmt.Sprintf("%d", age),
				},
				{
					Name:     fmt.Sprintf("Age + Earned Service ≥ %d", ruleOfNThreshold),
					Met:      result.RuleOfNSum >= float64(ruleOfNThreshold),
					Required: fmt.Sprintf("%.2f", float64(ruleOfNThreshold)),
					Actual:   fmt.Sprintf("%.2f", result.RuleOfNSum),
				},
			},
		})
		// Rule of 85 not applicable
		paths = append(paths, models.EligibilityPath{
			PathType:         "rule85",
			DisplayName:      "Rule of 85",
			Eligible:         false,
			ApplicableToTier: false,
			Conditions: []models.EligibilityCondition{
				{Name: "Tier 3 only", Met: false, Required: "Tier 3", Actual: fmt.Sprintf("Tier %d", result.Tier)},
			},
		})
	}

	// Early retirement path
	minEarlyAge := rules.MinEarlyRetirementAge(result.Tier)
	earlyPath := models.EligibilityPath{
		PathType:         "early",
		DisplayName:      "Early Retirement",
		Eligible:         result.EarlyRetirementEligible,
		ApplicableToTier: true,
		Conditions: []models.EligibilityCondition{
			{
				Name:     "Minimum Age",
				Met:      age >= minEarlyAge,
				Required: fmt.Sprintf("%d", minEarlyAge),
				Actual:   fmt.Sprintf("%d", age),
			},
			{
				Name:     "Minimum Service",
				Met:      result.Vested,
				Required: "5",
				Actual:   fmt.Sprintf("%.2f", svcCredit.TotalForElig),
			},
		},
	}
	if result.EarlyRetirementEligible {
		earlyPath.ReductionPct = result.EarlyRetirementReductionPct
		earlyPath.ReductionFactor = result.ReductionFactor
	}
	paths = append(paths, earlyPath)

	return paths
}

// evaluateRuleOfN checks Rule of 75 (Tiers 1&2) or Rule of 85 (Tier 3).
// Uses EARNED service only — purchased service is excluded.
func evaluateRuleOfN(result *models.EligibilityResult, age int, svcCredit models.ServiceCreditSummary) {
	threshold := rules.RuleOfNThreshold(result.Tier)
	minAge := rules.RuleOfNMinAge(result.Tier)

	if result.Tier == 3 {
		result.RuleOfNApplicable = "85"
	} else {
		result.RuleOfNApplicable = "75"
	}

	// Sum uses EARNED service only (TotalForElig excludes purchased)
	result.RuleOfNSum = result.AgeAtRetirement + svcCredit.TotalForElig
	result.RuleOfNMinAgeMet = age >= minAge
	result.RuleOfNQualifies = result.RuleOfNSum >= float64(threshold) && result.RuleOfNMinAgeMet
}

// ageAtDate calculates age in completed years at a given date.
// ASSUMPTION: [Q-CALC-03] Using integer age (completed years), not monthly proration.
func ageAtDate(dob, asOf time.Time) float64 {
	years := asOf.Year() - dob.Year()
	// Adjust if birthday hasn't occurred yet in the target year
	if asOf.Month() < dob.Month() || (asOf.Month() == dob.Month() && asOf.Day() < dob.Day()) {
		years--
	}
	return float64(years)
}
