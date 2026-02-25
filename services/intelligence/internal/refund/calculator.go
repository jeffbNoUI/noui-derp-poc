// Package refund implements the DERP contribution refund calculation engine.
//
// The refund process:
//   1. Check eligibility: terminated + 90-day wait elapsed + no pending retirement
//   2. Accumulate contributions: 8.45% of monthly pensionable salary
//   3. Calculate interest: 2% annual compounding on June 30
//   4. Apply tax withholding: 20% federal on direct payment, 0% on rollover
//   5. For vested members: determine forfeiture and compare with deferred pension
//
// All calculations are deterministic — AI does not execute business rules.
// Every computation logs inputs, formula, and output for audit trail.
//
// Consumed by: intelligence/internal/api/refund_handlers.go
// Depends on: intelligence/internal/rules/tables.go (for VestingYears, Multiplier)
package refund

import (
	"fmt"
	"math"
	"time"
)

// ── Constants ──────────────────────────────────────────────────────────────

const (
	// EmployeeContribRate is the employee contribution rate. Source: RMC §18-403
	EmployeeContribRate = 0.0845

	// InterestRate is the board-set interest rate on contributions. Source: RMC §18-403(c)
	InterestRate = 0.02

	// WaitingPeriodDays is the mandatory waiting period after termination. Source: RMC §18-403(a)
	WaitingPeriodDays = 90

	// FederalWithholdingRate for direct payment distributions. Source: IRC §3405(c)
	FederalWithholdingRate = 0.20

	// VestingYears is the service requirement for vesting. Source: RMC §18-401
	VestingYears = 5.0
)

// ── Input/Output Types ─────────────────────────────────────────────────────

// MonthlySalary represents one month of pensionable salary for contribution calculation.
type MonthlySalary struct {
	Year           int     `json:"year"`
	Month          int     `json:"month"`
	PensionablePay float64 `json:"pensionable_pay"`
}

// EligibilityInput contains data needed for refund eligibility check.
type EligibilityInput struct {
	StatusCode      string
	TerminationDate time.Time
	ApplicationDate time.Time
	ServiceYears    float64
	HasRetirementApp bool
}

// EligibilityResult contains the refund eligibility determination.
type EligibilityResult struct {
	Eligible          bool    `json:"eligible"`
	Reason            string  `json:"reason"`
	Vested            bool    `json:"vested"`
	ServiceYears      float64 `json:"service_years"`
	ForfeitureRequired bool   `json:"forfeiture_required"`
	WaitingPeriodMet  bool    `json:"waiting_period_met"`
	DaysSinceTermination int  `json:"days_since_termination"`
	EarliestApplicationDate string `json:"earliest_application_date"`
	AuditTrail        []AuditEntry `json:"audit_trail"`
}

// ContributionResult contains the contribution accumulation calculation.
type ContributionResult struct {
	TotalContributions float64            `json:"total_contributions"`
	MonthCount         int                `json:"month_count"`
	MonthlyDetail      []ContributionDetail `json:"monthly_detail"`
	Formula            string             `json:"formula"`
}

// ContributionDetail is one month's contribution detail for audit trail.
type ContributionDetail struct {
	Year           int     `json:"year"`
	Month          int     `json:"month"`
	PensionablePay float64 `json:"pensionable_pay"`
	Contribution   float64 `json:"contribution"`
	RunningTotal   float64 `json:"running_total"`
}

// InterestResult contains the interest compounding calculation.
type InterestResult struct {
	TotalInterest  float64          `json:"total_interest"`
	InterestRate   float64          `json:"interest_rate"`
	Credits        []InterestCredit `json:"credits"`
	Formula        string           `json:"formula"`
}

// InterestCredit is one annual compounding event.
type InterestCredit struct {
	Date          string  `json:"date"`
	BalanceBefore float64 `json:"balance_before"`
	InterestAmt   float64 `json:"interest_amount"`
	BalanceAfter  float64 `json:"balance_after"`
}

