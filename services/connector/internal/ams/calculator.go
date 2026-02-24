// Package ams implements the Average Monthly Salary calculation for DERP.
//
// The AMS is the core input to the benefit formula. It is computed as:
//   AMS = max over all consecutive N-month windows of (sum of monthly pensionable pay / N)
//
// Where N = 36 months for Tiers 1 and 2, or 60 months for Tier 3.
//
// The database stores biweekly pay records. This calculator aggregates
// biweekly records into calendar months before applying the sliding window.
//
// Leave payout: For members hired before Jan 1, 2010 with sick/vacation leave,
// the payout amount is added to the final month's salary within the AMS window.
package ams

import (
	"fmt"
	"math"
	"sort"
	"time"

	"github.com/noui-derp-poc/connector/internal/models"
)

// WindowSize returns the AMS window size in months based on tier.
// Tiers 1 & 2: 36 months. Tier 3: 60 months.
// Source: RMC §18-391(3)
func WindowSize(tier int) int {
	if tier == 3 {
		return 60
	}
	return 36
}

// monthKey is a year-month pair for grouping biweekly records.
type monthKey struct {
	Year  int
	Month int
}

func (k monthKey) String() string {
	return fmt.Sprintf("%d-%02d", k.Year, k.Month)
}

// before returns true if k is before other chronologically.
func (k monthKey) before(other monthKey) bool {
	if k.Year != other.Year {
		return k.Year < other.Year
	}
	return k.Month < other.Month
}

// next returns the month after k.
func (k monthKey) next() monthKey {
	if k.Month == 12 {
		return monthKey{k.Year + 1, 1}
	}
	return monthKey{k.Year, k.Month + 1}
}

// monthsBetween returns the number of months from start to end inclusive.
func monthsBetween(start, end monthKey) int {
	return (end.Year-start.Year)*12 + (end.Month - start.Month) + 1
}

// AggregateBiweeklyToMonthly groups biweekly salary records into calendar months.
// Each month's pensionable pay is derived from annualized salary / 12, NOT from
// summing biweekly amounts. This avoids 3-pay-period months inflating totals.
// Leave payout amounts are tracked separately (added directly, not annualized).
func AggregateBiweeklyToMonthly(records []models.SalaryRecord) []models.MonthlySalary {
	// Phase 1: collect records per month, track the latest annual salary
	type monthAccum struct {
		ms              *models.MonthlySalary
		latestAnnual    float64  // most recent annl_salary for this month
		hasAnnual       bool
		biweeklySum     float64  // fallback: sum of biweekly pens_pay
	}
	monthly := make(map[monthKey]*monthAccum)

	for _, r := range records {
		k := monthKey{r.PayPeriodEnd.Year(), int(r.PayPeriodEnd.Month())}
		acc, ok := monthly[k]
		if !ok {
			acc = &monthAccum{ms: &models.MonthlySalary{Year: k.Year, Month: k.Month}}
			monthly[k] = acc
		}
		// Use annualized salary when available; take the latest record's value
		if r.AnnualSalary != nil && *r.AnnualSalary > 0 {
			acc.latestAnnual = *r.AnnualSalary
			acc.hasAnnual = true
		}
		acc.biweeklySum += r.PensionablePay
		if r.LeavePayoutAmt != nil {
			acc.ms.LeavePayoutAmt += *r.LeavePayoutAmt
		}
		acc.ms.RecordCount++
	}

	// Phase 2: compute monthly pensionable pay
	for _, acc := range monthly {
		if acc.hasAnnual {
			// Monthly salary = annualized rate / 12
			acc.ms.PensionablePay = acc.latestAnnual / 12.0
		} else {
			// Fallback: sum of biweekly records (legacy records without annl_salary)
			acc.ms.PensionablePay = acc.biweeklySum
		}
		acc.ms.TotalPay = acc.ms.PensionablePay + acc.ms.LeavePayoutAmt
	}

	// Sort by year-month
	result := make([]models.MonthlySalary, 0, len(monthly))
	for _, acc := range monthly {
		result = append(result, *acc.ms)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Year != result[j].Year {
			return result[i].Year < result[j].Year
		}
		return result[i].Month < result[j].Month
	})

	return result
}

