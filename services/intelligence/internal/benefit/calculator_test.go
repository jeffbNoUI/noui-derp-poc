package benefit

import (
	"math"
	"testing"
)

func assertFloat(t *testing.T, name string, got, want, tolerance float64) {
	t.Helper()
	if math.Abs(got-want) > tolerance {
		t.Errorf("%s: got %.2f, want %.2f (diff %.4f)", name, got, want, math.Abs(got-want))
	}
}

// TestCase1MartinezBenefit verifies the benefit calculation for Case 1.
// Tier 1, 2.0% multiplier, AMS $10,639.45, 28.75 years, no reduction.
// Expected: $10,639.45 × 0.02 × 28.75 = $6,117.68
func TestCase1MartinezBenefit(t *testing.T) {
	input := CalculationInput{
		Tier:               1,
		AMS:                10639.45,
		ServiceYears:       28.75,
		ReductionFactor:    1.0,
		RetirementType:     "rule_of_75",
		AgeAtRetirement:    63,
		EarnedServiceYears: 28.75,
	}

	result := CalculateBenefit(input)

	assertFloat(t, "multiplier", result.Multiplier, 0.02, 0.001)
	assertFloat(t, "unreduced", result.UnreducedBenefit, 6117.68, 0.01)
	assertFloat(t, "reduced", result.ReducedBenefit, 6117.68, 0.01)
	assertFloat(t, "maximum", result.MaximumMonthlyBenefit, 6117.68, 0.01)

	// IPR
	assertFloat(t, "ipr_pre", result.IPR.PreMedicareMonthly, 359.38, 0.01)
	assertFloat(t, "ipr_post", result.IPR.PostMedicareMonthly, 179.69, 0.01)

	// Death benefit: normal/Rule of 75 → $5,000
	assertFloat(t, "death", result.DeathBenefit.LumpSumAmount, 5000.00, 0.01)

	t.Logf("Case 1: AMS=%.2f × %.3f × %.2f = unreduced %.2f, max %.2f",
		input.AMS, result.Multiplier, input.ServiceYears, result.UnreducedBenefit, result.MaximumMonthlyBenefit)
}

// TestCase2KimBenefit verifies the benefit calculation for Case 2.
// Tier 2, 1.5% multiplier, AMS $7,347.62, 21.17 years total, 30% reduction.
//
// Formula: $7,347.62 × 0.015 × 21.17 = $2,333.24 (formula-correct)
// Fixture: $2,332.96 (computed from full biweekly data)
// Discrepancy: $0.28 — documented in BUILD_HISTORY as known biweekly aggregation
// precision issue. The formula with rounded AMS is the correct implementation.
// Integration tests against real database will match fixture values.
func TestCase2KimBenefit(t *testing.T) {
	input := CalculationInput{
		Tier:               2,
		AMS:                7347.62,
		ServiceYears:       21.17, // Total (earned + purchased) for benefit formula
		ReductionFactor:    0.70,
		RetirementType:     "early",
		AgeAtRetirement:    55,
		EarnedServiceYears: 18.17, // Earned only for IPR
	}

	result := CalculateBenefit(input)

	// Formula-correct values (AMS × multiplier × service with rounded AMS input)
	assertFloat(t, "multiplier", result.Multiplier, 0.015, 0.001)
	assertFloat(t, "unreduced", result.UnreducedBenefit, 2333.24, 0.01)
	assertFloat(t, "reduced", result.ReducedBenefit, 1633.27, 0.01)
	assertFloat(t, "maximum", result.MaximumMonthlyBenefit, 1633.27, 0.01)

	// IPR uses EARNED service only
	assertFloat(t, "ipr_pre", result.IPR.PreMedicareMonthly, 227.13, 0.01)
	assertFloat(t, "ipr_post", result.IPR.PostMedicareMonthly, 113.56, 0.01)

	// Death benefit: early Tier 2, age 55 → $2,500
	assertFloat(t, "death", result.DeathBenefit.LumpSumAmount, 2500.00, 0.01)

	t.Logf("Case 2: unreduced %.2f × %.2f = reduced %.2f, death=%.0f",
		result.UnreducedBenefit, input.ReductionFactor, result.ReducedBenefit, result.DeathBenefit.LumpSumAmount)
}