// TaxResult contains the tax withholding calculation.
type TaxResult struct {
	GrossRefund    float64 `json:"gross_refund"`
	ElectionType   string  `json:"election_type"`
	WithholdingRate float64 `json:"withholding_rate"`
	WithholdingAmt float64 `json:"withholding_amount"`
	RolloverAmt    float64 `json:"rollover_amount,omitempty"`
	NetPayment     float64 `json:"net_payment"`
	Formula        string  `json:"formula"`
}

// DeferredComparison contains the refund vs deferred pension comparison.
type DeferredComparison struct {
	RefundGross         float64 `json:"refund_gross"`
	DeferredMonthly     float64 `json:"deferred_monthly_at_65"`
	DeferredAnnual      float64 `json:"deferred_annual_at_65"`
	YearsToAge65        int     `json:"years_to_age_65"`
	BreakevenYears      float64 `json:"breakeven_years_after_65"`
	LifetimeValueAt85   float64 `json:"lifetime_value_at_85"`
	Formula             string  `json:"formula"`
}

// RefundSummary is the complete refund calculation package.
type RefundSummary struct {
	MemberID       string              `json:"member_id"`
	Eligibility    EligibilityResult   `json:"eligibility"`
	Contributions  ContributionResult  `json:"contributions"`
	Interest       InterestResult      `json:"interest"`
	GrossRefund    float64             `json:"gross_refund"`
	TaxOptions     []TaxResult         `json:"tax_options"`
	DeferredCompare *DeferredComparison `json:"deferred_comparison,omitempty"`
	AuditTrail     []AuditEntry        `json:"audit_trail"`
}

// AuditEntry records a single rule evaluation for the audit trail.
type AuditEntry struct {
	RuleID          string `json:"rule_id"`
	RuleName        string `json:"rule_name"`
	Description     string `json:"description"`
	Result          string `json:"result"`
	SourceReference string `json:"source_reference"`
}

// ── Calculation Functions ──────────────────────────────────────────────────

// CheckEligibility determines whether a member is eligible for a contribution refund.
// Source: RMC §18-403
func CheckEligibility(input EligibilityInput) EligibilityResult {
	result := EligibilityResult{
		ServiceYears: input.ServiceYears,
		Vested:       input.ServiceYears >= VestingYears,
	}

	// Check termination status
	if input.StatusCode != "T" && input.StatusCode != "D" {
		result.Eligible = false
		result.Reason = "Member must be terminated or deferred to request a refund"
		result.AuditTrail = append(result.AuditTrail, AuditEntry{
			RuleID: "RULE-REFUND-ELIG", RuleName: "Refund Eligibility",
			Description: "Check termination status",
			Result:      fmt.Sprintf("FAIL: status=%s, need T or D", input.StatusCode),
			SourceReference: "RMC §18-403",
		})
		return result
	}

	// Check 90-day waiting period
	daysSince := int(input.ApplicationDate.Sub(input.TerminationDate).Hours() / 24)
	result.DaysSinceTermination = daysSince
	earliestDate := input.TerminationDate.AddDate(0, 0, WaitingPeriodDays)
	result.EarliestApplicationDate = earliestDate.Format("2006-01-02")
	result.WaitingPeriodMet = daysSince >= WaitingPeriodDays

	if !result.WaitingPeriodMet {
		result.Eligible = false
		result.Reason = fmt.Sprintf("90-day waiting period not met: %d days elapsed, need %d",
			daysSince, WaitingPeriodDays)
		result.AuditTrail = append(result.AuditTrail, AuditEntry{
			RuleID: "RULE-REFUND-WAIT", RuleName: "90-Day Waiting Period",
			Description: "Check calendar days since termination",
			Result:      fmt.Sprintf("FAIL: %d days < %d required", daysSince, WaitingPeriodDays),
			SourceReference: "RMC §18-403(a)",
		})
		return result
	}

	result.AuditTrail = append(result.AuditTrail, AuditEntry{
		RuleID: "RULE-REFUND-WAIT", RuleName: "90-Day Waiting Period",
		Description: "Check calendar days since termination",
		Result:      fmt.Sprintf("PASS: %d days >= %d required", daysSince, WaitingPeriodDays),
		SourceReference: "RMC §18-403(a)",
	})

	// Check pending retirement application
	if input.HasRetirementApp {
		result.Eligible = false
		result.Reason = "Cannot process refund while retirement application is pending"
		result.AuditTrail = append(result.AuditTrail, AuditEntry{
			RuleID: "RULE-REFUND-ELIG", RuleName: "Pending Application Check",
			Description: "Check for conflicting retirement application",
			Result:      "FAIL: pending retirement application exists",
			SourceReference: "RMC §18-403",
		})
		return result
	}

	// Forfeiture determination for vested members
	result.ForfeitureRequired = result.Vested
	if result.Vested {
		result.AuditTrail = append(result.AuditTrail, AuditEntry{
			RuleID: "RULE-REFUND-VESTED", RuleName: "Vested Refund Forfeiture",
			Description: fmt.Sprintf("Service %.2f years >= %.1f vesting requirement", input.ServiceYears, VestingYears),
			Result:      "FORFEITURE REQUIRED — pension rights permanently forfeited upon refund",
			SourceReference: "RMC §18-404",
		})
	} else {
		result.AuditTrail = append(result.AuditTrail, AuditEntry{
			RuleID: "RULE-REFUND-VESTED", RuleName: "Vested Refund Forfeiture",
			Description: fmt.Sprintf("Service %.2f years < %.1f vesting requirement", input.ServiceYears, VestingYears),
			Result:      "NOT APPLICABLE — non-vested, no pension rights to forfeit",
			SourceReference: "RMC §18-404",
		})
	}

	result.Eligible = true
	result.Reason = "Eligible for contribution refund"
	return result
}

