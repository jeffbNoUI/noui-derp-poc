// Package benefit implements the COPERA benefit calculation engine.
// Consumed by: api/handlers.go
// Depends on: models (types), rules (statutory tables and constants)
//
// The benefit formula is: (Annual HAS × 2.5% × service_years × reduction_factor) / 12
//
// Where:
//   - Annual HAS = highest average salary over 3-year or 5-year window (table-specific)
//   - 2.5% multiplier is universal across all COPERA divisions
//   - Service years is TOTAL service (earned + purchased)
//   - Reduction factor is 1.0 for normal/Rule of N, from table for early
//   - Anti-spiking: 108% cascading cap per C.R.S. §24-51-101(25.5)
//
// Payment options:
//   - PERA divisions: Options 1/2/3
//   - DPS division: Options A/B/P2/P3 (with pop-up feature)
package benefit

import (
	"fmt"
	"math"

	"github.com/noui-derp-poc/intelligence/internal/models"
	"github.com/noui-derp-poc/intelligence/internal/rules"
)

// CalculationInput contains all inputs needed for benefit calculation.
type CalculationInput struct {
	HASTable           int
	Division           string
	AMS                float64 // Monthly AMS (annual HAS / 12)
	ServiceYears       float64 // TOTAL service (earned + purchased)
	ReductionFactor    float64
	RetirementType     string
	AgeAtRetirement    int
	EarnedServiceYears float64
	RetirementYear     int
}

// CalculateBenefit performs the complete benefit calculation.
// Carry full precision through intermediate calculations, round only final amounts.
func CalculateBenefit(input CalculationInput) models.BenefitResult {
	multiplier := rules.Multiplier(input.HASTable)

	// Core benefit formula: AMS × multiplier × service_years
	// (AMS is monthly, so this gives monthly benefit)
	unreduced := input.AMS * multiplier * input.ServiceYears
	unreduced = bankersRound(unreduced, 2)

	// Apply early retirement reduction
	reduced := unreduced * input.ReductionFactor
	reduced = bankersRound(reduced, 2)

	reductionPct := math.Round((1.0 - input.ReductionFactor) * 100)

	result := models.BenefitResult{
		Division:               input.Division,
		HASTable:               input.HASTable,
		HASTableName:           rules.HASTableName(input.HASTable),
		RetirementType:         input.RetirementType,
		Multiplier:             multiplier,
		ServiceYearsForBenefit: input.ServiceYears,
		Formula: fmt.Sprintf("(Annual HAS × %.1f%% × %.2f years) / 12 = Monthly AMS × %.3f × %.2f",
			multiplier*100, input.ServiceYears, multiplier, input.ServiceYears),
		UnreducedBenefit:      unreduced,
		ReductionPercent:      reductionPct,
		ReductionFactor:       input.ReductionFactor,
		ReducedBenefit:        reduced,
		MaximumMonthlyBenefit: reduced,
	}

	// Annual increase (replaces DERP's discretionary COLA)
	result.AnnualIncrease = calculateAnnualIncrease(input.HASTable, input.RetirementYear)

	// Death benefit (simplified for COPERA demo)
	result.DeathBenefit = &models.DeathBenefitResult{
		HASTable:    input.HASTable,
		Description: "Statutory survivor benefits per C.R.S. §24-51-701 through §24-51-706",
	}

	// Build calculation trace
	result.Trace = buildBenefitTrace(input, result, multiplier, unreduced, reduced)

	return result
}

// calculateAnnualIncrease computes the annual increase (COLA equivalent) info.
// Source: C.R.S. §24-51-1002 (as amended by SB 18-200)
func calculateAnnualIncrease(hasTable int, retirementYear int) *models.AnnualIncreaseInfo {
	rate := rules.AnnualIncreaseRate(hasTable)
	if retirementYear == 0 {
		retirementYear = 2026
	}

	rateDisplay := "1.0%"
	if rate >= 0.015 {
		rateDisplay = "1.5%"
	}

	return &models.AnnualIncreaseInfo{
		Rate:              rate,
		FirstEligibleDate: fmt.Sprintf("%d-03-01", retirementYear+2),
		CompoundMethod:    "compound",
		Note: fmt.Sprintf(
			"Annual increase of %s compound, effective March 1 of the second calendar year after retirement. Source: C.R.S. §24-51-1002.",
			rateDisplay),
	}
}

