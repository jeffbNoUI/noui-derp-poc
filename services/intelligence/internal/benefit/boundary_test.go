package benefit

import (
	"testing"
)

func TestBenefit_ZeroServiceYears(t *testing.T) {
	result := CalculateBenefit(CalculationInput{
		Tier:                1,
		AMS:                 5000.00,
		ServiceYears:        0.00,
		ReductionFactor:     1.0,
		RetirementType:      "normal",
		AgeAtRetirement:     65,
		EarnedServiceYears:  0.00,
	})
	assertFloat(t, "zero_service", result.MaximumMonthlyBenefit, 0.00, 0.01)
}

func TestBenefit_MaxReduction_Tier1_Age55(t *testing.T) {
	// Tier 1, age 55, 0.70 factor. Gross=5000*0.02*20=2000. Net=2000*0.70=1400.
	result := CalculateBenefit(CalculationInput{
		Tier:                1,
		AMS:                 5000.00,
		ServiceYears:        20.00,
		ReductionFactor:     0.70,
		RetirementType:      "early",
		AgeAtRetirement:     55,
		EarnedServiceYears:  20.00,
	})
	assertFloat(t, "unreduced", result.UnreducedBenefit, 2000.00, 0.01)
	assertFloat(t, "reduced", result.ReducedBenefit, 1400.00, 0.01)
	assertFloat(t, "maximum", result.MaximumMonthlyBenefit, 1400.00, 0.01)
}

func TestBenefit_MaxReduction_Tier3_Age60(t *testing.T) {
	// Tier 3, age 60, 0.70 factor. Gross=5000*0.015*15=1125. Net=1125*0.70=787.50.
	result := CalculateBenefit(CalculationInput{
		Tier:                3,
		AMS:                 5000.00,
		ServiceYears:        15.00,
		ReductionFactor:     0.70,
		RetirementType:      "early",
		AgeAtRetirement:     60,
		EarnedServiceYears:  15.00,
	})
	assertFloat(t, "unreduced", result.UnreducedBenefit, 1125.00, 0.01)
	assertFloat(t, "reduced", result.ReducedBenefit, 787.50, 0.01)
}

func TestBenefit_Tier1_VsTier2_SameInputs(t *testing.T) {
	// Same inputs: Tier 1 (2.0%) > Tier 2 (1.5%)
	input := CalculationInput{
		AMS:                 6000.00,
		ServiceYears:        25.00,
		ReductionFactor:     1.0,
		RetirementType:      "normal",
		AgeAtRetirement:     65,
		EarnedServiceYears:  25.00,
	}

	input.Tier = 1
	t1 := CalculateBenefit(input)

	input.Tier = 2
	t2 := CalculateBenefit(input)

	// T1: 6000 * 0.02 * 25 = 3000, T2: 6000 * 0.015 * 25 = 2250
	assertFloat(t, "tier1", t1.MaximumMonthlyBenefit, 3000.00, 0.01)
	assertFloat(t, "tier2", t2.MaximumMonthlyBenefit, 2250.00, 0.01)
	if t1.MaximumMonthlyBenefit <= t2.MaximumMonthlyBenefit {
		t.Error("Tier 1 should exceed Tier 2 with same inputs")
	}
}

func TestPaymentOptions_SurvivorsAlwaysLessThanMax(t *testing.T) {
	result := CalculatePaymentOptions(3000.00)
	if result.JointSurvivor100.MonthlyBenefit >= 3000.00 {
		t.Errorf("J&S 100%% should be less than max, got %.2f", result.JointSurvivor100.MonthlyBenefit)
	}
	if result.JointSurvivor75.MonthlyBenefit >= 3000.00 {
		t.Errorf("J&S 75%% should be less than max, got %.2f", result.JointSurvivor75.MonthlyBenefit)
	}
	if result.JointSurvivor50.MonthlyBenefit >= 3000.00 {
		t.Errorf("J&S 50%% should be less than max, got %.2f", result.JointSurvivor50.MonthlyBenefit)
	}
}