// CalculateWaitingPeriod returns the earliest application date (termination + 90 days).
// Source: RMC §18-403(a)
func CalculateWaitingPeriod(terminationDate time.Time) time.Time {
	return terminationDate.AddDate(0, 0, WaitingPeriodDays)
}

// AccumulateContributions sums employee contributions from monthly salary history.
// Source: RMC §18-403(b)
// Rate: 8.45% of pensionable salary per month.
// Full precision carried — no intermediate rounding.
func AccumulateContributions(salaries []MonthlySalary) ContributionResult {
	result := ContributionResult{
		MonthCount: len(salaries),
		Formula:    fmt.Sprintf("SUM(monthly_pensionable_salary × %.4f)", EmployeeContribRate),
	}

	var runningTotal float64
	for _, s := range salaries {
		contrib := s.PensionablePay * EmployeeContribRate
		runningTotal += contrib
		result.MonthlyDetail = append(result.MonthlyDetail, ContributionDetail{
			Year:           s.Year,
			Month:          s.Month,
			PensionablePay: s.PensionablePay,
			Contribution:   contrib,
			RunningTotal:   runningTotal,
		})
	}

	// Round only the final total to cents
	result.TotalContributions = bankersRound(runningTotal, 2)
	return result
}

// CalculateInterest computes annual June 30 interest compounding on employee contributions.
// Source: RMC §18-403(c)
// Rate: 2% per annum, compounded annually on June 30.
//
// Parameters:
//   - salaries: monthly salary records in chronological order
//   - hireDate: member's hire date (contributions start)
//   - terminationDate: member's termination date (contributions end)
func CalculateInterest(salaries []MonthlySalary, hireDate, terminationDate time.Time) InterestResult {
	result := InterestResult{
		InterestRate: InterestRate,
		Formula:      fmt.Sprintf("balance_at_june_30 × %.4f, compounded annually on June 30", InterestRate),
	}

	if len(salaries) == 0 {
		return result
	}

	// Build a map of year-month -> contribution amount for fast lookup
	contribByMonth := make(map[string]float64)
	for _, s := range salaries {
		key := fmt.Sprintf("%d-%02d", s.Year, s.Month)
		contribByMonth[key] = s.PensionablePay * EmployeeContribRate
	}

	// Determine June 30 compounding dates between hire and termination
	startYear := hireDate.Year()
	endYear := terminationDate.Year()

	var runningBalance float64
	var totalInterest float64

	for year := startYear; year <= endYear; year++ {
		june30 := time.Date(year, 6, 30, 0, 0, 0, 0, time.UTC)

		// Skip if June 30 is before hire date or after termination
		if june30.Before(hireDate) || june30.After(terminationDate) {
			continue
		}

		// Add contributions from the period since last compounding (or hire) up to this June 30
		var periodStart time.Time
		if year == startYear || (year == startYear+1 && hireDate.After(time.Date(startYear, 6, 30, 0, 0, 0, 0, time.UTC))) {
			periodStart = hireDate
		} else {
			periodStart = time.Date(year-1, 7, 1, 0, 0, 0, 0, time.UTC)
		}

		// Sum contributions from periodStart through June of this year
		for m := periodStart; !m.After(june30); m = m.AddDate(0, 1, 0) {
			key := fmt.Sprintf("%d-%02d", m.Year(), int(m.Month()))
			if c, ok := contribByMonth[key]; ok {
				runningBalance += c
			}
		}

		// Compound interest on the running balance
		interest := bankersRound(runningBalance*InterestRate, 2)
		totalInterest += interest

		result.Credits = append(result.Credits, InterestCredit{
			Date:          june30.Format("2006-01-02"),
			BalanceBefore: bankersRound(runningBalance, 2),
			InterestAmt:   interest,
			BalanceAfter:  bankersRound(runningBalance+interest, 2),
		})

		// Add interest to running balance for next compounding period
		runningBalance += interest
	}

	result.TotalInterest = bankersRound(totalInterest, 2)
	return result
}

