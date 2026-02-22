package rules

import "testing"

func TestReductionFactorT12(t *testing.T) {
	tests := []struct {
		age    int
		expect float64
	}{
		{55, 0.70}, {56, 0.73}, {57, 0.76}, {58, 0.79}, {59, 0.82},
		{60, 0.85}, {61, 0.88}, {62, 0.91}, {63, 0.94}, {64, 0.97},
		{65, 1.00},
	}
	for _, tt := range tests {
		got := ReductionFactor(1, tt.age)
		if got != tt.expect {
			t.Errorf("T1 age %d: got %.2f, want %.2f", tt.age, got, tt.expect)
		}
		// Tier 2 uses same table
		got2 := ReductionFactor(2, tt.age)
		if got2 != tt.expect {
			t.Errorf("T2 age %d: got %.2f, want %.2f", tt.age, got2, tt.expect)
		}
	}
}

func TestReductionFactorT3(t *testing.T) {
	tests := []struct {
		age    int
		expect float64
	}{
		{60, 0.70}, {61, 0.76}, {62, 0.82}, {63, 0.88}, {64, 0.94},
		{65, 1.00},
	}
	for _, tt := range tests {
		got := ReductionFactor(3, tt.age)
		if got != tt.expect {
			t.Errorf("T3 age %d: got %.2f, want %.2f", tt.age, got, tt.expect)
		}
	}
}

func TestReductionFactorBelowMin(t *testing.T) {
	// Below minimum early retirement age should return -1
	if got := ReductionFactor(1, 54); got != -1.0 {
		t.Errorf("T1 age 54: got %.2f, want -1.0", got)
	}
	if got := ReductionFactor(3, 59); got != -1.0 {
		t.Errorf("T3 age 59: got %.2f, want -1.0", got)
	}
}

func TestDeathBenefitNormal(t *testing.T) {
	// Normal retirement always gets $5,000
	if got := DeathBenefitAmount(1, 63, true); got != 5000.00 {
		t.Errorf("normal T1 age 63: got %.2f, want 5000.00", got)
	}
	if got := DeathBenefitAmount(3, 63, true); got != 5000.00 {
		t.Errorf("normal T3 age 63: got %.2f, want 5000.00", got)
	}
}

func TestDeathBenefitEarlyT12(t *testing.T) {
	// Case 2: early Tier 2, age 55 → $2,500
	if got := DeathBenefitAmount(2, 55, false); got != 2500.00 {
		t.Errorf("early T2 age 55: got %.2f, want 2500.00", got)
	}
}

func TestDeathBenefitEarlyT3(t *testing.T) {
	// Case 3: early Tier 3, age 63 → $4,000
	if got := DeathBenefitAmount(3, 63, false); got != 4000.00 {
		t.Errorf("early T3 age 63: got %.2f, want 4000.00", got)
	}
}

func TestMultiplier(t *testing.T) {
	if got := Multiplier(1); got != 0.02 {
		t.Errorf("T1 multiplier: got %.3f, want 0.020", got)
	}
	if got := Multiplier(2); got != 0.015 {
		t.Errorf("T2 multiplier: got %.3f, want 0.015", got)
	}
	if got := Multiplier(3); got != 0.015 {
		t.Errorf("T3 multiplier: got %.3f, want 0.015", got)
	}
}

func TestRuleOfNThreshold(t *testing.T) {
	if got := RuleOfNThreshold(1); got != 75 {
		t.Errorf("T1: got %d, want 75", got)
	}
	if got := RuleOfNThreshold(2); got != 75 {
		t.Errorf("T2: got %d, want 75", got)
	}
	if got := RuleOfNThreshold(3); got != 85 {
		t.Errorf("T3: got %d, want 85", got)
	}
}