func TestIPR_PurchasedExcluded(t *testing.T) {
	// IPR uses EarnedServiceYears only
	result := CalculateBenefit(CalculationInput{
		Tier:                1,
		AMS:                 5000.00,
		ServiceYears:        25.00,
		ReductionFactor:     1.0,
		RetirementType:      "normal",
		AgeAtRetirement:     65,
		EarnedServiceYears:  20.00, // Only 20 earned
	})
	if result.IPR == nil {
		t.Fatal("expected IPR to be calculated")
	}
	assertFloat(t, "ipr_service", result.IPR.ServiceYearsForIPR, 20.00, 0.01)
}

func TestDeathBenefit_NormalAlways5000(t *testing.T) {
	for _, tier := range []int{1, 2, 3} {
		result := CalculateBenefit(CalculationInput{
			Tier:                tier,
			AMS:                 5000.00,
			ServiceYears:        20.00,
			ReductionFactor:     1.0,
			RetirementType:      "normal",
			AgeAtRetirement:     65,
			EarnedServiceYears:  20.00,
		})
		if result.DeathBenefit == nil {
			t.Fatalf("Tier %d: expected death benefit", tier)
		}
		assertFloat(t, "death_normal", result.DeathBenefit.LumpSumAmount, 5000.00, 0.01)
	}
}

// =============================================================================
// Edge Case Tests: Zero Service Purchase Comparison (Benefit Impact)
// =============================================================================

func TestEdge_ServicePurchase_IncreaseBenefit(t *testing.T) {
	// Same member profile, once with 0 purchased years and once with 3 purchased years.
	// Verify: benefit INCREASES with purchase (more service years in formula).
	inputNoPurchase := CalculationInput{
		Tier:               1,
		AMS:                8000.00,
		ServiceYears:       18.00, // TotalForBenefit: earned only
		ReductionFactor:    1.0,
		RetirementType:     "rule_of_75",
		AgeAtRetirement:    58,
		EarnedServiceYears: 18.00,
	}
	inputWithPurchase := CalculationInput{
		Tier:               1,
		AMS:                8000.00,
		ServiceYears:       21.00, // TotalForBenefit: earned + 3 purchased
		ReductionFactor:    1.0,
		RetirementType:     "rule_of_75",
		AgeAtRetirement:    58,
		EarnedServiceYears: 18.00, // IPR still uses earned only
	}

	resultNoPurchase := CalculateBenefit(inputNoPurchase)
	resultWithPurchase := CalculateBenefit(inputWithPurchase)

	// No purchase: 8000 * 0.02 * 18 = 2880
	assertFloat(t, "no_purchase_benefit", resultNoPurchase.MaximumMonthlyBenefit, 2880.00, 0.01)
	// With purchase: 8000 * 0.02 * 21 = 3360
	assertFloat(t, "with_purchase_benefit", resultWithPurchase.MaximumMonthlyBenefit, 3360.00, 0.01)

	if resultWithPurchase.MaximumMonthlyBenefit <= resultNoPurchase.MaximumMonthlyBenefit {
		t.Error("benefit should INCREASE when purchased service is added to TotalForBenefit")
	}

	// IPR should remain identical -- uses earned only
	if resultNoPurchase.IPR.PreMedicareMonthly != resultWithPurchase.IPR.PreMedicareMonthly {
		t.Errorf("IPR should be identical (earned-only): %.2f vs %.2f",
			resultNoPurchase.IPR.PreMedicareMonthly, resultWithPurchase.IPR.PreMedicareMonthly)
	}
}

// =============================================================================
// Edge Case Tests: Benefit Rounding (Banker's Rounding)
// =============================================================================

func TestEdge_BankersRounding_HalfToEven_Down(t *testing.T) {
	// AMS produces a value where the final benefit is exactly at .005 (half).
	// Banker's rounding: round half to even.
	// 10000.005 should round to 10000.00 (even digit is 0).
	rounded := bankersRound(10000.005, 2)
	assertFloat(t, "bankers_round_half_even_down", rounded, 10000.00, 0.001)
}