// TestCase3WashingtonBenefit verifies the benefit calculation for Case 3.
// Tier 3, 1.5% multiplier, AMS $6,684.52, 13.58 years, 12% reduction.
//
// Formula: $6,684.52 × 0.015 × 13.58 = $1,361.64 (formula-correct)
// Fixture: $1,361.40 (computed from full biweekly data)
// Discrepancy: $0.24 — documented in BUILD_HISTORY as known biweekly aggregation
// precision issue. Same root cause as Case 2.
func TestCase3WashingtonBenefit(t *testing.T) {
	input := CalculationInput{
		Tier:               3,
		AMS:                6684.52,
		ServiceYears:       13.58,
		ReductionFactor:    0.88,
		RetirementType:     "early",
		AgeAtRetirement:    63,
		EarnedServiceYears: 13.58,
	}

	result := CalculateBenefit(input)

	// Formula-correct values
	assertFloat(t, "multiplier", result.Multiplier, 0.015, 0.001)
	assertFloat(t, "unreduced", result.UnreducedBenefit, 1361.64, 0.01)
	assertFloat(t, "reduced", result.ReducedBenefit, 1198.24, 0.01)
	assertFloat(t, "maximum", result.MaximumMonthlyBenefit, 1198.24, 0.01)

	// IPR
	assertFloat(t, "ipr_pre", result.IPR.PreMedicareMonthly, 169.75, 0.01)
	assertFloat(t, "ipr_post", result.IPR.PostMedicareMonthly, 84.88, 0.01)

	// Death benefit: early Tier 3, age 63 → $4,000
	assertFloat(t, "death", result.DeathBenefit.LumpSumAmount, 4000.00, 0.01)

	t.Logf("Case 3: unreduced %.2f × %.2f = reduced %.2f, death=%.0f",
		result.UnreducedBenefit, input.ReductionFactor, result.ReducedBenefit, result.DeathBenefit.LumpSumAmount)
}

// TestPaymentOptionsCase1 verifies payment options for Case 1.
// Maximum: $6,117.68
// 100% J&S: $6,117.68 × 0.8850 = $5,414.15
// 75% J&S: $6,117.68 × 0.9150 = $5,597.68, survivor $4,198.26
// 50% J&S: $6,117.68 × 0.9450 = $5,781.21
func TestPaymentOptionsCase1(t *testing.T) {
	result := CalculatePaymentOptions(6117.68)

	assertFloat(t, "maximum", result.Maximum.MonthlyBenefit, 6117.68, 0.01)
	assertFloat(t, "js100", result.JointSurvivor100.MonthlyBenefit, 5414.15, 0.01)
	assertFloat(t, "js75", result.JointSurvivor75.MonthlyBenefit, 5597.68, 0.01)
	assertFloat(t, "js75_survivor", result.JointSurvivor75.SurvivorBenefit, 4198.26, 0.01)
	assertFloat(t, "js50", result.JointSurvivor50.MonthlyBenefit, 5781.21, 0.01)
}

// TestPaymentOptionsCase3 verifies payment options for Case 3.
// Maximum (reduced): $1,198.03
// 50% J&S: $1,198.03 × 0.9450 = $1,132.14, survivor $566.07
func TestPaymentOptionsCase3(t *testing.T) {
	result := CalculatePaymentOptions(1198.03)

	assertFloat(t, "maximum", result.Maximum.MonthlyBenefit, 1198.03, 0.01)
	assertFloat(t, "js100", result.JointSurvivor100.MonthlyBenefit, 1060.26, 0.01)
	assertFloat(t, "js75", result.JointSurvivor75.MonthlyBenefit, 1096.20, 0.01)
	assertFloat(t, "js50", result.JointSurvivor50.MonthlyBenefit, 1132.14, 0.01)
	assertFloat(t, "js50_survivor", result.JointSurvivor50.SurvivorBenefit, 566.07, 0.01)
}

// TestPaymentOptionsAfterDROCase4 verifies payment options on post-DRO amount.
// CRITICAL: DRO split first, then J&S on member's remainder.
// Remainder: $4,564.44
// 75% J&S: $4,564.44 × 0.9150 = $4,176.46, survivor $3,132.35
func TestPaymentOptionsAfterDROCase4(t *testing.T) {
	result := CalculatePaymentOptions(4564.44)

	assertFloat(t, "maximum", result.Maximum.MonthlyBenefit, 4564.44, 0.01)
	assertFloat(t, "js100", result.JointSurvivor100.MonthlyBenefit, 4039.53, 0.01)
	assertFloat(t, "js75", result.JointSurvivor75.MonthlyBenefit, 4176.46, 0.01)
	assertFloat(t, "js75_survivor", result.JointSurvivor75.SurvivorBenefit, 3132.35, 0.01)
	assertFloat(t, "js50", result.JointSurvivor50.MonthlyBenefit, 4313.40, 0.01)
}
