// Scenario-related tests for eligibility evaluation.
// Consumed by: test runner
// Depends on: eligibility evaluator, models, rules
//
// Tests threshold proximity detection and scenario modeling inputs.
package eligibility

import (
	"testing"

	"github.com/noui-derp-poc/intelligence/internal/models"
)

// TestCase2ThresholdProximity verifies that Case 2 (Jennifer Kim) is near Rule of 75.
// Age 55, earned 18.17, Rule of 75 sum = 73.17. Gap = 1.83 → ~11 months.
func TestCase2ThresholdProximity(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-100002",
		DateOfBirth: datePtr(1970, 6, 22),
		HireDate:    datePtr(2008, 3, 1),
		Tier:        2,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    18.17,
		PurchasedYears: 3.00,
		TotalForBenefit: 21.17,
		TotalForElig:   18.17,
		TotalForIPR:    18.17,
	}
	retDate := date(2026, 5, 1)

	result := Evaluate(member, svcCredit, retDate)

	// Rule of 75 sum should be 73.17
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 73.17, 0.5)
	if result.RuleOfNQualifies {
		t.Error("Case 2 should NOT qualify for Rule of 75 yet")
	}

	// Gap is 75 - 73.17 = 1.83
	gap := 75.0 - result.RuleOfNSum
	if gap > 2.0 || gap < 1.0 {
		t.Errorf("Expected gap ~1.83, got %.2f", gap)
	}
}

// TestCase2WaitOneYear verifies that waiting 1 year makes Jennifer qualify for Rule of 75.
func TestCase2WaitOneYear(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-100002",
		DateOfBirth: datePtr(1970, 6, 22),
		HireDate:    datePtr(2008, 3, 1),
		Tier:        2,
	}
	// Projected: +1 year of earned service
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    19.17,
		PurchasedYears: 3.00,
		TotalForBenefit: 22.17,
		TotalForElig:   19.17,
		TotalForIPR:    19.17,
	}
	retDate := date(2027, 5, 1) // 1 year later

	result := Evaluate(member, svcCredit, retDate)

	// Age 56 + 19.17 = 75.17 → qualifies
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 75.17, 0.5)
	if !result.RuleOfNQualifies {
		t.Error("Case 2 should qualify for Rule of 75 after waiting 1 year")
	}
	if result.RetirementType != "rule_of_75" {
		t.Errorf("expected rule_of_75, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
}

// TestCase3NormalAt65 verifies Case 3 reaches normal retirement at 65.
func TestCase3NormalAt65(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-100003",
		DateOfBirth: datePtr(1963, 2, 14),
		HireDate:    datePtr(2012, 9, 1),
		Tier:        3,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    15.58,
		TotalForBenefit: 15.58,
		TotalForElig:   15.58,
		TotalForIPR:    15.58,
	}
	retDate := date(2028, 4, 1) // Age 65

	result := Evaluate(member, svcCredit, retDate)

	if result.RetirementType != "normal" {
		t.Errorf("expected normal at age 65, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
}

// TestEligibilityPathsForEarlyRetirement verifies paths for Case 2.
func TestEligibilityPathsForEarlyRetirement(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-100002",
		DateOfBirth: datePtr(1970, 6, 22),
		HireDate:    datePtr(2008, 3, 1),
		Tier:        2,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    18.17,
		PurchasedYears: 3.00,
		TotalForBenefit: 21.17,
		TotalForElig:   18.17,
		TotalForIPR:    18.17,
	}
	retDate := date(2026, 5, 1)

	result := Evaluate(member, svcCredit, retDate)

	if len(result.Paths) < 4 {
		t.Fatalf("expected at least 4 paths, got %d", len(result.Paths))
	}

	// Verify early retirement path has reduction info
	for _, p := range result.Paths {
		if p.PathType == "early" {
			if !p.Eligible {
				t.Error("early path should be eligible for Case 2")
			}
			assertFloat(t, "early_reduction_pct", p.ReductionPct, 30.0, 0.1)
			assertFloat(t, "early_reduction_factor", p.ReductionFactor, 0.70, 0.01)
		}
		if p.PathType == "rule75" {
			if p.Eligible {
				t.Error("rule75 should NOT be eligible for Case 2")
			}
		}
	}
}
