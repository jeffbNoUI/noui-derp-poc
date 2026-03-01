// Package rules provides statutory lookup tables and rule configuration for Colorado PERA.
//
// Per CLAUDE_CODE_PROTOCOL.md: Use statutory tables directly from C.R.S. Title 24 Article 51,
// not formulas that happen to produce the same values. Tables are the governing document;
// formulas are our interpretation.
//
// COPERA has 16 HAS (Highest Average Salary) tables, determined by membership date
// and vesting status as of 1/1/2020. The HAS table number drives all eligibility
// parameters: normal retirement age, Rule of N threshold, early retirement reduction,
// HAS window length, and annual increase rate.
package rules

// HAS Table numbering convention:
//   PERA 1-3:  Pre-2011 eligible (membership before 2007/2011)
//   PERA 4-6:  Post-2011, vested before 1/1/2020
//   PERA 7-9:  Post-2020 (not vested as of 1/1/2020 or membership after 2020)
//   DPS 1:     DPS pre-2005
//   DPS 2-3:   DPS post-2005, vested before 2020
//   DPS 4:     DPS post-2020
//
// For the demo, we use HAS table numbers 1-9 (PERA) and 10-13 (DPS).
// DPS 1 = table 10, DPS 2 = table 11, DPS 3 = table 12, DPS 4 = table 13.

// HAS table parameter constants — maps from HAS table number to rule parameters.
// Source: C.R.S. §24-51-602, §24-51-604, §24-51-605

// normalRetAge maps HAS table → normal retirement age.
var normalRetAge = map[int]int{
	1: 60, 2: 65, 3: 65,
	4: 65, 5: 65, 6: 65,
	7: 65, 8: 65, 9: 65,
	10: 60, 11: 65, 12: 65, 13: 65,
}

// ruleOfNThreshold maps HAS table → Rule of N threshold.
var ruleOfNThreshold = map[int]int{
	1: 80, 2: 80, 3: 80,
	4: 85, 5: 85, 6: 85,
	7: 90, 8: 90, 9: 90,
	10: 80, 11: 85, 12: 85, 13: 90,
}

// ruleOfNMinAge maps HAS table → minimum age for Rule of N qualification.
var ruleOfNMinAge = map[int]int{
	1: 55, 2: 55, 3: 55,
	4: 55, 5: 55, 6: 55,
	7: 60, 8: 60, 9: 60,
	10: 55, 11: 55, 12: 55, 13: 60,
}

// minEarlyRetAge maps HAS table → minimum early retirement age.
var minEarlyRetAge = map[int]int{
	1: 55, 2: 55, 3: 55,
	4: 55, 5: 55, 6: 55,
	7: 60, 8: 60, 9: 60,
	10: 55, 11: 55, 12: 55, 13: 60,
}

// earlyRetReductionRate maps HAS table → reduction rate per year under 65.
// Pre-2011 tables: flat percentage per year.
// Post-2011 tables: may use actuarial factors, approximated as flat rate for demo.
// Source: C.R.S. §24-51-605
var earlyRetReductionRate = map[int]float64{
	1: 0.03, 2: 0.03, 3: 0.03,
	4: 0.04, 5: 0.04, 6: 0.04,
	7: 0.06, 8: 0.06, 9: 0.06,
	10: 0.03, 11: 0.04, 12: 0.04, 13: 0.06,
}

// hasWindowMonths maps HAS table → number of months in the HAS calculation window.
// Vested before 2020: 36 months (3 years). Not vested / post-2020: 60 months (5 years).
// Source: C.R.S. §24-51-101(25.5)
var hasWindowMonths = map[int]int{
	1: 36, 2: 36, 3: 36,
	4: 36, 5: 36, 6: 36,
	7: 60, 8: 60, 9: 60,
	10: 36, 11: 36, 12: 36, 13: 60,
}

// annualIncreaseRate maps HAS table → compound annual increase rate.
// Pre-2011 eligible: 1.5%. Post-2011: 1.0%.
// Source: C.R.S. §24-51-1002 (as amended by SB 18-200)
var annualIncreaseRate = map[int]float64{
	1: 0.015, 2: 0.015, 3: 0.015,
	4: 0.010, 5: 0.010, 6: 0.010,
	7: 0.010, 8: 0.010, 9: 0.010,
	10: 0.015, 11: 0.010, 12: 0.010, 13: 0.010,
}

// hasTableName maps HAS table number → display name.
var hasTableName = map[int]string{
	1: "PERA 1", 2: "PERA 2", 3: "PERA 3",
	4: "PERA 4", 5: "PERA 5", 6: "PERA 6",
	7: "PERA 7", 8: "PERA 8", 9: "PERA 9",
	10: "DPS 1", 11: "DPS 2", 12: "DPS 3", 13: "DPS 4",
}

// Division contribution rates. Source: C.R.S. §24-51-401, §24-51-408
type ContributionRates struct {
	EmployeeRate float64
	EmployerRate float64
}