// buildBenefitTrace constructs the calculation trace.
func buildBenefitTrace(input CalculationInput, result models.BenefitResult, multiplier, unreduced, reduced float64) *models.CalculationTrace {
	trace := &models.CalculationTrace{
		TraceID:         fmt.Sprintf("calc-benefit-%s-%d", input.Division, input.HASTable),
		MemberID:        result.MemberID,
		CalculationType: "benefit",
		EngineVersion:   "1.0.0-copera",
		Assumptions: []string{
			"[Q-CALC-01] Banker's rounding (round half to even) on final amounts only",
			"[Q-CALC-04] J&S factors are placeholders pending actuarial tables",
		},
	}

	stepNum := 0

	// Step 1: HAS/AMS source
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-HAS-CALC",
		RuleName:        "Highest Average Salary",
		SourceReference: "C.R.S. §24-51-101(25.5)",
		Description:     fmt.Sprintf("HAS from Connector service (anti-spiking applied, %d-month window)", rules.HASWindowMonths(input.HASTable)),
		Result:          fmt.Sprintf("Monthly AMS = $%.2f", input.AMS),
		Notes:           "Intelligence trusts Connector's HAS calculation with anti-spiking",
	})

	// Step 2: Benefit formula
	tableName := rules.HASTableName(input.HASTable)
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-BENEFIT-COPERA",
		RuleName:        fmt.Sprintf("%s (%s) Benefit Formula", input.Division, tableName),
		SourceReference: "C.R.S. §24-51-603",
		Description:     "Calculate unreduced monthly benefit",
		Formula:         "Monthly AMS × multiplier × serviceYears",
		Substitution:    fmt.Sprintf("$%.2f × %.3f × %.2f", input.AMS, multiplier, input.ServiceYears),
		IntermediateValues: map[string]string{
			"monthlyAMS":  fmt.Sprintf("%.2f", input.AMS),
			"multiplier":  fmt.Sprintf("%.3f", multiplier),
			"serviceYears": fmt.Sprintf("%.2f", input.ServiceYears),
		},
		Result: fmt.Sprintf("unreducedBenefit = $%.2f", unreduced),
	})

	// Step 3: Reduction (if early)
	if input.ReductionFactor < 1.0 {
		stepNum++
		trace.Steps = append(trace.Steps, models.CalculationStep{
			StepNumber:      stepNum,
			RuleID:          "RULE-REDUCTION-APPLY",
			RuleName:        "Early Retirement Reduction",
			SourceReference: fmt.Sprintf("C.R.S. §24-51-605 (%s)", tableName),
			Description:     "Apply early retirement reduction factor",
			Formula:         "reducedBenefit = unreducedBenefit × reductionFactor",
			Substitution:    fmt.Sprintf("$%.2f × %.2f", unreduced, input.ReductionFactor),
			IntermediateValues: map[string]string{
				"unreducedBenefit": fmt.Sprintf("%.2f", unreduced),
				"reductionFactor":  fmt.Sprintf("%.2f", input.ReductionFactor),
				"reductionPercent": fmt.Sprintf("%.0f%%", math.Round((1.0-input.ReductionFactor)*100)),
			},
			Result: fmt.Sprintf("reducedBenefit = $%.2f", reduced),
		})
	}

	// Step 4: Annual increase
	if result.AnnualIncrease != nil {
		stepNum++
		trace.Steps = append(trace.Steps, models.CalculationStep{
			StepNumber:      stepNum,
			RuleID:          "RULE-ANNUAL-INCREASE",
			RuleName:        "Annual Increase",
			SourceReference: "C.R.S. §24-51-1002",
			Description:     "Compound annual increase (replaces discretionary COLA)",
			Result:          fmt.Sprintf("Rate = %.1f%% compound, first eligible %s", result.AnnualIncrease.Rate*100, result.AnnualIncrease.FirstEligibleDate),
		})
	}

	// Final result
	trace.FinalResult = map[string]string{
		"maximumMonthlyBenefit": fmt.Sprintf("%.2f", result.MaximumMonthlyBenefit),
		"retirementType":        input.RetirementType,
		"division":              input.Division,
		"hasTable":              fmt.Sprintf("%d", input.HASTable),
	}

	return trace
}

// CalculatePaymentOptions computes all payment options.
// PERA divisions use Options 1/2/3. DPS uses Options A/B/P2/P3.
func CalculatePaymentOptions(baseBenefit float64, division string) models.PaymentOptionsResult {
	result := models.PaymentOptionsResult{
		Division:    division,
		BaseBenefit: baseBenefit,
		Assumption:  "[Q-CALC-04] J&S factors are placeholders pending actuarial tables",
	}

	if rules.IsDPSDivision(division) {
		// DPS: Options A/B/P2/P3
		result.Options = []models.PaymentOption{
			{
				Name:           "option_a",
				DisplayName:    "Option A (Maximum)",
				Factor:         1.0,
				MonthlyBenefit: baseBenefit,
			},
			{
				Name:            "option_b",
				DisplayName:     "Option B (Modified Half)",
				Factor:          rules.JSFactor50,
				MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor50, 2),
				SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor50*0.50, 2),
			},
			{
				Name:            "pop_up_2",
				DisplayName:     "Pop-Up 2 (J&S 75%)",
				Factor:          rules.JSFactor75,
				MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor75, 2),
				SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor75*0.75, 2),
				PopUpFeature:    true,
			},
			{
				Name:            "pop_up_3",
				DisplayName:     "Pop-Up 3 (J&S 100%)",
				Factor:          rules.JSFactor100,
				MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor100, 2),
				SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor100, 2),
				PopUpFeature:    true,
			},
		}
	} else {
		// PERA: Options 1/2/3
		result.Options = []models.PaymentOption{
			{
				Name:           "option_1",
				DisplayName:    "Option 1 (Maximum)",
				Factor:         1.0,
				MonthlyBenefit: baseBenefit,
			},
			{
				Name:            "option_2",
				DisplayName:     "Option 2 (J&S 50%)",
				Factor:          rules.JSFactor50,
				MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor50, 2),
				SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor50*0.50, 2),
			},
			{
				Name:            "option_3",
				DisplayName:     "Option 3 (J&S 100%)",
				Factor:          rules.JSFactor100,
				MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor100, 2),
				SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor100, 2),
			},
		}
	}

	return result
}

// bankersRound implements banker's rounding (round half to even).
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