func TestEdge_BankersRounding_HalfToEven_Up(t *testing.T) {
	// 5555.555 -> round to 5555.56 (the digit before 5 is 5 which is odd, round up to 6).
	rounded := bankersRound(5555.555, 2)
	assertFloat(t, "bankers_round_half_even_up", rounded, 5555.56, 0.001)
}

func TestEdge_BankersRounding_NotHalf(t *testing.T) {
	// 1234.566 -> round to 1234.57 (straightforward round up, not a half case)
	rounded := bankersRound(1234.566, 2)
	assertFloat(t, "bankers_round_up", rounded, 1234.57, 0.001)

	// 1234.564 -> round to 1234.56 (straightforward round down)
	rounded2 := bankersRound(1234.564, 2)
	assertFloat(t, "bankers_round_down", rounded2, 1234.56, 0.001)
}

func TestEdge_NoPrematureRounding(t *testing.T) {
	// Verify that intermediate calculations carry full precision.
	// AMS=7777.77, Tier 2 (1.5%), 22.33 years, factor 0.91 (early, 3% * 3 yrs)
	// Unreduced: 7777.77 * 0.015 * 22.33 = 2605.164061... -> bankersRound to 2605.16
	// Reduced: 2605.16 * 0.91 = 2370.6956 -> bankersRound to 2370.70
	//
	// This verifies that intermediate results carry full precision and only
	// the final amounts are rounded.
	result := CalculateBenefit(CalculationInput{
		Tier:               2,
		AMS:                7777.77,
		ServiceYears:       22.33,
		ReductionFactor:    0.91,
		RetirementType:     "early",
		AgeAtRetirement:    62,
		EarnedServiceYears: 22.33,
	})
	// 7777.77 * 0.015 * 22.33 = 2604.5886735
	// bankersRound(2604.5886735, 2) = 2604.59
	assertFloat(t, "unreduced", result.UnreducedBenefit, 2605.16, 0.01)
	// 2604.59 * 0.91 = 2370.1769 -> bankersRound = 2370.18
	assertFloat(t, "reduced", result.ReducedBenefit, 2370.70, 0.01)
}

// =============================================================================
// Edge Case Tests: Death Benefit Edge Cases
// =============================================================================

func TestEdge_DeathBenefit_NormalAlways5000_AllTiers(t *testing.T) {
	// Normal retirement always gets $5,000 regardless of tier or age.
	tiers := []int{1, 2, 3}
	for _, tier := range tiers {
		result := CalculateBenefit(CalculationInput{
			Tier:               tier,
			AMS:                5000.00,
			ServiceYears:       20.00,
			ReductionFactor:    1.0,
			RetirementType:     "normal",
			AgeAtRetirement:    65,
			EarnedServiceYears: 20.00,
		})
		if result.DeathBenefit == nil {
			t.Fatalf("Tier %d: expected death benefit", tier)
		}
		assertFloat(t, "death_normal_tier"+string(rune('0'+tier)),
			result.DeathBenefit.LumpSumAmount, 5000.00, 0.01)
	}
}

func TestEdge_DeathBenefit_Early_Tier1_Age55(t *testing.T) {
	// Tier 1, early retirement at age 55:
	// $5,000 - ($250 * 10 years under 65) = $5,000 - $2,500 = $2,500
	result := CalculateBenefit(CalculationInput{
		Tier:               1,
		AMS:                5000.00,
		ServiceYears:       20.00,
		ReductionFactor:    0.70,
		RetirementType:     "early",
		AgeAtRetirement:    55,
		EarnedServiceYears: 20.00,
	})
	if result.DeathBenefit == nil {
		t.Fatal("expected death benefit")
	}
	assertFloat(t, "death_t1_age55", result.DeathBenefit.LumpSumAmount, 2500.00, 0.01)
	assertFloat(t, "death_reduction", result.DeathBenefit.Reduction, 2500.00, 0.01)
}

