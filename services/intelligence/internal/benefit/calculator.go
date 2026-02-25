// Package benefit implements the DERP benefit calculation engine.
// Consumed by: api/handlers.go
// Depends on: models (types), rules (statutory tables and constants)
//
// The benefit formula is: AMS × multiplier × service_years × reduction_factor
//
// Where:
//   - AMS comes from the connector service (sliding window calculation)
//   - Multiplier is tier-specific (2.0% Tier 1, 1.5% Tiers 2&3)
//   - Service years is TOTAL service (earned + purchased) for benefit formula
//   - Reduction factor is 1.0 for normal/Rule of N, from statutory table for early
//
// Payment options apply J&S factors to the maximum benefit (or post-DRO remainder).
// IPR uses EARNED service only (purchased excluded).
// Death benefit uses statutory lookup tables.
package benefit

import (
	"fmt"
	"math"

	"github.com/noui-derp-poc/intelligence/internal/models"
	"github.com/noui-derp-poc/intelligence/internal/rules"
)

// CalculationInput contains all inputs needed for benefit calculation.
type CalculationInput struct {
	Tier               int
	AMS                float64
	ServiceYears       float64 // TOTAL service (earned + purchased) for benefit formula
	ReductionFactor    float64 // From eligibility evaluation
	RetirementType     string  // "normal", "rule_of_75", "rule_of_85", "early"
	AgeAtRetirement    int
	EarnedServiceYears float64 // For IPR (purchased excluded)
	RetirementYear     int     // For COLA eligibility calculation
}

// CalculateBenefit performs the complete benefit calculation.
// Carry full precision through intermediate calculations, round only final amounts.
// ASSUMPTION: [Q-CALC-01] Using banker's rounding on final amounts only.
func CalculateBenefit(input CalculationInput) models.BenefitResult {
	multiplier := rules.Multiplier(input.Tier)

	// Core benefit formula: AMS × multiplier × service_years
	// Carry full precision — do NOT round intermediate results
	unreduced := input.AMS * multiplier * input.ServiceYears
	unreduced = bankersRound(unreduced, 2)

	// Apply early retirement reduction
	reduced := unreduced * input.ReductionFactor
	reduced = bankersRound(reduced, 2)

	reductionPct := math.Round((1.0 - input.ReductionFactor) * 100)

	result := models.BenefitResult{
		Tier:                   input.Tier,
		RetirementType:         input.RetirementType,
		Multiplier:             multiplier,
		ServiceYearsForBenefit: input.ServiceYears,
		Formula: fmt.Sprintf("AMS × multiplier × service = %.2f × %.3f × %.2f",
			input.AMS, multiplier, input.ServiceYears),
		UnreducedBenefit:      unreduced,
		ReductionPercent:      reductionPct,
		ReductionFactor:       input.ReductionFactor,
		ReducedBenefit:        reduced,
		MaximumMonthlyBenefit: reduced,
	}

	// IPR: earned service only. Source: RMC §18-412
	result.IPR = calculateIPR(input.EarnedServiceYears)

	// Death benefit: statutory table lookup. Source: RMC §18-411(d)
	isNormalOrRuleOfN := input.RetirementType == "normal" ||
		input.RetirementType == "rule_of_75" ||
		input.RetirementType == "rule_of_85"
	result.DeathBenefit = calculateDeathBenefit(input.Tier, input.AgeAtRetirement, isNormalOrRuleOfN)

	// Build calculation trace
	result.Trace = buildBenefitTrace(input, result, multiplier, unreduced, reduced)

	// COLA eligibility: January 1 of second year after retirement
	// All cases retiring in 2026 → first COLA eligible 2028-01-01
	// COLA is discretionary and board-approved — no automatic formula.
	retYear := input.RetirementYear
	if retYear == 0 {
		retYear = 2026 // Default for demo cases
	}
	result.COLA = &models.COLAEligibility{
		FirstEligibleDate: fmt.Sprintf("%d-01-01", retYear+2),
		Status:            "pending_board_action",
		Note:              "COLA is discretionary and requires board approval. First eligible January 1 of second year after retirement.",
	}

	return result
}

