// Package eligibility implements the DERP eligibility evaluation logic.
//
// Evaluation order per RULE-ELIG-HIERARCHY:
//   1. Determine tier from hire date
//   2. Calculate age at retirement
//   3. Separate earned vs purchased service
//   4. Check vesting (5 years earned)
//   5. Check normal retirement (age 65+, 5 years)
//   6. Check Rule of 75/85 (tier-specific, earned service only)
//   7. Check early retirement (tier-specific min age, 5 years)
//   8. If none qualify → deferred
package eligibility

import (
	"math"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/models"
	"github.com/noui-derp-poc/intelligence/internal/rules"
)

// Evaluate performs the complete eligibility evaluation for a member.
//
// CRITICAL: Rule of 75/85 and IPR use EARNED service only.
// Benefit calculation uses TOTAL service (earned + purchased).
// See RULE-SVC-PURCHASED, RULE-SVC-SEPARATION.
func Evaluate(member models.MemberData, svcCredit models.ServiceCreditSummary, retirementDate time.Time) models.EligibilityResult {
	result := models.EligibilityResult{
		MemberID:              member.MemberID,
		Tier:                  member.Tier,
		EarnedServiceYears:    svcCredit.EarnedYears,
		PurchasedServiceYears: svcCredit.PurchasedYears,
		TotalServiceYears:     svcCredit.TotalForBenefit,
	}

	// Calculate age at retirement using integer completed years
	if member.DateOfBirth != nil {
		result.AgeAtRetirement = ageAtDate(*member.DateOfBirth, retirementDate)
	}
	age := int(result.AgeAtRetirement)

	// Vesting: 5 years earned service. Source: RMC §18-401
	result.Vested = svcCredit.TotalForElig >= rules.VestingYears

	// Leave payout eligibility: hired before Jan 1, 2010. Source: RULE-LEAVE-PAYOUT
	if member.HireDate != nil {
		cutoff := time.Date(2010, 1, 1, 0, 0, 0, 0, time.UTC)
		result.LeavePayoutEligible = member.HireDate.Before(cutoff)
		if result.LeavePayoutEligible {
			result.LeavePayoutNote = "Hired before 2010-01-01 — eligible for sick/vacation leave payout"
		} else {
			result.LeavePayoutNote = "Hired on or after 2010-01-01 — not eligible"
		}
	}

	if !result.Vested {
		result.RetirementType = "not_eligible"
		result.ReductionFactor = 0
		return result
	}

	// Normal retirement: age 65+, vested. Source: RMC §18-409(a)
	if age >= rules.NormalRetirementAge {
		result.NormalRetirementEligible = true
		result.ReductionFactor = 1.0
		result.RetirementType = "normal"
		// Still evaluate Rule of N for completeness
		evaluateRuleOfN(&result, age, svcCredit)
		return result
	}

	// Rule of 75/85: earned service only, tier-specific minimum age
	evaluateRuleOfN(&result, age, svcCredit)

	if result.RuleOfNQualifies {
		result.ReductionFactor = 1.0
		if member.Tier == 3 {
			result.RetirementType = "rule_of_85"
		} else {
			result.RetirementType = "rule_of_75"
		}
		return result
	}

	// Early retirement: tier-specific minimum age, vested
	minAge := rules.MinEarlyRetirementAge(member.Tier)
	if age >= minAge {
		result.EarlyRetirementEligible = true
		result.YearsUnder65 = rules.NormalRetirementAge - age

		// Look up reduction factor from statutory table
		factor := rules.ReductionFactor(member.Tier, age)
		result.ReductionFactor = factor
		result.EarlyRetirementReductionPct = math.Round((1.0 - factor) * 100)

		result.RetirementType = "early"
		return result
	}

	// Deferred: vested but doesn't meet any retirement type
	result.RetirementType = "deferred"
	result.ReductionFactor = 0
	return result
}

// evaluateRuleOfN checks Rule of 75 (Tiers 1&2) or Rule of 85 (Tier 3).
// Uses EARNED service only — purchased service is excluded.
func evaluateRuleOfN(result *models.EligibilityResult, age int, svcCredit models.ServiceCreditSummary) {
	threshold := rules.RuleOfNThreshold(result.Tier)
	minAge := rules.RuleOfNMinAge(result.Tier)

	if result.Tier == 3 {
		result.RuleOfNApplicable = "85"
	} else {
		result.RuleOfNApplicable = "75"
	}

	// Sum uses EARNED service only (TotalForElig excludes purchased)
	result.RuleOfNSum = result.AgeAtRetirement + svcCredit.TotalForElig
	result.RuleOfNMinAgeMet = age >= minAge
	result.RuleOfNQualifies = result.RuleOfNSum >= float64(threshold) && result.RuleOfNMinAgeMet
}

// ageAtDate calculates age in completed years at a given date.
// ASSUMPTION: [Q-CALC-03] Using integer age (completed years), not monthly proration.
func ageAtDate(dob, asOf time.Time) float64 {
	years := asOf.Year() - dob.Year()
	// Adjust if birthday hasn't occurred yet in the target year
	if asOf.Month() < dob.Month() || (asOf.Month() == dob.Month() && asOf.Day() < dob.Day()) {
		years--
	}
	return float64(years)
}