func TestEdge_DeathBenefit_Early_Tier3_Age60(t *testing.T) {
	// Tier 3, early retirement at age 60:
	// $5,000 - ($500 * 5 years under 65) = $5,000 - $2,500 = $2,500
	result := CalculateBenefit(CalculationInput{
		Tier:               3,
		AMS:                5000.00,
		ServiceYears:       10.00,
		ReductionFactor:    0.70,
		RetirementType:     "early",
		AgeAtRetirement:    60,
		EarnedServiceYears: 10.00,
	})
	if result.DeathBenefit == nil {
		t.Fatal("expected death benefit")
	}
	assertFloat(t, "death_t3_age60", result.DeathBenefit.LumpSumAmount, 2500.00, 0.01)
	assertFloat(t, "death_reduction", result.DeathBenefit.Reduction, 2500.00, 0.01)
}

func TestEdge_DeathBenefit_Early_Tier1_Age64(t *testing.T) {
	// Tier 1, early retirement at age 64:
	// $5,000 - ($250 * 1 year under 65) = $5,000 - $250 = $4,750
	result := CalculateBenefit(CalculationInput{
		Tier:               1,
		AMS:                5000.00,
		ServiceYears:       20.00,
		ReductionFactor:    0.97,
		RetirementType:     "early",
		AgeAtRetirement:    64,
		EarnedServiceYears: 20.00,
	})
	if result.DeathBenefit == nil {
		t.Fatal("expected death benefit")
	}
	assertFloat(t, "death_t1_age64", result.DeathBenefit.LumpSumAmount, 4750.00, 0.01)
	assertFloat(t, "death_reduction", result.DeathBenefit.Reduction, 250.00, 0.01)
}

func TestEdge_DeathBenefit_Early_Tier3_Age64(t *testing.T) {
	// Tier 3, early retirement at age 64:
	// $5,000 - ($500 * 1 year under 65) = $5,000 - $500 = $4,500
	result := CalculateBenefit(CalculationInput{
		Tier:               3,
		AMS:                5000.00,
		ServiceYears:       10.00,
		ReductionFactor:    0.94,
		RetirementType:     "early",
		AgeAtRetirement:    64,
		EarnedServiceYears: 10.00,
	})
	if result.DeathBenefit == nil {
		t.Fatal("expected death benefit")
	}
	assertFloat(t, "death_t3_age64", result.DeathBenefit.LumpSumAmount, 4500.00, 0.01)
	assertFloat(t, "death_reduction", result.DeathBenefit.Reduction, 500.00, 0.01)
}

func TestEdge_DeathBenefit_RuleOf75_Always5000(t *testing.T) {
	// Rule of 75 retirement is treated as normal/Rule-of-N -> always $5,000
	result := CalculateBenefit(CalculationInput{
		Tier:               1,
		AMS:                8000.00,
		ServiceYears:       20.00,
		ReductionFactor:    1.0,
		RetirementType:     "rule_of_75",
		AgeAtRetirement:    58,
		EarnedServiceYears: 20.00,
	})
	if result.DeathBenefit == nil {
		t.Fatal("expected death benefit")
	}
	// Even though age 58 < 65, Rule of 75 gets full $5,000
	assertFloat(t, "death_rule75", result.DeathBenefit.LumpSumAmount, 5000.00, 0.01)
}

func TestEdge_DeathBenefit_RuleOf85_Always5000(t *testing.T) {
	// Rule of 85 retirement is treated as normal/Rule-of-N -> always $5,000
	result := CalculateBenefit(CalculationInput{
		Tier:               3,
		AMS:                8000.00,
		ServiceYears:       25.00,
		ReductionFactor:    1.0,
		RetirementType:     "rule_of_85",
		AgeAtRetirement:    60,
		EarnedServiceYears: 25.00,
	})
	if result.DeathBenefit == nil {
		t.Fatal("expected death benefit")
	}
	// Even though age 60 < 65, Rule of 85 gets full $5,000
	assertFloat(t, "death_rule85", result.DeathBenefit.LumpSumAmount, 5000.00, 0.01)
}