// buildBenefitTrace constructs the calculation trace for a benefit calculation.
func buildBenefitTrace(input CalculationInput, result models.BenefitResult, multiplier, unreduced, reduced float64) *models.CalculationTrace {
	trace := &models.CalculationTrace{
		TraceID:         fmt.Sprintf("calc-benefit-%d", input.Tier),
		MemberID:        result.MemberID,
		CalculationType: "benefit",
		EngineVersion:   "1.0.0",
		Assumptions: []string{
			"[Q-CALC-01] Banker's rounding (round half to even) on final amounts only",
			"[Q-CALC-04] J&S factors are placeholders pending actuarial tables",
		},
	}

	stepNum := 0

	// Step 1: AMS source
	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          "RULE-AMS-CALC",
		RuleName:        "Average Monthly Salary",
		SourceReference: "RMC §18-401(3)",
		Description:     "AMS from Connector service (trusted value)",
		Result:          fmt.Sprintf("AMS = $%.2f", input.AMS),
		Notes:           "Intelligence trusts Connector's AMS calculation (XS-11)",
	})

	// Step 2: Benefit formula
	tierName := "Tier 1"
	if input.Tier == 2 {
		tierName = "Tier 2"
	} else if input.Tier == 3 {
		tierName = "Tier 3"
	}
	ruleID := fmt.Sprintf("RULE-BENEFIT-T%d", input.Tier)

	stepNum++
	trace.Steps = append(trace.Steps, models.CalculationStep{
		StepNumber:      stepNum,
		RuleID:          ruleID,
		RuleName:        fmt.Sprintf("%s Benefit Formula", tierName),
		SourceReference: "RMC §18-409(a)",
		Description:     "Calculate unreduced monthly benefit",
		Formula:         "AMS × multiplier × serviceYears",
		Substitution:    fmt.Sprintf("$%.2f × %.3f × %.2f", input.AMS, multiplier, input.ServiceYears),
		IntermediateValues: map[string]string{
			"ams":          fmt.Sprintf("%.2f", input.AMS),
			"multiplier":   fmt.Sprintf("%.3f", multiplier),
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
			SourceReference: "RMC §18-409(b)",
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

	// Step 4: IPR
	if result.IPR != nil {
		stepNum++
		trace.Steps = append(trace.Steps, models.CalculationStep{
			StepNumber:      stepNum,
			RuleID:          "RULE-IPR",
			RuleName:        "Insurance Premium Reimbursement",
			SourceReference: "RMC §18-412",
			Description:     "Calculate IPR using earned service years only",
			Formula:         "preMedicare = earnedYears × $12.50; postMedicare = earnedYears × $6.25",
			Substitution:    fmt.Sprintf("%.2f × $12.50; %.2f × $6.25", input.EarnedServiceYears, input.EarnedServiceYears),
			IntermediateValues: map[string]string{
				"earnedServiceYears": fmt.Sprintf("%.2f", input.EarnedServiceYears),
				"preMedicareRate":    "12.50",
				"postMedicareRate":   "6.25",
			},
			Result: fmt.Sprintf("preMedicare = $%.2f/mo, postMedicare = $%.2f/mo",
				result.IPR.PreMedicareMonthly, result.IPR.PostMedicareMonthly),
			Notes: "Purchased service EXCLUDED from IPR calculation",
		})
	}

	// Step 5: Death benefit
	if result.DeathBenefit != nil {
		stepNum++
		trace.Steps = append(trace.Steps, models.CalculationStep{
			StepNumber:      stepNum,
			RuleID:          "RULE-DEATH-BENEFIT",
			RuleName:        "Lump-Sum Death Benefit",
			SourceReference: "RMC §18-411(d)",
			Description:     "Lookup death benefit from statutory table",
			Result:          fmt.Sprintf("lumpSum = $%.2f", result.DeathBenefit.LumpSumAmount),
		})
	}

	// Final result
	trace.FinalResult = map[string]string{
		"maximumMonthlyBenefit": fmt.Sprintf("%.2f", result.MaximumMonthlyBenefit),
		"retirementType":        input.RetirementType,
		"tier":                  fmt.Sprintf("%d", input.Tier),
	}

	return trace
}

// calculateIPR computes the Insurance Premium Reimbursement.
// Uses EARNED service only — purchased service excluded.
// Source: RMC §18-412
func calculateIPR(earnedServiceYears float64) *models.IPRResult {
	return &models.IPRResult{
		ServiceYearsForIPR:  earnedServiceYears,
		PreMedicareRate:     rules.IPRPreMedicareRate,
		PostMedicareRate:    rules.IPRPostMedicareRate,
		PreMedicareMonthly:  bankersRound(earnedServiceYears*rules.IPRPreMedicareRate, 2),
		PostMedicareMonthly: bankersRound(earnedServiceYears*rules.IPRPostMedicareRate, 2),
	}
}

// calculateDeathBenefit computes the death benefit lump sum.
// Uses statutory lookup tables, not formulas.
// Source: RMC §18-411(d)
func calculateDeathBenefit(tier, age int, isNormalOrRuleOfN bool) *models.DeathBenefitResult {
	lumpSum := rules.DeathBenefitAmount(tier, age, isNormalOrRuleOfN)

	var reduction float64
	if !isNormalOrRuleOfN && age < rules.NormalRetirementAge {
		reduction = 5000.00 - lumpSum
	}

	result := &models.DeathBenefitResult{
		Tier:           tier,
		BaseAmount:     5000.00,
		Reduction:      reduction,
		LumpSumAmount:  lumpSum,
		Installment50:  bankersRound(lumpSum/50.0, 2),
		Installment100: bankersRound(lumpSum/100.0, 2),
	}

	if isNormalOrRuleOfN {
		result.RetirementType = "normal"
	} else {
		result.RetirementType = "early"
	}

	return result
}

// PaymentOptionsResult holds all payment option calculations.
type PaymentOptionsResult struct {
	Maximum          models.PaymentOption
	JointSurvivor100 models.PaymentOption
	JointSurvivor75  models.PaymentOption
	JointSurvivor50  models.PaymentOption
}

// CalculatePaymentOptions computes all payment options for a given base benefit.
// The base benefit is the maximum monthly benefit (post-reduction, post-DRO if applicable).
//
// CRITICAL: When DRO exists, base should be member's REMAINING benefit (after DRO split).
// DRO split happens first, then J&S options apply to the remainder.
// See RULE-DRO-SEQUENCE.
//
// ASSUMPTION: [Q-CALC-04] J&S factors are placeholders pending actuarial tables.
func CalculatePaymentOptions(baseBenefit float64) PaymentOptionsResult {
	return PaymentOptionsResult{
		Maximum: models.PaymentOption{
			Name:           "maximum",
			Factor:         1.0,
			MonthlyBenefit: baseBenefit,
		},
		JointSurvivor100: models.PaymentOption{
			Name:            "joint_survivor_100",
			Factor:          rules.JSFactor100,
			MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor100, 2),
			SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor100, 2), // 100% of reduced amount
		},
		JointSurvivor75: models.PaymentOption{
			Name:            "joint_survivor_75",
			Factor:          rules.JSFactor75,
			MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor75, 2),
			SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor75*0.75, 2),
		},
		JointSurvivor50: models.PaymentOption{
			Name:            "joint_survivor_50",
			Factor:          rules.JSFactor50,
			MonthlyBenefit:  bankersRound(baseBenefit*rules.JSFactor50, 2),
			SurvivorBenefit: bankersRound(baseBenefit*rules.JSFactor50*0.50, 2),
		},
	}
}

// bankersRound implements banker's rounding (round half to even).
// ASSUMPTION: [Q-CALC-01] Using banker's rounding. DERP's actual method unconfirmed.
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
