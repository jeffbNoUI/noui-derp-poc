package eligibility

import (
	"testing"

	"github.com/noui-derp-poc/intelligence/internal/models"
)

// Boundary tests verify behavior at exact thresholds.

func TestBoundary_RuleOf75_Exact(t *testing.T) {
	// Age 55 + 20 earned = 75 exactly → Rule of 75 qualifies
	member := models.MemberData{
		MemberID:    "BND-001",
		DateOfBirth: datePtr(1970, 1, 1),
		HireDate:    datePtr(2005, 6, 15),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    20.00,
		TotalForBenefit: 20.00,
		TotalForElig:   20.00,
		TotalForIPR:    20.00,
	}
	retDate := date(2025, 1, 1) // age 55

	result := Evaluate(member, svc, retDate)
	if result.RetirementType != "rule_of_75" {
		t.Errorf("expected rule_of_75 at exact boundary, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction", result.ReductionFactor, 1.0, 0.01)
}

func TestBoundary_RuleOf75_JustBelow(t *testing.T) {
	// Age 55 + 19.99 = 74.99 → NOT Rule of 75
	member := models.MemberData{
		MemberID:    "BND-002",
		DateOfBirth: datePtr(1970, 1, 1),
		HireDate:    datePtr(2005, 6, 15),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    19.99,
		TotalForBenefit: 19.99,
		TotalForElig:   19.99,
		TotalForIPR:    19.99,
	}
	retDate := date(2025, 1, 1)

	result := Evaluate(member, svc, retDate)
	if result.RetirementType == "rule_of_75" {
		t.Error("should NOT qualify for Rule of 75 at 74.99")
	}
	if result.RetirementType != "early" {
		t.Errorf("expected early retirement fallback, got %s", result.RetirementType)
	}
}

func TestBoundary_RuleOf85_Exact(t *testing.T) {
	// Tier 3: Age 60 + 25 = 85 exactly → Rule of 85
	member := models.MemberData{
		MemberID:    "BND-003",
		DateOfBirth: datePtr(1965, 6, 15),
		HireDate:    datePtr(2012, 1, 1),
		Tier:        3,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    25.00,
		TotalForBenefit: 25.00,
		TotalForElig:   25.00,
		TotalForIPR:    25.00,
	}
	retDate := date(2025, 6, 15) // age 60

	result := Evaluate(member, svc, retDate)
	if result.RetirementType != "rule_of_85" {
		t.Errorf("expected rule_of_85, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction", result.ReductionFactor, 1.0, 0.01)
}

func TestBoundary_NormalRetirement_Exact65(t *testing.T) {
	// Age exactly 65, 10 years service → normal
	member := models.MemberData{
		MemberID:    "BND-005",
		DateOfBirth: datePtr(1960, 3, 15),
		HireDate:    datePtr(2005, 1, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    20.00,
		TotalForBenefit: 20.00,
		TotalForElig:   20.00,
		TotalForIPR:    20.00,
	}
	retDate := date(2025, 3, 15) // age 65

	result := Evaluate(member, svc, retDate)
	if !result.NormalRetirementEligible {
		t.Error("should be eligible for normal retirement at 65")
	}
	if result.RetirementType != "normal" {
		t.Errorf("expected normal, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction", result.ReductionFactor, 1.0, 0.01)
}

func TestBoundary_NotVested_4_99Years(t *testing.T) {
	member := models.MemberData{
		MemberID:    "BND-006",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2020, 2, 1),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    4.99,
		TotalForBenefit: 4.99,
		TotalForElig:   4.99,
		TotalForIPR:    4.99,
	}
	retDate := date(2025, 1, 1)

	result := Evaluate(member, svc, retDate)
	if result.Vested {
		t.Error("should NOT be vested with 4.99 years")
	}
	if result.RetirementType != "not_eligible" {
		t.Errorf("expected not_eligible, got %s", result.RetirementType)
	}
}

func TestBoundary_Vested_Exact5Years(t *testing.T) {
	member := models.MemberData{
		MemberID:    "BND-007",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2020, 1, 1),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    5.00,
		TotalForBenefit: 5.00,
		TotalForElig:   5.00,
		TotalForIPR:    5.00,
	}
	retDate := date(2025, 1, 1) // age 65

	result := Evaluate(member, svc, retDate)
	if !result.Vested {
		t.Error("should be vested with exactly 5.00 years")
	}
	if result.RetirementType == "not_eligible" {
		t.Error("should be eligible with 5 years at age 65")
	}
}

func TestBoundary_PurchasedServiceExcluded_RuleOf75(t *testing.T) {
	// 18 earned + 3 purchased. Age 57. 57+18(earned)=75 → Rule of 75
	// CRITICAL: Rule of 75 uses TotalForElig (earned only)
	member := models.MemberData{
		MemberID:    "BND-008",
		DateOfBirth: datePtr(1968, 1, 1),
		HireDate:    datePtr(2004, 1, 1),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:      18.00,
		PurchasedYears:   3.00,
		TotalForBenefit:  21.00,
		TotalForElig:     18.00, // Earned only
		TotalForIPR:      18.00,
	}
	retDate := date(2025, 1, 1) // age 57

	result := Evaluate(member, svc, retDate)
	if result.RetirementType != "rule_of_75" {
		t.Errorf("expected rule_of_75 (57+18=75), got %s", result.RetirementType)
	}
	assertFloat(t, "reduction", result.ReductionFactor, 1.0, 0.01)
}

func TestBoundary_TierDetermination_Sept1_2004(t *testing.T) {
	// Hired exactly September 1, 2004 → Tier 2
	member := models.MemberData{
		MemberID:    "BND-010",
		DateOfBirth: datePtr(1970, 1, 1),
		HireDate:    datePtr(2004, 9, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    20.00,
		TotalForBenefit: 20.00,
		TotalForElig:   20.00,
		TotalForIPR:    20.00,
	}
	retDate := date(2025, 1, 1)

	result := Evaluate(member, svc, retDate)
	if result.Tier != 2 {
		t.Errorf("expected Tier 2, got %d", result.Tier)
	}
}

func TestBoundary_RuleOf85_MinAge59_Fails(t *testing.T) {
	// Tier 3: Age 59 + 30 = 89 ≥ 85, but min age is 60, so Rule of 85 fails.
	// Falls to early retirement instead.
	member := models.MemberData{
		MemberID:    "BND-011",
		DateOfBirth: datePtr(1966, 6, 15),
		HireDate:    datePtr(2012, 1, 1),
		Tier:        3,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    30.00,
		TotalForBenefit: 30.00,
		TotalForElig:   30.00,
		TotalForIPR:    30.00,
	}
	retDate := date(2025, 6, 14) // age 58 (birthday not yet reached)

	result := Evaluate(member, svc, retDate)
	// 58 + 30 = 88 ≥ 85, but 58 < 60 (min age), so Rule of 85 should NOT qualify
	if result.RuleOfNQualifies {
		t.Error("should NOT qualify for Rule of 85 — age 58 is below minimum age 60")
	}
	if !result.RuleOfNMinAgeMet {
		// Good: min age not met
	}
	// Should be not_eligible for Rule of 85, but eligible for early retirement
	// Tier 3 early min age is 60, so age 58 doesn't qualify for early either
	if result.RetirementType == "rule_of_85" {
		t.Error("should not be rule_of_85 with age < 60")
	}
}

func TestBoundary_Tier3_MaxReduction_Age60(t *testing.T) {
	// Tier 3, age 60: 6% × (65-60) = 30% reduction, factor = 0.70
	member := models.MemberData{
		MemberID:    "BND-012",
		DateOfBirth: datePtr(1965, 1, 1),
		HireDate:    datePtr(2012, 1, 1),
		Tier:        3,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    10.00,
		TotalForBenefit: 10.00,
		TotalForElig:   10.00,
		TotalForIPR:    10.00,
	}
	retDate := date(2025, 1, 1) // age 60, 10+60=70 < 85

	result := Evaluate(member, svc, retDate)
	if result.RetirementType != "early" {
		t.Errorf("expected early, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction_pct", result.EarlyRetirementReductionPct, 30.0, 0.1)
	assertFloat(t, "reduction_factor", result.ReductionFactor, 0.70, 0.01)
}

func TestBoundary_NormalOverridesRuleOfN(t *testing.T) {
	// Age 65 with Rule of 75 qualifying (65+20=85 ≥ 75).
	// Normal retirement takes precedence.
	member := models.MemberData{
		MemberID:    "BND-013",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2000, 1, 1),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    20.00,
		TotalForBenefit: 20.00,
		TotalForElig:   20.00,
		TotalForIPR:    20.00,
	}
	retDate := date(2025, 1, 1) // age 65

	result := Evaluate(member, svc, retDate)
	if result.RetirementType != "normal" {
		t.Errorf("expected normal (takes precedence), got %s", result.RetirementType)
	}
	if !result.NormalRetirementEligible {
		t.Error("should be eligible for normal retirement")
	}
	// Rule of N is still evaluated for transparency
	if !result.RuleOfNQualifies {
		t.Error("Rule of 75 should still show as qualifying (for transparency)")
	}
	assertFloat(t, "reduction", result.ReductionFactor, 1.0, 0.01)
}

func TestBoundary_VestingExcludesPurchased(t *testing.T) {
	// 3 earned + 2 purchased = 5 total but only 3 earned.
	// Vesting requires 5 EARNED years → not vested.
	member := models.MemberData{
		MemberID:    "BND-014",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2022, 1, 1),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:    3.00,
		PurchasedYears: 2.00,
		TotalForBenefit: 5.00,
		TotalForElig:   3.00, // Earned only
		TotalForIPR:    3.00,
	}
	retDate := date(2025, 1, 1)

	result := Evaluate(member, svc, retDate)
	if result.Vested {
		t.Error("should NOT be vested — purchased service excluded from vesting")
	}
	if result.RetirementType != "not_eligible" {
		t.Errorf("expected not_eligible, got %s", result.RetirementType)
	}
}

// =============================================================================
// Edge Case Tests: Age at Retirement Boundary
// =============================================================================

func TestEdge_AgeExact65_BirthdaySameDay(t *testing.T) {
	// Born March 1, 1961, retiring March 1, 2026 -> exactly 65.
	// Birthday IS on the retirement date -> ageAtDate should return 65.
	// Normal retirement eligible.
	member := models.MemberData{
		MemberID:    "EDGE-AGE-001",
		DateOfBirth: datePtr(1961, 3, 1),
		HireDate:    datePtr(2000, 1, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     20.00,
		TotalForBenefit: 20.00,
		TotalForElig:    20.00,
		TotalForIPR:     20.00,
	}
	retDate := date(2026, 3, 1)

	result := Evaluate(member, svc, retDate)
	assertFloat(t, "age_at_retirement", result.AgeAtRetirement, 65.0, 0.01)
	if !result.NormalRetirementEligible {
		t.Error("member born March 1 retiring March 1 should be exactly 65 -> normal retirement")
	}
	if result.RetirementType != "normal" {
		t.Errorf("expected normal, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
}

func TestEdge_Age64_BirthdayNextDay(t *testing.T) {
	// Born March 2, 1961, retiring March 1, 2026 -> birthday hasn't happened -> age 64.
	// NOT normal retirement. For Tier 2 (min early age 55), Rule of 75 check:
	// 64 + 20 = 84 >= 75, age 64 >= 55 (min for T1/T2) -> Rule of 75 qualifies.
	member := models.MemberData{
		MemberID:    "EDGE-AGE-002",
		DateOfBirth: datePtr(1961, 3, 2),
		HireDate:    datePtr(2000, 1, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     20.00,
		TotalForBenefit: 20.00,
		TotalForElig:    20.00,
		TotalForIPR:     20.00,
	}
	retDate := date(2026, 3, 1)

	result := Evaluate(member, svc, retDate)
	assertFloat(t, "age_at_retirement", result.AgeAtRetirement, 64.0, 0.01)
	if result.NormalRetirementEligible {
		t.Error("member born March 2 retiring March 1 should be 64, NOT normal retirement")
	}
	// 64 + 20 = 84 >= 75, and age 64 >= 55 (min for T2), so Rule of 75 qualifies
	if !result.RuleOfNQualifies {
		t.Error("expected Rule of 75 to qualify (64 + 20 = 84 >= 75, age 64 >= min 55)")
	}
	if result.RetirementType != "rule_of_75" {
		t.Errorf("expected rule_of_75, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
}

func TestEdge_LeapYearBirthday(t *testing.T) {
	// Born Feb 29, 2000 (leap year), retiring March 1, 2025.
	// The birthday Feb 29 doesn't exist in 2025 (non-leap year).
	// ageAtDate logic: month=3 > month=2, so birthday HAS occurred -> age = 25.
	// This member has only 5 years service so is vested but too young for any retirement type.
	member := models.MemberData{
		MemberID:    "EDGE-AGE-003",
		DateOfBirth: datePtr(2000, 2, 29),
		HireDate:    datePtr(2020, 1, 1),
		Tier:        3,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     5.00,
		TotalForBenefit: 5.00,
		TotalForElig:    5.00,
		TotalForIPR:     5.00,
	}
	retDate := date(2025, 3, 1)

	result := Evaluate(member, svc, retDate)
	// 2025 - 2000 = 25; March 1 > Feb 29 (month 3 > month 2), so age = 25
	assertFloat(t, "age_at_retirement", result.AgeAtRetirement, 25.0, 0.01)
	if !result.Vested {
		t.Error("should be vested with 5 years")
	}
	// Age 25 is below any early retirement minimum (55 for T1/T2, 60 for T3)
	if result.RetirementType != "deferred" {
		t.Errorf("expected deferred (too young), got %s", result.RetirementType)
	}
}

// =============================================================================
// Edge Case Tests: Rule of N Minimum Age Enforcement
// =============================================================================

func TestEdge_RuleOf75_SumQualifies_MinAgeNotMet(t *testing.T) {
	// Tier 1: Age 54, earned 22. Sum = 76 >= 75, BUT age 54 < min 55.
	// Rule of 75 should NOT qualify.
	member := models.MemberData{
		MemberID:    "EDGE-MINAGE-001",
		DateOfBirth: datePtr(1972, 1, 1),
		HireDate:    datePtr(2000, 1, 1),
		Tier:        1,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     22.00,
		TotalForBenefit: 22.00,
		TotalForElig:    22.00,
		TotalForIPR:     22.00,
	}
	retDate := date(2026, 1, 1) // age 54

	result := Evaluate(member, svc, retDate)
	assertFloat(t, "age", result.AgeAtRetirement, 54.0, 0.01)
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 76.0, 0.1)
	if result.RuleOfNMinAgeMet {
		t.Error("min age should NOT be met: age 54 < min 55 for T1")
	}
	if result.RuleOfNQualifies {
		t.Error("Rule of 75 should NOT qualify -- sum=76 but age 54 < min 55")
	}
	// Tier 1 min early age is 55, so age 54 does not qualify for early either
	if result.RetirementType != "deferred" {
		t.Errorf("expected deferred (age 54 below T1 early min 55), got %s", result.RetirementType)
	}
}

func TestEdge_RuleOf85_SumQualifies_MinAgeNotMet(t *testing.T) {
	// Tier 3: Age 59, earned 27. Sum = 86 >= 85, BUT age 59 < min 60.
	// Rule of 85 should NOT qualify.
	member := models.MemberData{
		MemberID:    "EDGE-MINAGE-002",
		DateOfBirth: datePtr(1967, 6, 1),
		HireDate:    datePtr(2012, 1, 1),
		Tier:        3,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     27.00,
		TotalForBenefit: 27.00,
		TotalForElig:    27.00,
		TotalForIPR:     27.00,
	}
	retDate := date(2026, 6, 1) // age 59

	result := Evaluate(member, svc, retDate)
	assertFloat(t, "age", result.AgeAtRetirement, 59.0, 0.01)
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 86.0, 0.1)
	if result.RuleOfNMinAgeMet {
		t.Error("min age should NOT be met: age 59 < min 60 for T3")
	}
	if result.RuleOfNQualifies {
		t.Error("Rule of 85 should NOT qualify -- sum=86 but age 59 < min 60")
	}
	// Tier 3 min early age is 60, so age 59 does not qualify for early either
	if result.RetirementType != "deferred" {
		t.Errorf("expected deferred (age 59 below T3 early min 60), got %s", result.RetirementType)
	}
}

func TestEdge_RuleOf75_ExactMinAge_ExactSum(t *testing.T) {
	// Tier 2: Age 55, earned 20. Sum = 75, age = 55 = min.
	// Should qualify for Rule of 75.
	member := models.MemberData{
		MemberID:    "EDGE-MINAGE-003",
		DateOfBirth: datePtr(1971, 1, 1),
		HireDate:    datePtr(2004, 9, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     20.00,
		TotalForBenefit: 20.00,
		TotalForElig:    20.00,
		TotalForIPR:     20.00,
	}
	retDate := date(2026, 1, 1) // age 55

	result := Evaluate(member, svc, retDate)
	assertFloat(t, "age", result.AgeAtRetirement, 55.0, 0.01)
	assertFloat(t, "rule_of_n_sum", result.RuleOfNSum, 75.0, 0.01)
	if !result.RuleOfNMinAgeMet {
		t.Error("min age should be met: age 55 == min 55")
	}
	if !result.RuleOfNQualifies {
		t.Error("Rule of 75 should qualify at exact boundary (sum=75, age=55)")
	}
	if result.RetirementType != "rule_of_75" {
		t.Errorf("expected rule_of_75, got %s", result.RetirementType)
	}
	assertFloat(t, "reduction_factor", result.ReductionFactor, 1.0, 0.01)
}

// =============================================================================
// Edge Case Tests: Rehired Member with Broken Service
// =============================================================================

func TestEdge_RehiredMember_BrokenService(t *testing.T) {
	// Member has 10 years earned, 2 years purchased, and a 5-year gap.
	// TotalForBenefit = 12 (earned + purchased), TotalForElig = 10 (earned only).
	// The gap is already excluded by the connector -- the evaluator respects the
	// service credit summary as provided.
	member := models.MemberData{
		MemberID:    "EDGE-REHIRE-001",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2005, 1, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     10.00,
		PurchasedYears:  2.00,
		TotalForBenefit: 12.00, // earned + purchased
		TotalForElig:    10.00, // earned only -- gap periods excluded
		TotalForIPR:     10.00, // earned only
	}
	retDate := date(2025, 1, 1) // age 65

	result := Evaluate(member, svc, retDate)
	if !result.Vested {
		t.Error("should be vested with 10 earned years")
	}
	// Benefit uses TotalForBenefit (12), but eligibility uses TotalForElig (10)
	assertFloat(t, "total_service", result.TotalServiceYears, 12.00, 0.01)
	assertFloat(t, "earned_service", result.EarnedServiceYears, 10.00, 0.01)
	assertFloat(t, "purchased_service", result.PurchasedServiceYears, 2.00, 0.01)
	// Age 65 + 10 earned = 75, Rule of 75 qualifies, but normal (age 65) takes precedence
	if result.RetirementType != "normal" {
		t.Errorf("expected normal (age 65), got %s", result.RetirementType)
	}
}

// =============================================================================
// Edge Case Tests: Zero Service Purchase Comparison
// =============================================================================

func TestEdge_ServicePurchase_NoEffect_On_RuleOfN(t *testing.T) {
	// Same member, once with 0 purchased and once with 3 purchased.
	// Rule of N sum should be IDENTICAL (purchased excluded from eligibility).
	baseMember := models.MemberData{
		MemberID:    "EDGE-PURCH-001",
		DateOfBirth: datePtr(1968, 1, 1),
		HireDate:    datePtr(2004, 1, 1),
		Tier:        1,
	}

	svcNoPurchase := models.ServiceCreditSummary{
		EarnedYears:     18.00,
		PurchasedYears:  0.00,
		TotalForBenefit: 18.00,
		TotalForElig:    18.00,
		TotalForIPR:     18.00,
	}

	svcWithPurchase := models.ServiceCreditSummary{
		EarnedYears:     18.00,
		PurchasedYears:  3.00,
		TotalForBenefit: 21.00, // Benefit sees purchased
		TotalForElig:    18.00, // Eligibility does NOT see purchased
		TotalForIPR:     18.00, // IPR does NOT see purchased
	}

	retDate := date(2026, 1, 1) // age 58

	resultNoPurchase := Evaluate(baseMember, svcNoPurchase, retDate)
	resultWithPurchase := Evaluate(baseMember, svcWithPurchase, retDate)

	// Rule of N sum should be identical -- purchased excluded
	assertFloat(t, "ruleOfN_no_purchase", resultNoPurchase.RuleOfNSum, 76.0, 0.1)
	assertFloat(t, "ruleOfN_with_purchase", resultWithPurchase.RuleOfNSum, 76.0, 0.1)
	if resultNoPurchase.RuleOfNSum != resultWithPurchase.RuleOfNSum {
		t.Errorf("Rule of N sum should be identical with and without purchased service: %.2f vs %.2f",
			resultNoPurchase.RuleOfNSum, resultWithPurchase.RuleOfNSum)
	}

	// Both should qualify for Rule of 75 (58 + 18 = 76 >= 75, age 58 >= 55)
	if !resultNoPurchase.RuleOfNQualifies {
		t.Error("no-purchase: should qualify for Rule of 75")
	}
	if !resultWithPurchase.RuleOfNQualifies {
		t.Error("with-purchase: should qualify for Rule of 75")
	}

	// Retirement type should be the same
	if resultNoPurchase.RetirementType != resultWithPurchase.RetirementType {
		t.Errorf("retirement type should be same: %s vs %s",
			resultNoPurchase.RetirementType, resultWithPurchase.RetirementType)
	}

	// But TotalServiceYears (for benefit) should differ
	if resultNoPurchase.TotalServiceYears == resultWithPurchase.TotalServiceYears {
		t.Error("TotalServiceYears should differ -- purchased adds to benefit total")
	}
	assertFloat(t, "total_no_purchase", resultNoPurchase.TotalServiceYears, 18.00, 0.01)
	assertFloat(t, "total_with_purchase", resultWithPurchase.TotalServiceYears, 21.00, 0.01)
}

// =============================================================================
// Edge Case Tests: Leave Payout Eligibility Boundary
// =============================================================================

func TestEdge_LeavePayoutEligible_Dec31_2009(t *testing.T) {
	// Hired December 31, 2009 -> before Jan 1, 2010 cutoff -> eligible.
	member := models.MemberData{
		MemberID:    "EDGE-LEAVE-001",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2009, 12, 31),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     15.00,
		TotalForBenefit: 15.00,
		TotalForElig:    15.00,
		TotalForIPR:     15.00,
	}
	retDate := date(2025, 1, 1)

	result := Evaluate(member, svc, retDate)
	if !result.LeavePayoutEligible {
		t.Error("hired Dec 31, 2009 (before Jan 1, 2010) should be leave payout eligible")
	}
}

func TestEdge_LeavePayoutNotEligible_Jan1_2010(t *testing.T) {
	// Hired January 1, 2010 -> on/after cutoff -> NOT eligible.
	member := models.MemberData{
		MemberID:    "EDGE-LEAVE-002",
		DateOfBirth: datePtr(1960, 1, 1),
		HireDate:    datePtr(2010, 1, 1),
		Tier:        2,
	}
	svc := models.ServiceCreditSummary{
		EarnedYears:     15.00,
		TotalForBenefit: 15.00,
		TotalForElig:    15.00,
		TotalForIPR:     15.00,
	}
	retDate := date(2025, 1, 1)

	result := Evaluate(member, svc, retDate)
	if result.LeavePayoutEligible {
		t.Error("hired Jan 1, 2010 (on cutoff) should NOT be leave payout eligible")
	}
}
