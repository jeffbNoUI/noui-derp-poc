// Package rules provides statutory lookup tables and rule configuration for DERP.
//
// Per CLAUDE_CODE_PROTOCOL.md: Use statutory tables directly from RMC,
// not formulas that happen to produce the same values. Tables are the
// governing document; formulas are our interpretation.
package rules

// Early retirement reduction factors by age — statutory tables from RMC §18-409(b).
// These are NOT formulas. They are the exact values from the Revised Municipal Code.

// EarlyRetReductionT12 contains reduction factors for Tiers 1 & 2.
// 3% per year under 65. Source: RMC §18-409(b)
var EarlyRetReductionT12 = map[int]float64{
	55: 0.70, 56: 0.73, 57: 0.76, 58: 0.79, 59: 0.82,
	60: 0.85, 61: 0.88, 62: 0.91, 63: 0.94, 64: 0.97,
	65: 1.00,
}

// EarlyRetReductionT3 contains reduction factors for Tier 3.
// 6% per year under 65. Source: RMC §18-409(b)
var EarlyRetReductionT3 = map[int]float64{
	60: 0.70, 61: 0.76, 62: 0.82, 63: 0.88, 64: 0.94,
	65: 1.00,
}

// DeathBenefitT12 contains lump-sum death benefit amounts for Tiers 1 & 2.
// $5,000 base, reduced by $250 per year under 65. Source: RMC §18-411(d)
var DeathBenefitT12 = map[int]float64{
	55: 2500, 56: 2750, 57: 3000, 58: 3250, 59: 3500,
	60: 3750, 61: 4000, 62: 4250, 63: 4500, 64: 4750,
	65: 5000,
}

// DeathBenefitT3 contains lump-sum death benefit amounts for Tier 3.
// $5,000 base, reduced by $500 per year under 65. Source: RMC §18-411(d)
var DeathBenefitT3 = map[int]float64{
	60: 2500, 61: 3000, 62: 3500, 63: 4000, 64: 4500,
	65: 5000,
}

// J&S factors — ASSUMPTION: [Q-CALC-04] Placeholder factors pending actuarial tables.
// These are illustrative only. Real factors depend on member/beneficiary ages and mortality tables.
const (
	JSFactor100 = 0.8850
	JSFactor75  = 0.9150
	JSFactor50  = 0.9450
)

// Tier-specific benefit multipliers. Source: RMC §18-409(a)
const (
	MultiplierTier1 = 0.02  // 2.0%
	MultiplierTier2 = 0.015 // 1.5%
	MultiplierTier3 = 0.015 // 1.5%
)

// IPR rates. Source: RMC §18-412
const (
	IPRPreMedicareRate  = 12.50 // per year of earned service
	IPRPostMedicareRate = 6.25  // per year of earned service, age 65+
)

// Vesting requirement. Source: RMC §18-401
const VestingYears = 5.0

// Normal retirement age. Source: RMC §18-409(a)
const NormalRetirementAge = 65

// Multiplier returns the benefit multiplier for the given tier.
func Multiplier(tier int) float64 {
	if tier == 1 {
		return MultiplierTier1
	}
	return MultiplierTier2 // Tiers 2 and 3 both use 1.5%
}

// ReductionFactor returns the early retirement reduction factor for the given tier and age.
// Returns 1.0 if no reduction applies (age >= 65 or normal/rule-of-N retirement).
// Returns -1.0 if the age is below minimum early retirement age for the tier.
func ReductionFactor(tier, age int) float64 {
	if age >= NormalRetirementAge {
		return 1.0
	}

	var table map[int]float64
	if tier == 3 {
		table = EarlyRetReductionT3
	} else {
		table = EarlyRetReductionT12
	}

	factor, ok := table[age]
	if !ok {
		return -1.0 // Below minimum early retirement age
	}
	return factor
}

// DeathBenefitAmount returns the death benefit lump sum for the given tier, age, and retirement type.
// Normal/Rule-of-N retirement always gets $5,000.
func DeathBenefitAmount(tier, age int, isNormalOrRuleOfN bool) float64 {
	if isNormalOrRuleOfN || age >= NormalRetirementAge {
		return 5000.00
	}

	var table map[int]float64
	if tier == 3 {
		table = DeathBenefitT3
	} else {
		table = DeathBenefitT12
	}

	amount, ok := table[age]
	if !ok {
		return 0.0 // Below minimum early retirement age
	}
	return amount
}

// MinEarlyRetirementAge returns the minimum age for early retirement.
// Source: RMC §18-409(b)
func MinEarlyRetirementAge(tier int) int {
	if tier == 3 {
		return 60
	}
	return 55
}

// RuleOfNThreshold returns the Rule of N threshold for the tier.
// Tiers 1 & 2: 75. Tier 3: 85. Source: RMC §18-409(a)
func RuleOfNThreshold(tier int) int {
	if tier == 3 {
		return 85
	}
	return 75
}

// RuleOfNMinAge returns the minimum age for Rule of N qualification.
// Tiers 1 & 2: 55. Tier 3: 60. Source: RMC §18-409(a)
func RuleOfNMinAge(tier int) int {
	if tier == 3 {
		return 60
	}
	return 55
}
