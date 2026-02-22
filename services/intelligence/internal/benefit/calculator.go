// Package benefit implements the DERP benefit calculation engine.
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

	return result
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
	Maximum         models.PaymentOption
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