// CalculateTaxWithholding computes tax withholding for the chosen distribution election.
// Source: IRC §3405(c), RMC §18-403(d)
func CalculateTaxWithholding(grossRefund float64, electionType string, rolloverAmt float64) TaxResult {
	result := TaxResult{
		GrossRefund:  grossRefund,
		ElectionType: electionType,
	}

	switch electionType {
	case "direct_payment":
		result.WithholdingRate = FederalWithholdingRate
		result.WithholdingAmt = bankersRound(grossRefund*FederalWithholdingRate, 2)
		result.NetPayment = bankersRound(grossRefund-result.WithholdingAmt, 2)
		result.Formula = fmt.Sprintf("%.2f × %.0f%% = %.2f withholding",
			grossRefund, FederalWithholdingRate*100, result.WithholdingAmt)

	case "direct_rollover":
		result.WithholdingRate = 0
		result.WithholdingAmt = 0
		result.RolloverAmt = grossRefund
		result.NetPayment = grossRefund
		result.Formula = "Full rollover — no withholding"

	case "partial_rollover":
		result.RolloverAmt = rolloverAmt
		directPortion := grossRefund - rolloverAmt
		result.WithholdingRate = FederalWithholdingRate
		result.WithholdingAmt = bankersRound(directPortion*FederalWithholdingRate, 2)
		result.NetPayment = bankersRound(directPortion-result.WithholdingAmt+rolloverAmt, 2)
		result.Formula = fmt.Sprintf("Direct: %.2f × %.0f%% = %.2f withholding; Rollover: %.2f (no withholding)",
			directPortion, FederalWithholdingRate*100, result.WithholdingAmt, rolloverAmt)

	default:
		// Default to direct payment
		result.ElectionType = "direct_payment"
		result.WithholdingRate = FederalWithholdingRate
		result.WithholdingAmt = bankersRound(grossRefund*FederalWithholdingRate, 2)
		result.NetPayment = bankersRound(grossRefund-result.WithholdingAmt, 2)
		result.Formula = fmt.Sprintf("%.2f × %.0f%% = %.2f withholding (defaulted to direct payment)",
			grossRefund, FederalWithholdingRate*100, result.WithholdingAmt)
	}

	return result
}