var divisionContribRates = map[string]ContributionRates{
	"State":     {EmployeeRate: 0.1050, EmployerRate: 0.2140},
	"School":    {EmployeeRate: 0.1050, EmployerRate: 0.2140},
	"LocalGov":  {EmployeeRate: 0.1050, EmployerRate: 0.2140},
	"Judicial":  {EmployeeRate: 0.1050, EmployerRate: 0.2140},
	"DPS":       {EmployeeRate: 0.1200, EmployerRate: 0.1950},
}

// IsDPSDivision returns true if the division uses DPS-specific benefit options (A/B/P2/P3).
func IsDPSDivision(division string) bool {
	return division == "DPS"
}

// Universal multiplier. Source: C.R.S. §24-51-603
const BenefitMultiplier = 0.025 // 2.5% for all COPERA divisions

// VestingYears is the vesting requirement for all divisions. Source: C.R.S. §24-51-401(1.7)
const VestingYears = 5.0

// AntiSpikingCap is the maximum year-over-year salary increase allowed in the HAS window.
// Source: C.R.S. §24-51-101(25.5) — base year method, 108% cascading cap.
const AntiSpikingCap = 1.08

// J&S factors — ASSUMPTION: [Q-CALC-04] Placeholder factors pending actuarial tables.
const (
	JSFactor100 = 0.8850
	JSFactor75  = 0.9150
	JSFactor50  = 0.9450
)

// --- Lookup functions ---

// Multiplier returns the benefit multiplier. 2.5% for all COPERA divisions.
func Multiplier(hasTable int) float64 {
	return BenefitMultiplier
}

// NormalRetirementAge returns the normal retirement age for the given HAS table.
func NormalRetirementAge(hasTable int) int {
	if age, ok := normalRetAge[hasTable]; ok {
		return age
	}
	return 65 // Default
}

// RuleOfNThreshold returns the Rule of N threshold for the HAS table.
func RuleOfNThreshold(hasTable int) int {
	if threshold, ok := ruleOfNThreshold[hasTable]; ok {
		return threshold
	}
	return 85 // Conservative default
}

// RuleOfNMinAge returns the minimum age for Rule of N qualification.
func RuleOfNMinAge(hasTable int) int {
	if age, ok := ruleOfNMinAge[hasTable]; ok {
		return age
	}
	return 55
}

// MinEarlyRetirementAge returns the minimum age for early retirement.
func MinEarlyRetirementAge(hasTable int) int {
	if age, ok := minEarlyRetAge[hasTable]; ok {
		return age
	}
	return 55
}

// ReductionFactor returns the early retirement reduction factor for the given HAS table and age.
// Uses flat rate per year under the normal retirement age (65 for most tables).
// Returns 1.0 if no reduction applies, -1.0 if below minimum early retirement age.
func ReductionFactor(hasTable, age int) float64 {
	nra := NormalRetirementAge(hasTable)
	if age >= nra && nra >= 65 {
		return 1.0
	}
	if age >= 65 {
		return 1.0
	}

	minAge := MinEarlyRetirementAge(hasTable)
	if age < minAge {
		return -1.0
	}

	rate, ok := earlyRetReductionRate[hasTable]
	if !ok {
		return -1.0
	}

	yearsUnder65 := 65 - age
	reduction := float64(yearsUnder65) * rate
	return 1.0 - reduction
}

// HASWindowMonths returns the HAS calculation window length in months.
func HASWindowMonths(hasTable int) int {
	if months, ok := hasWindowMonths[hasTable]; ok {
		return months
	}
	return 36 // Default 3-year window
}

// AnnualIncreaseRate returns the compound annual increase rate for the HAS table.
func AnnualIncreaseRate(hasTable int) float64 {
	if rate, ok := annualIncreaseRate[hasTable]; ok {
		return rate
	}
	return 0.010 // Conservative default
}

// HASTableName returns the display name for a HAS table number.
func HASTableName(hasTable int) string {
	if name, ok := hasTableName[hasTable]; ok {
		return name
	}
	return "Unknown"
}

// DivisionContribRates returns the contribution rates for a division.
func DivisionContribRates(division string) ContributionRates {
	if rates, ok := divisionContribRates[division]; ok {
		return rates
	}
	return ContributionRates{EmployeeRate: 0.1050, EmployerRate: 0.2140}
}

// RuleOfNLabel returns the display label (e.g., "Rule of 80") for a HAS table.
func RuleOfNLabel(hasTable int) string {
	threshold := RuleOfNThreshold(hasTable)
	return "Rule of " + itoa(threshold)
}

// itoa is a simple int-to-string without importing strconv.
func itoa(i int) string {
	if i == 0 {
		return "0"
	}
	s := ""
	neg := false
	if i < 0 {
		neg = true
		i = -i
	}
	for i > 0 {
		s = string(rune('0'+i%10)) + s
		i /= 10
	}
	if neg {
		s = "-" + s
	}
	return s
}
