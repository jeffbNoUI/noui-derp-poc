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
