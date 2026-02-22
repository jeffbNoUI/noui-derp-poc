// Package dro implements the DERP Domestic Relations Order calculation.
//
// DRO calculation sequence per RULE-DRO-SEQUENCE:
//   1. Calculate marital fraction: service_during_marriage / total_service
//   2. Calculate marital share: maximum_benefit × marital_fraction
//   3. Apply DRO division to marital share (percentage or fixed amount)
//   4. Member's remaining = maximum_benefit - alternate_payee_share
//   5. J&S options apply to member's remaining (NOT to total benefit)
//
// CRITICAL: DRO split occurs BEFORE payment option selection.
// The alternate payee's share is unaffected by the member's J&S election.
// Source: RMC §18-418
package dro

import (
	"math"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/models"
)

// CalculationInput contains all inputs needed for DRO calculation.
type CalculationInput struct {
	TotalServiceYears float64
	HireDate          time.Time
	RetirementDate    time.Time
	MarriageDate      time.Time
	DivorceDate       time.Time
	DivisionMethod    string  // "percentage" or "fixed_amount"
	DivisionPct       float64 // For percentage method
	DivisionAmt       float64 // For fixed_amount method
	MaximumBenefit    float64
	AltPayeeName      string
}

// Calculate performs the DRO split calculation.
//
// Returns the DRO impact breakdown showing marital fraction, shares, and remaining benefit.
// If no marriage dates are provided (zero time), returns the full benefit to the member.
func Calculate(input CalculationInput) models.DROResult {
	result := models.DROResult{
		TotalServiceYears:      input.TotalServiceYears,
		MaximumBenefit:         input.MaximumBenefit,
		MemberRemainingBenefit: input.MaximumBenefit,
		AltPayeeName:           input.AltPayeeName,
	}

	// If no marriage dates, no DRO to apply
	if input.MarriageDate.IsZero() || input.DivorceDate.IsZero() {
		return result
	}

	// Step 1: Calculate service during marriage
	result.ServiceDuringMarriage = serviceDuringMarriage(input.MarriageDate, input.DivorceDate)

	// Clamp to total service (marriage can't exceed employment)
	if result.ServiceDuringMarriage > input.TotalServiceYears {
		result.ServiceDuringMarriage = input.TotalServiceYears
	}

	// Step 2: Calculate marital fraction
	if input.TotalServiceYears > 0 {
		result.MaritalFraction = bankersRound(result.ServiceDuringMarriage/input.TotalServiceYears, 4)
	}

	result.MarriageStart = input.MarriageDate.Format("2006-01-02")
	result.MarriageEnd = input.DivorceDate.Format("2006-01-02")

	// Step 3: Calculate marital share
	result.MaritalShareOfBenefit = bankersRound(input.MaximumBenefit*result.MaritalFraction, 2)

	// Step 4: Apply division method
	switch input.DivisionMethod {
	case "percentage":
		result.DROPercentage = input.DivisionPct
		result.AlternatePayeeShare = bankersRound(result.MaritalShareOfBenefit*input.DivisionPct, 2)
	case "fixed_amount":
		result.AlternatePayeeShare = input.DivisionAmt
	default:
		// Default to percentage if specified
		if input.DivisionPct > 0 {
			result.DROPercentage = input.DivisionPct
			result.AlternatePayeeShare = bankersRound(result.MaritalShareOfBenefit*input.DivisionPct, 2)
		}
	}

	// Step 5: Member's remaining benefit
	result.MemberRemainingBenefit = bankersRound(input.MaximumBenefit-result.AlternatePayeeShare, 2)

	return result
}

// serviceDuringMarriage calculates the years of service that overlap with the marriage period.
// ASSUMPTION: [Q-CALC-02] Using year-month method (months/12).
// Uses the calendar month difference without day-level adjustment, consistent with
// how DERP calculates service credit (year + months/12).
func serviceDuringMarriage(marriageDate, divorceDate time.Time) float64 {
	years := divorceDate.Year() - marriageDate.Year()
	months := int(divorceDate.Month()) - int(marriageDate.Month())
	totalMonths := years*12 + months

	return math.Round(float64(totalMonths)/12.0*100) / 100 // Round to 2 decimal places
}

// bankersRound implements banker's rounding (round half to even).
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