// Calculate computes the AMS using a sliding window over monthly salary data.
//
// Parameters:
//   - monthlySalaries: aggregated monthly salary records (from AggregateBiweeklyToMonthly)
//   - windowMonths: window size (36 or 60)
//   - includeLeave: whether to include leave payout in the calculation
//
// Returns the AMSCalculation with full detail for audit transparency.
//
// The sliding window finds the consecutive N-month period with the highest
// total compensation. Months with no salary records within the employment
// period are treated as $0 months (they still count toward the window).
func Calculate(monthlySalaries []models.MonthlySalary, windowMonths int, includeLeave bool) *models.AMSCalculation {
	if len(monthlySalaries) == 0 {
		return &models.AMSCalculation{WindowMonths: windowMonths}
	}

	// Build a map for quick lookup
	salaryMap := make(map[monthKey]models.MonthlySalary)
	for _, ms := range monthlySalaries {
		k := monthKey{ms.Year, ms.Month}
		salaryMap[k] = ms
	}

	// Find the range of months we have data for
	firstMonth := monthKey{monthlySalaries[0].Year, monthlySalaries[0].Month}
	lastMonth := monthKey{
		monthlySalaries[len(monthlySalaries)-1].Year,
		monthlySalaries[len(monthlySalaries)-1].Month,
	}

	totalMonths := monthsBetween(firstMonth, lastMonth)
	if totalMonths < windowMonths {
		// Not enough months — use all available
		return calculateWindow(salaryMap, firstMonth, totalMonths, includeLeave)
	}

	// Slide the window to find the maximum AMS
	var bestResult *models.AMSCalculation
	bestAMS := -1.0

	// Iterate through all possible window start positions
	numPositions := totalMonths - windowMonths + 1
	current := firstMonth
	for i := 0; i < numPositions; i++ {
		result := calculateWindow(salaryMap, current, windowMonths, includeLeave)
		if result.AMS > bestAMS {
			bestAMS = result.AMS
			bestResult = result
		}
		current = current.next()
	}

	return bestResult
}

// calculateWindow computes the AMS for a specific window starting position.
func calculateWindow(salaryMap map[monthKey]models.MonthlySalary, start monthKey, windowMonths int, includeLeave bool) *models.AMSCalculation {
	result := &models.AMSCalculation{
		WindowMonths: windowMonths,
	}

	current := start
	endMonth := start
	for i := 0; i < windowMonths; i++ {
		ms, ok := salaryMap[current]
		if ok {
			result.BaseCompensation += ms.PensionablePay
			if includeLeave {
				result.LeavePayoutAdded += ms.LeavePayoutAmt
			}
		}
		endMonth = current
		current = current.next()
	}

	result.TotalCompensation = result.BaseCompensation + result.LeavePayoutAdded

	// ASSUMPTION: [Q-CALC-01] Using banker's rounding on final AMS.
	// Carry full precision through intermediate calculations.
	result.AMS = result.TotalCompensation / float64(windowMonths)
	// Round AMS to 2 decimal places using banker's rounding
	result.AMS = bankersRound(result.AMS, 2)

	// Also round compensation totals for display
	result.BaseCompensation = bankersRound(result.BaseCompensation, 2)
	result.LeavePayoutAdded = bankersRound(result.LeavePayoutAdded, 2)
	result.TotalCompensation = bankersRound(result.TotalCompensation, 2)

	result.WindowStart = fmt.Sprintf("%d-%02d-01", start.Year, start.Month)
	endTime := time.Date(endMonth.Year, time.Month(endMonth.Month)+1, 0, 0, 0, 0, 0, time.UTC)
	result.WindowEnd = endTime.Format("2006-01-02")

	return result
}

// bankersRound implements banker's rounding (round half to even) to n decimal places.
// ASSUMPTION: [Q-CALC-01] Using banker's rounding. DERP's actual method unconfirmed.
// See derp-business-rules-inventory.docx, RULE-ROUNDING
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
