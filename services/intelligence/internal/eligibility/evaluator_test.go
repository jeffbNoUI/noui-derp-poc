package eligibility

import (
	"math"
	"testing"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/models"
)

func date(y, m, d int) time.Time {
	return time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
}

func datePtr(y, m, d int) *time.Time {
	t := date(y, m, d)
	return &t
}

func assertFloat(t *testing.T, name string, got, want, tolerance float64) {
	t.Helper()
	if math.Abs(got-want) > tolerance {
		t.Errorf("%s: got %.4f, want %.4f (diff %.4f)", name, got, want, math.Abs(got-want))
	}
}

// TestCase1MartinezEligibility verifies eligibility for Case 1.
// Tier 1, age 63, earned service 28.75. Rule of 75: 91.75 → qualifies.
// No early retirement reduction. Leave payout eligible.
func TestCase1MartinezEligibility(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-100001",
		DateOfBirth: datePtr(1963, 3, 8),
		HireDate:    datePtr(1997, 6, 15),
		Tier:        1,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    28.75,
		PurchasedYears: 0,
		TotalForBenefit: 28.75,
		TotalForElig:   28.75,
		TotalForIPR:    28.75,
	}
	retDate := date(2026, 4, 1)

	result := Evaluate(member, svcCredit, retDate)

	if result.Tier != 1 {
		t.Errorf("tier = %d, want 1", result.Tier)
	}
	assertFloat(t, "age_at_retirement", result.AgeAtRetirement, 63.00, 0.1)
	assertFloat(t, "earned_service", result.EarnedServiceYears, 28.75, 0.01)
	if !result.Vested {
		t.Error("should be vested")
	}
	if result.RuleOfNApplicable != "75" {
		t.Errorf("rule_of_n = %q, want 75", result.RuleOfNApplicable)
	}
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 91.75, 0.1)
	if !result.RuleOfNQualifies {
		t.Error("should qualify for Rule of 75")
	}
	if result.EarlyRetirementReductionPct != 0 {
		t.Errorf("reduction = %.2f%%, want 0", result.EarlyRetirementReductionPct)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
	if result.RetirementType != "rule_of_75" {
		t.Errorf("type = %q, want rule_of_75", result.RetirementType)
	}
	if !result.LeavePayoutEligible {
		t.Error("should be leave payout eligible (hired before 2010)")
	}
}

// TestCase2KimEligibility verifies eligibility for Case 2.
// Tier 2, age 55, earned 18.17, purchased 3.00. Rule of 75: 73.17 → fails.
// Early retirement: 30% reduction (3% × 10 years). Leave payout eligible by hire date.
// CRITICAL: purchased service excluded from Rule of 75.
func TestCase2KimEligibility(t *testing.T) {
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
		TotalForElig:   18.17, // Purchased excluded
		TotalForIPR:    18.17,
	}
	retDate := date(2026, 5, 1)

	result := Evaluate(member, svcCredit, retDate)

	if result.Tier != 2 {
		t.Errorf("tier = %d, want 2", result.Tier)
	}
	assertFloat(t, "age_at_retirement", result.AgeAtRetirement, 55.00, 0.5)
	assertFloat(t, "earned_service", result.EarnedServiceYears, 18.17, 0.01)
	assertFloat(t, "purchased_service", result.PurchasedServiceYears, 3.00, 0.01)
	if !result.Vested {
		t.Error("should be vested")
	}

	// CRITICAL: Rule of 75 uses EARNED only
	if result.RuleOfNApplicable != "75" {
		t.Errorf("rule_of_n = %q, want 75", result.RuleOfNApplicable)
	}
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 73.17, 0.5)
	if result.RuleOfNQualifies {
		t.Error("should NOT qualify for Rule of 75 (purchased excluded)")
	}

	// Early retirement
	if !result.EarlyRetirementEligible {
		t.Error("should be eligible for early retirement")
	}
	assertFloat(t, "reduction_pct", result.EarlyRetirementReductionPct, 30.0, 0.1)
	assertFloat(t, "reduction_factor", result.ReductionFactor, 0.70, 0.01)
	if result.YearsUnder65 != 10 {
		t.Errorf("years_under_65 = %d, want 10", result.YearsUnder65)
	}
	if result.RetirementType != "early" {
		t.Errorf("type = %q, want early", result.RetirementType)
	}
	if !result.LeavePayoutEligible {
		t.Error("should be leave payout eligible (hired 2008, before 2010)")
	}
}

