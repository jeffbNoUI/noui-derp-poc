// Package eligibility implements the COPERA eligibility evaluation logic.
// Consumed by: api/handlers.go
// Depends on: models (types), rules (statutory tables and constants)
//
// Evaluation order per COPERA hierarchy:
//   1. Determine HAS table from membership date + vesting status
//   2. Calculate age at retirement
//   3. Separate earned vs purchased service
//   4. Check vesting (5 years earned)
//   5. Check normal retirement (table-specific age, 5 years)
//   6. Check Rule of N (table-specific: 80/85/88/90, earned service only)
//   7. Check early retirement (table-specific min age, 5 years)
//   8. If none qualify → deferred
//
// CRITICAL: Rule of N uses EARNED service only (purchased excluded).
// Benefit calculation uses TOTAL service (earned + purchased).
package eligibility

import (
	"fmt"
	"math"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/models"
	"github.com/noui-derp-poc/intelligence/internal/rules"
)

// Evaluate performs the complete eligibility evaluation for a COPERA member.
func Evaluate(member models.MemberData, svcCredit models.ServiceCreditSummary, retirementDate time.Time) models.EligibilityResult {
	result := models.EligibilityResult{
		MemberID:              member.MemberID,
		Division:              member.Division,
		HASTable:              member.HASTable,
		HASTableName:          rules.HASTableName(member.HASTable),
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
		EngineVersion:   "1.0.0-copera",
		Assumptions: []string{
			"[Q-CALC-03] Using integer age (completed years), not monthly proration",
		},
	}
	stepNum := 0

	// Step 1: HAS table determination
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-HAS-TABLE",
		RuleName:        "HAS Table Determination",
		SourceReference: "C.R.S. §24-51-602, CMPTIER0",
		Description:     "Identify member's HAS table from CMPTIER0 system record",
		Result:          fmt.Sprintf("HAS Table = %s (table %d)", result.HASTableName, member.HASTable),
		Notes:           fmt.Sprintf("Division: %s", member.Division),
	})

	// Step 2: Age calculation
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

	// Step 3: Vesting — 5 years earned service. Source: C.R.S. §24-51-401(1.7)
	result.Vested = svcCredit.TotalForElig >= rules.VestingYears
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-VESTING",
		RuleName:        "Vesting Requirement",
		SourceReference: "C.R.S. §24-51-401(1.7)",
		Description:     "Check if member has 5 or more years of earned service",
		Formula:         "earnedServiceYears >= 5.00",
		Substitution:    fmt.Sprintf("%.2f >= 5.00", svcCredit.TotalForElig),
		Result:          fmt.Sprintf("vested = %v", result.Vested),
		Notes:           "Purchased service excluded from vesting check",
	})

	// Initialize paths array — all pathways evaluated for transparency
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

	// Step 4: Normal retirement — table-specific age, vested
	nra := rules.NormalRetirementAge(member.HASTable)
	normalEligible := age >= nra
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
		SourceReference: fmt.Sprintf("C.R.S. §24-51-602 (%s)", result.HASTableName),
		Description:     fmt.Sprintf("Check if member qualifies for normal retirement (age %d+, vested)", nra),
		Formula:         fmt.Sprintf("age >= %d AND vested", nra),
		Substitution:    fmt.Sprintf("%d >= %d AND %v", age, nra, result.Vested),
		Result:          fmt.Sprintf("eligible = %v", normalEligible),
	})

	// Step 5: Rule of N — earned service only, table-specific threshold and min age
	evaluateRuleOfN(&result, age, svcCredit)
	ruleOfNThreshold := rules.RuleOfNThreshold(member.HASTable)
	ruleOfNMinAgeVal := rules.RuleOfNMinAge(member.HASTable)
	ruleLabel := rules.RuleOfNLabel(member.HASTable)

	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          fmt.Sprintf("RULE-RULE-OF-%d", ruleOfNThreshold),
		RuleName:        ruleLabel,
		SourceReference: fmt.Sprintf("C.R.S. §24-51-602 (%s)", result.HASTableName),
		Description:     fmt.Sprintf("Check if age + earned service >= %d with minimum age %d", ruleOfNThreshold, ruleOfNMinAgeVal),
		Formula:         fmt.Sprintf("age + earnedService >= %d AND age >= %d", ruleOfNThreshold, ruleOfNMinAgeVal),
		Substitution:    fmt.Sprintf("%.2f + %.2f = %.2f >= %d AND %d >= %d", result.AgeAtRetirement, svcCredit.TotalForElig, result.RuleOfNSum, ruleOfNThreshold, age, ruleOfNMinAgeVal),
		IntermediateValues: map[string]string{
			"ageAtRetirement":    fmt.Sprintf("%.2f", result.AgeAtRetirement),
			"earnedServiceYears": fmt.Sprintf("%.2f", svcCredit.TotalForElig),
			"sum":                fmt.Sprintf("%.2f", result.RuleOfNSum),
			"threshold":          fmt.Sprintf("%d", ruleOfNThreshold),
			"minimumAge":         fmt.Sprintf("%d", ruleOfNMinAgeVal),
		},
		Result: fmt.Sprintf("qualifies = %v", result.RuleOfNQualifies),
		Notes:  "Purchased service EXCLUDED from Rule of N calculation",
	})

	// If normal retirement was set, keep it (Rule of N evaluated for transparency)
	if normalEligible {
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
		result.RetirementType = fmt.Sprintf("rule_of_%d", ruleOfNThreshold)
		paths = buildPaths(result, age, svcCredit)
		result.Paths = paths
		trace.FinalResult = map[string]string{
			"retirementType":  result.RetirementType,
			"reductionFactor": "1.00",
		}
		result.Trace = trace
		return result
	}

	// Step 6: Early retirement — table-specific minimum age, vested
	minAge := rules.MinEarlyRetirementAge(member.HASTable)
	earlyEligible := age >= minAge

	if earlyEligible {
		result.EarlyRetirementEligible = true
		result.YearsUnder65 = 65 - age

		factor := rules.ReductionFactor(member.HASTable, age)
		result.ReductionFactor = factor
		result.EarlyRetirementReductionPct = math.Round((1.0 - factor) * 100)
		result.RetirementType = "early"
	}

	stepNum++
	earlyStep := models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-EARLY-RET",
		RuleName:        "Early Retirement",
		SourceReference: fmt.Sprintf("C.R.S. §24-51-605 (%s)", result.HASTableName),
		Description:     fmt.Sprintf("Check early retirement eligibility (age >= %d, vested)", minAge),
		Formula:         fmt.Sprintf("age >= %d AND vested", minAge),
		Substitution:    fmt.Sprintf("%d >= %d AND %v", age, minAge, result.Vested),
		Result:          fmt.Sprintf("eligible = %v", earlyEligible),
	}
	if earlyEligible {
		earlyStep.IntermediateValues = map[string]string{
			"yearsUnder65":    fmt.Sprintf("%d", result.YearsUnder65),
			"reductionPct":    fmt.Sprintf("%.0f%%", result.EarlyRetirementReductionPct),
			"reductionFactor": fmt.Sprintf("%.2f", result.ReductionFactor),
		}
	}
	trace.Steps = append(trace.Steps, earlyStep)

	if !earlyEligible {
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

	nra := rules.NormalRetirementAge(result.HASTable)
	ruleOfNThreshold := rules.RuleOfNThreshold(result.HASTable)
	ruleOfNMinAgeVal := rules.RuleOfNMinAge(result.HASTable)
	ruleLabel := rules.RuleOfNLabel(result.HASTable)

	// Normal retirement path
	paths = append(paths, models.EligibilityPath{
		PathType:          "normal",
		DisplayName:       "Normal Retirement",
		Eligible:          result.NormalRetirementEligible,
		ApplicableToTable: true,
		Conditions: []models.EligibilityCondition{
			{
				Name:     "Minimum Age",
				Met:      age >= nra,
				Required: fmt.Sprintf("%d", nra),
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

	// Rule of N path
	paths = append(paths, models.EligibilityPath{
		PathType:          fmt.Sprintf("rule%d", ruleOfNThreshold),
		DisplayName:       ruleLabel,
		Eligible:          result.RuleOfNQualifies,
		ApplicableToTable: true,
		Conditions: []models.EligibilityCondition{
			{
				Name:     "Minimum Age",
				Met:      result.RuleOfNMinAgeMet,
				Required: fmt.Sprintf("%d", ruleOfNMinAgeVal),
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

	// Early retirement path
	minEarlyAge := rules.MinEarlyRetirementAge(result.HASTable)
	earlyPath := models.EligibilityPath{
		PathType:          "early",
		DisplayName:       "Early Retirement",
		Eligible:          result.EarlyRetirementEligible,
		ApplicableToTable: true,
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

// evaluateRuleOfN checks the Rule of N for the member's HAS table.
// Uses EARNED service only — purchased service is excluded.
func evaluateRuleOfN(result *models.EligibilityResult, age int, svcCredit models.ServiceCreditSummary) {
	threshold := rules.RuleOfNThreshold(result.HASTable)
	minAge := rules.RuleOfNMinAge(result.HASTable)

	result.RuleOfNApplicable = fmt.Sprintf("%d", threshold)
	result.RuleOfNSum = result.AgeAtRetirement + svcCredit.TotalForElig
	result.RuleOfNMinAgeMet = age >= minAge
	result.RuleOfNQualifies = result.RuleOfNSum >= float64(threshold) && result.RuleOfNMinAgeMet
}

// ageAtDate calculates age in completed years at a given date.
func ageAtDate(dob, asOf time.Time) float64 {
	years := asOf.Year() - dob.Year()
	if asOf.Month() < dob.Month() || (asOf.Month() == dob.Month() && asOf.Day() < dob.Day()) {
		years--
	}
	return float64(years)
}
