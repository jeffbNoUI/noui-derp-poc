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

// TestCase4MartinezDROBenefit verifies the base benefit for Case 4.
// Case 4 uses the same member as Case 1 — DRO does not change the base benefit.
// AMS $10,639.45, Tier 1 (2.0%), 28.75 years, no reduction → $6,117.68
func TestCase4MartinezDROBenefit(t *testing.T) {
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

	// Base benefit is identical to Case 1
	assertFloat(t, "maximum", result.MaximumMonthlyBenefit, 6117.68, 0.01)

	// DRO split happens separately — benefit calculator produces the base
	// DRO remainder ($4,564.44) and payment options are tested in DRO package
	// and TestPaymentOptionsAfterDROCase4 above.

	t.Logf("Case 4 base: $%.2f (DRO split applied separately)", result.MaximumMonthlyBenefit)
}

// TestBenefitTracePopulated verifies that the calculation trace is populated.
func TestBenefitTracePopulated(t *testing.T) {
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

	if result.Trace == nil {
		t.Fatal("expected trace to be populated")
	}
	if result.Trace.CalculationType != "benefit" {
		t.Errorf("trace type = %q, want benefit", result.Trace.CalculationType)
	}
	if len(result.Trace.Steps) < 2 {
		t.Errorf("expected at least 2 trace steps (AMS + formula), got %d", len(result.Trace.Steps))
	}

	// Verify AMS step exists
	foundAMS := false
	for _, step := range result.Trace.Steps {
		if step.RuleID == "RULE-AMS-CALC" {
			foundAMS = true
		}
	}
	if !foundAMS {
		t.Error("expected AMS step in trace")
	}

	// Verify final result
	if result.Trace.FinalResult == nil {
		t.Error("expected trace final result")
	}
	if result.Trace.FinalResult["maximumMonthlyBenefit"] != "6117.68" {
		t.Errorf("trace final maximumMonthlyBenefit = %q, want 6117.68",
			result.Trace.FinalResult["maximumMonthlyBenefit"])
	}
}

// TestCOLAEligibility verifies COLA eligibility date.
// All cases retiring in 2026 → first COLA eligible 2028-01-01
func TestCOLAEligibility(t *testing.T) {
	input := CalculationInput{
		Tier:               1,
		AMS:                10639.45,
		ServiceYears:       28.75,
		ReductionFactor:    1.0,
		RetirementType:     "rule_of_75",
		AgeAtRetirement:    63,
		EarnedServiceYears: 28.75,
		RetirementYear:     2026,
	}

	result := CalculateBenefit(input)

	if result.COLA == nil {
		t.Fatal("expected COLA eligibility to be populated")
	}
	if result.COLA.FirstEligibleDate != "2028-01-01" {
		t.Errorf("COLA first eligible = %q, want 2028-01-01", result.COLA.FirstEligibleDate)
	}
	if result.COLA.Status != "pending_board_action" {
		t.Errorf("COLA status = %q, want pending_board_action", result.COLA.Status)
	}
}

// TestCOLAEligibility_DifferentYear verifies COLA for non-2026 retirement.
func TestCOLAEligibility_DifferentYear(t *testing.T) {
	input := CalculationInput{
		Tier:               2,
		AMS:                5000.00,
		ServiceYears:       20.00,
		ReductionFactor:    1.0,
		RetirementType:     "normal",
		AgeAtRetirement:    65,
		EarnedServiceYears: 20.00,
		RetirementYear:     2027,
	}

	result := CalculateBenefit(input)

	if result.COLA == nil {
		t.Fatal("expected COLA eligibility to be populated")
	}
	if result.COLA.FirstEligibleDate != "2029-01-01" {
		t.Errorf("COLA first eligible = %q, want 2029-01-01", result.COLA.FirstEligibleDate)
	}
}

// TestBenefitTraceWithEarlyReduction verifies trace includes reduction step.
func TestBenefitTraceWithEarlyReduction(t *testing.T) {
	input := CalculationInput{
		Tier:               2,
		AMS:                7347.62,
		ServiceYears:       21.17,
		ReductionFactor:    0.70,
		RetirementType:     "early",
		AgeAtRetirement:    55,
		EarnedServiceYears: 18.17,
	}

	result := CalculateBenefit(input)

	if result.Trace == nil {
		t.Fatal("expected trace to be populated")
	}

	// Should have reduction step since ReductionFactor < 1.0
	foundReduction := false
	for _, step := range result.Trace.Steps {
		if step.RuleID == "RULE-REDUCTION-APPLY" {
			foundReduction = true
			if step.IntermediateValues == nil {
				t.Error("reduction step should have intermediate values")
			}
		}
	}
	if !foundReduction {
		t.Error("expected reduction step in trace for early retirement")
	}
}