// TestCase3WashingtonEligibility verifies eligibility for Case 3.
// Tier 3, age 63, earned 13.58. Rule of 85: 76.58 → fails.
// Early retirement: 12% reduction (6% × 2 years). Leave payout NOT eligible (hired after 2010).
func TestCase3WashingtonEligibility(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-100003",
		DateOfBirth: datePtr(1963, 2, 14),
		HireDate:    datePtr(2012, 9, 1),
		Tier:        3,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    13.58,
		TotalForBenefit: 13.58,
		TotalForElig:   13.58,
		TotalForIPR:    13.58,
	}
	retDate := date(2026, 4, 1)

	result := Evaluate(member, svcCredit, retDate)

	if result.Tier != 3 {
		t.Errorf("tier = %d, want 3", result.Tier)
	}
	assertFloat(t, "age_at_retirement", result.AgeAtRetirement, 63.00, 0.1)
	if !result.Vested {
		t.Error("should be vested")
	}

	// Rule of 85 (not 75) for Tier 3
	if result.RuleOfNApplicable != "85" {
		t.Errorf("rule_of_n = %q, want 85", result.RuleOfNApplicable)
	}
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 76.58, 0.1)
	if result.RuleOfNQualifies {
		t.Error("should NOT qualify for Rule of 85")
	}

	// Early retirement with 6% rate
	if !result.EarlyRetirementEligible {
		t.Error("should be eligible for early retirement")
	}
	assertFloat(t, "reduction_pct", result.EarlyRetirementReductionPct, 12.0, 0.1)
	assertFloat(t, "reduction_factor", result.ReductionFactor, 0.88, 0.01)
	if result.YearsUnder65 != 2 {
		t.Errorf("years_under_65 = %d, want 2", result.YearsUnder65)
	}
	if result.RetirementType != "early" {
		t.Errorf("type = %q, want early", result.RetirementType)
	}

	// Leave payout NOT eligible (hired after 2010)
	if result.LeavePayoutEligible {
		t.Error("should NOT be leave payout eligible (hired 2012, after 2010)")
	}
}

// TestNormalRetirement verifies age 65+ with 5 years service.
func TestNormalRetirement(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-999",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2000, 1, 1),
		Tier:        1,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    26.0,
		TotalForBenefit: 26.0,
		TotalForElig:   26.0,
		TotalForIPR:    26.0,
	}
	retDate := date(2026, 1, 1) // Age 66

	result := Evaluate(member, svcCredit, retDate)

	if !result.NormalRetirementEligible {
		t.Error("should qualify for normal retirement")
	}
	if result.RetirementType != "normal" {
		t.Errorf("type = %q, want normal", result.RetirementType)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
}

// TestNotVested verifies a member with <5 years service.
func TestNotVested(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-999",
		DateOfBirth: datePtr(1970, 1, 1),
		HireDate:    datePtr(2023, 1, 1),
		Tier:        2,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    3.0,
		TotalForBenefit: 3.0,
		TotalForElig:   3.0,
		TotalForIPR:    3.0,
	}
	retDate := date(2026, 1, 1)

	result := Evaluate(member, svcCredit, retDate)

	if result.Vested {
		t.Error("should NOT be vested with 3 years service")
	}
	if result.RetirementType != "not_eligible" {
		t.Errorf("type = %q, want not_eligible", result.RetirementType)
	}
}

// TestRuleOf75ExactBoundary verifies the exact threshold.
func TestRuleOf75ExactBoundary(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-999",
		DateOfBirth: datePtr(1971, 1, 1),
		HireDate:    datePtr(2001, 1, 1),
		Tier:        1,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    20.0,
		TotalForBenefit: 20.0,
		TotalForElig:   20.0,
		TotalForIPR:    20.0,
	}
	retDate := date(2026, 1, 1) // Age 55, earned 20 → 75 exactly

	result := Evaluate(member, svcCredit, retDate)

	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 75.0, 0.1)
	if !result.RuleOfNQualifies {
		t.Error("should qualify for Rule of 75 at exactly 75.00")
	}
	if result.RetirementType != "rule_of_75" {
		t.Errorf("type = %q, want rule_of_75", result.RetirementType)
	}
}

// TestRuleOf75JustBelow verifies one unit below threshold.
func TestRuleOf75JustBelow(t *testing.T) {
	member := models.MemberData{
		MemberID:    "M-999",
		DateOfBirth: datePtr(1971, 1, 1),
		HireDate:    datePtr(2001, 2, 1),
		Tier:        1,
	}
	svcCredit := models.ServiceCreditSummary{
		EarnedYears:    19.99,
		TotalForBenefit: 19.99,
		TotalForElig:   19.99,
		TotalForIPR:    19.99,
	}
	retDate := date(2026, 1, 1) // Age 55, earned 19.99 → 74.99

	result := Evaluate(member, svcCredit, retDate)

	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 74.99, 0.1)
	if result.RuleOfNQualifies {
		t.Error("should NOT qualify for Rule of 75 at 74.99")
	}
}
