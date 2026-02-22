package dro

import (
	"math"
	"testing"
	"time"
)

func date(y, m, d int) time.Time {
	return time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
}

func assertFloat(t *testing.T, name string, got, want, tolerance float64) {
	t.Helper()
	if math.Abs(got-want) > tolerance {
		t.Errorf("%s: got %.2f, want %.2f (diff %.4f)", name, got, want, math.Abs(got-want))
	}
}

// TestCase4DROCalculation verifies the DRO split for Case 4 (Robert Martinez with DRO).
// Marriage: 1999-08-15 to 2017-11-03 → 18.25 years during marriage
// Total service: 28.75 years
// Marital fraction: 18.25 / 28.75 = 0.6348
// Maximum benefit: $6,117.68
// Marital share: $6,117.68 × 0.6348 = $3,883.10
// Alt payee (40%): $3,883.10 × 0.40 = $1,553.24
// Member remaining: $6,117.68 - $1,553.24 = $4,564.44
func TestCase4DROCalculation(t *testing.T) {
	input := CalculationInput{
		TotalServiceYears: 28.75,
		HireDate:          date(1997, 6, 15),
		RetirementDate:    date(2026, 4, 1),
		MarriageDate:      date(1999, 8, 15),
		DivorceDate:       date(2017, 11, 3),
		DivisionMethod:    "percentage",
		DivisionPct:       0.40,
		MaximumBenefit:    6117.68,
		AltPayeeName:      "Patricia Martinez",
	}

	result := Calculate(input)

	assertFloat(t, "service_during_marriage", result.ServiceDuringMarriage, 18.25, 0.05)
	assertFloat(t, "marital_fraction", result.MaritalFraction, 0.6348, 0.001)
	assertFloat(t, "marital_share", result.MaritalShareOfBenefit, 3883.10, 0.50)
	assertFloat(t, "alt_payee_share", result.AlternatePayeeShare, 1553.24, 0.50)
	assertFloat(t, "member_remaining", result.MemberRemainingBenefit, 4564.44, 0.50)

	t.Logf("DRO: marriage=%.2f yrs, fraction=%.4f, marital_share=%.2f, alt=%.2f, member=%.2f",
		result.ServiceDuringMarriage, result.MaritalFraction,
		result.MaritalShareOfBenefit, result.AlternatePayeeShare, result.MemberRemainingBenefit)
}

// TestDRONoDRO verifies handling when there is no DRO.
func TestDRONoDRO(t *testing.T) {
	input := CalculationInput{
		TotalServiceYears: 28.75,
		MaximumBenefit:    6117.68,
	}

	result := Calculate(input)

	assertFloat(t, "member_remaining", result.MemberRemainingBenefit, 6117.68, 0.01)
	assertFloat(t, "alt_payee_share", result.AlternatePayeeShare, 0, 0.01)
}

// TestDROFixedAmount verifies fixed dollar amount division method.
func TestDROFixedAmount(t *testing.T) {
	input := CalculationInput{
		TotalServiceYears: 28.75,
		HireDate:          date(1997, 6, 15),
		RetirementDate:    date(2026, 4, 1),
		MarriageDate:      date(1999, 8, 15),
		DivorceDate:       date(2017, 11, 3),
		DivisionMethod:    "fixed_amount",
		DivisionAmt:       1500.00,
		MaximumBenefit:    6117.68,
		AltPayeeName:      "Patricia Martinez",
	}

	result := Calculate(input)

	assertFloat(t, "alt_payee_share", result.AlternatePayeeShare, 1500.00, 0.01)
	assertFloat(t, "member_remaining", result.MemberRemainingBenefit, 4617.68, 0.01)
}

// TestMaritalServiceCalculation verifies the service during marriage calculation.
// Marriage: Aug 15, 1999 to Nov 3, 2017
// That's approximately 18.22 years (more precisely).
// ASSUMPTION: [Q-CALC-02] Using year-month method (months/12).
func TestMaritalServiceCalculation(t *testing.T) {
	marriageDate := date(1999, 8, 15)
	divorceDate := date(2017, 11, 3)

	years := serviceDuringMarriage(marriageDate, divorceDate)

	// 18 years, 2-3 months ≈ 18.22 (months/12 method)
	// The fixture says 18.25 years. Our year-month calculation should be close.
	assertFloat(t, "service_during_marriage", years, 18.25, 0.10)

	t.Logf("Marital service: %.4f years", years)
}