// CalculateDeferredComparison computes the refund vs deferred pension trade-off.
// For vested members only — shows what they give up by taking the refund.
// Source: RMC §18-404, §18-409(a)
func CalculateDeferredComparison(tier int, ams, serviceYears, grossRefund float64, currentAge int) DeferredComparison {
	// Multiplier: 2.0% for Tier 1, 1.5% for Tiers 2 & 3
	multiplier := 0.015
	if tier == 1 {
		multiplier = 0.02
	}

	deferredMonthly := bankersRound(ams*multiplier*serviceYears, 2)
	deferredAnnual := bankersRound(deferredMonthly*12, 2)
	yearsTo65 := 65 - currentAge
	if yearsTo65 < 0 {
		yearsTo65 = 0
	}

	// Breakeven: refund / annual pension = years to recoup
	breakeven := 0.0
	if deferredAnnual > 0 {
		breakeven = grossRefund / deferredAnnual
	}

	// Lifetime value assuming 20 years of retirement (age 65-85)
	lifetimeValue := deferredAnnual * 20

	return DeferredComparison{
		RefundGross:       grossRefund,
		DeferredMonthly:   deferredMonthly,
		DeferredAnnual:    deferredAnnual,
		YearsToAge65:      yearsTo65,
		BreakevenYears:    math.Round(breakeven*10) / 10,
		LifetimeValueAt85: lifetimeValue,
		Formula: fmt.Sprintf("AMS %.2f × %.3f × %.2f years = %.2f/month at age 65",
			ams, multiplier, serviceYears, deferredMonthly),
	}
}

// CalculateRefundSummary performs the complete refund calculation with full audit trail.
// This is the main entry point combining all refund sub-calculations.
func CalculateRefundSummary(
	memberID string,
	eligInput EligibilityInput,
	salaries []MonthlySalary,
	hireDate, terminationDate time.Time,
	tier int,
	ams float64,
	currentAge int,
) RefundSummary {
	summary := RefundSummary{
		MemberID: memberID,
	}

	// 1. Eligibility
	summary.Eligibility = CheckEligibility(eligInput)

	// 2. Contributions (calculate regardless of eligibility — for display)
	summary.Contributions = AccumulateContributions(salaries)

	// 3. Interest
	summary.Interest = CalculateInterest(salaries, hireDate, terminationDate)

	// 4. Gross refund
	summary.GrossRefund = bankersRound(
		summary.Contributions.TotalContributions+summary.Interest.TotalInterest, 2)

	// 5. Tax options — all three elections
	summary.TaxOptions = []TaxResult{
		CalculateTaxWithholding(summary.GrossRefund, "direct_payment", 0),
		CalculateTaxWithholding(summary.GrossRefund, "direct_rollover", 0),
		CalculateTaxWithholding(summary.GrossRefund, "partial_rollover", summary.GrossRefund/2),
	}

	// 6. Deferred comparison (vested members only)
	if summary.Eligibility.Vested {
		dc := CalculateDeferredComparison(tier, ams, eligInput.ServiceYears, summary.GrossRefund, currentAge)
		summary.DeferredCompare = &dc
	}

	// Build top-level audit trail
	summary.AuditTrail = append(summary.AuditTrail, summary.Eligibility.AuditTrail...)
	summary.AuditTrail = append(summary.AuditTrail, AuditEntry{
		RuleID: "RULE-REFUND-CONTRIB", RuleName: "Contribution Accumulation",
		Description: fmt.Sprintf("%d months of contributions at %.2f%%", summary.Contributions.MonthCount, EmployeeContribRate*100),
		Result:      fmt.Sprintf("$%.2f total employee contributions", summary.Contributions.TotalContributions),
		SourceReference: "RMC §18-403(b)",
	})
	summary.AuditTrail = append(summary.AuditTrail, AuditEntry{
		RuleID: "RULE-REFUND-INTEREST", RuleName: "Interest on Contributions",
		Description: fmt.Sprintf("%.1f%% annual, compounded June 30, %d compounding periods", InterestRate*100, len(summary.Interest.Credits)),
		Result:      fmt.Sprintf("$%.2f total accrued interest", summary.Interest.TotalInterest),
		SourceReference: "RMC §18-403(c)",
	})
	summary.AuditTrail = append(summary.AuditTrail, AuditEntry{
		RuleID: "RULE-REFUND-GROSS", RuleName: "Gross Refund",
		Description: fmt.Sprintf("$%.2f contributions + $%.2f interest", summary.Contributions.TotalContributions, summary.Interest.TotalInterest),
		Result:      fmt.Sprintf("$%.2f gross refund", summary.GrossRefund),
		SourceReference: "RMC §18-403",
	})

	return summary
}

// bankersRound implements banker's rounding (round half to even).
// Consistent with the benefit calculator's rounding method.
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
