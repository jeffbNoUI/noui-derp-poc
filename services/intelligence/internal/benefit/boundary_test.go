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
