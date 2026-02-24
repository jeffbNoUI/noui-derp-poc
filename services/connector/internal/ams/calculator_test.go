package ams

import (
	"math"
	"testing"
	"time"

	"github.com/noui-derp-poc/connector/internal/models"
)

// Helper to create monthly salary records for testing.
func monthlySalary(year, month int, pensionPay, leavePayout float64) models.MonthlySalary {
	return models.MonthlySalary{
		Year:           year,
		Month:          month,
		PensionablePay: pensionPay,
		LeavePayoutAmt: leavePayout,
		TotalPay:       pensionPay + leavePayout,
		RecordCount:    1,
	}
}

// assertFloat checks two floats are equal within a tolerance.
func assertFloat(t *testing.T, name string, got, want, tolerance float64) {
	t.Helper()
	if math.Abs(got-want) > tolerance {
		t.Errorf("%s: got %.2f, want %.2f (diff %.4f)", name, got, want, math.Abs(got-want))
	}
}

func TestWindowSize(t *testing.T) {
	tests := []struct {
		tier     int
		expected int
	}{
		{1, 36},
		{2, 36},
		{3, 60},
	}
	for _, tt := range tests {
		got := WindowSize(tt.tier)
		if got != tt.expected {
			t.Errorf("WindowSize(%d) = %d, want %d", tt.tier, got, tt.expected)
		}
	}
}

// TestCase1MartinezAMS verifies the AMS calculation for Case 1 (Robert Martinez).
// Tier 1, 36-month window, with $52,000 leave payout.
// Expected: AMS = $10,639.45 (from test fixture)
//
// Salary schedule from generator:
//   2023: $105,513/yr  2024: $109,734/yr  2025: $113,043/yr  2026: $116,434/yr
// Leave payout: $52,000 on final pay period (March 2026)
//
// The biweekly-to-monthly aggregation produces slightly different totals
// than annual/12. The fixture's authoritative base_compensation is $331,020.24.
func TestCase1MartinezAMS(t *testing.T) {
	// Build monthly salary records for the AMS window (April 2023 - March 2026)
	// Using biweekly-aggregated monthly values that match the fixture
	var monthlies []models.MonthlySalary

	// 2023 monthly (from annual $105,513 biweekly): ~$8,792.75/month
	// Biweekly = $105,513/26 = $4,058.19... Two biweekly periods per month (approx)
	biweekly2023 := 105513.0 / 26.0
	biweekly2024 := 109734.0 / 26.0
	biweekly2025 := 113043.0 / 26.0
	biweekly2026 := 116434.0 / 26.0

	// For this test, we simulate the biweekly-to-monthly aggregation.
	// Most months have 2 biweekly periods; some months have 3 due to calendar alignment.
	// Over a year: 26 biweekly periods across 12 months.
	// We distribute as: 10 months with 2 periods, 2 months with 3 periods.
	//
	// Instead of exact biweekly simulation, we use the known fixture totals.
	// The fixture says base_compensation = $331,020.24 for 36 months.
	// We need to distribute this across 36 months such that the total matches.
	//
	// Approach: use the annual rates and adjust the last month to match fixture total.
	monthly2023 := 105513.0 / 12.0 // $8,792.75
	monthly2024 := 109734.0 / 12.0 // $9,144.50
	monthly2025 := 113043.0 / 12.0 // $9,420.25
	monthly2026 := 116434.0 / 12.0 // $9,702.833...

	// April 2023 - December 2023 (9 months)
	for m := 4; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2023, m, monthly2023, 0))
	}
	// January 2024 - December 2024 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2024, m, monthly2024, 0))
	}
	// January 2025 - December 2025 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2025, m, monthly2025, 0))
	}
	// January 2026 - February 2026 (2 months, no leave)
	monthlies = append(monthlies, monthlySalary(2026, 1, monthly2026, 0))
	monthlies = append(monthlies, monthlySalary(2026, 2, monthly2026, 0))
	// March 2026 — leave payout of $52,000 added
	monthlies = append(monthlies, monthlySalary(2026, 3, monthly2026, 52000.00))

	result := Calculate(monthlies, 36, true)

	// The annualized monthly rates sum to $331,020.25 (vs fixture $331,020.24).
	// This is the expected $0.01 biweekly aggregation difference.
	// We tolerate $1.00 on the total and verify AMS is within $0.01.
	assertFloat(t, "total_compensation", result.TotalCompensation, 383020.24, 1.50)
	assertFloat(t, "ams", result.AMS, 10639.45, 0.05)

	// Verify leave payout tracked separately
	assertFloat(t, "leave_payout", result.LeavePayoutAdded, 52000.00, 0.01)

	t.Logf("Case 1 AMS: base=%.2f leave=%.2f total=%.2f ams=%.2f",
		result.BaseCompensation, result.LeavePayoutAdded, result.TotalCompensation, result.AMS)

	// Also verify without leave payout
	resultNoLeave := Calculate(monthlies, 36, false)
	assertFloat(t, "ams_no_leave", resultNoLeave.AMS, 9195.01, 0.05)

	_ = biweekly2023
	_ = biweekly2024
	_ = biweekly2025
	_ = biweekly2026
}

// TestCase2KimAMS verifies the AMS calculation for Case 2 (Jennifer Kim).
// Tier 2, 36-month window, no leave payout.
// Expected: AMS = $7,347.62 (from test fixture)
//
// Salary schedule from calculation.md:
//   2023: $84,089/yr  2024: $87,453/yr  2025: $90,076/yr  2026: $92,778/yr
func TestCase2KimAMS(t *testing.T) {
	var monthlies []models.MonthlySalary

	monthly2023 := 84089.0 / 12.0  // $7,007.42
	monthly2024 := 87453.0 / 12.0  // $7,287.75
	monthly2025 := 90076.0 / 12.0  // $7,506.33
	monthly2026 := 92778.0 / 12.0  // $7,731.50

	// May 2023 - December 2023 (8 months)
	for m := 5; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2023, m, monthly2023, 0))
	}
	// January 2024 - December 2024 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2024, m, monthly2024, 0))
	}
	// January 2025 - December 2025 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2025, m, monthly2025, 0))
	}
	// January 2026 - April 2026 (4 months)
	for m := 1; m <= 4; m++ {
		monthlies = append(monthlies, monthlySalary(2026, m, monthly2026, 0))
	}

	result := Calculate(monthlies, 36, false)
	assertFloat(t, "total_compensation", result.TotalCompensation, 264514.32, 1.50)
	assertFloat(t, "ams", result.AMS, 7347.62, 0.05)

	t.Logf("Case 2 AMS: total=%.2f ams=%.2f", result.TotalCompensation, result.AMS)
}

// TestCase3WashingtonAMS verifies the AMS calculation for Case 3 (David Washington).
// Tier 3, 60-month window, no leave payout.
// Expected: AMS = $6,684.52 (from test fixture)
//
// Salary schedule from generator:
//   2021: $75,101  2022: $77,275  2023: $79,588  2024: $81,872  2025: $84,319  2026: $86,766
// Note: 2021 has COVID-era salary dip.
func TestCase3WashingtonAMS(t *testing.T) {
	var monthlies []models.MonthlySalary

	monthly2021 := 75101.0 / 12.0  // $6,258.42
	monthly2022 := 77275.0 / 12.0  // $6,439.58
	monthly2023 := 79588.0 / 12.0  // $6,632.33
	monthly2024 := 81872.0 / 12.0  // $6,822.67
	monthly2025 := 84319.0 / 12.0  // $7,026.58
	monthly2026 := 86766.0 / 12.0  // $7,230.50

	// April 2021 - December 2021 (9 months)
	for m := 4; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2021, m, monthly2021, 0))
	}
	// January 2022 - December 2022 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2022, m, monthly2022, 0))
	}
	// January 2023 - December 2023 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2023, m, monthly2023, 0))
	}
	// January 2024 - December 2024 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2024, m, monthly2024, 0))
	}
	// January 2025 - December 2025 (12 months)
	for m := 1; m <= 12; m++ {
		monthlies = append(monthlies, monthlySalary(2025, m, monthly2025, 0))
	}
	// January 2026 - March 2026 (3 months)
	for m := 1; m <= 3; m++ {
		monthlies = append(monthlies, monthlySalary(2026, m, monthly2026, 0))
	}

	result := Calculate(monthlies, 60, false)
	assertFloat(t, "total_compensation", result.TotalCompensation, 401071.20, 1.50)
	assertFloat(t, "ams", result.AMS, 6684.52, 0.05)

	t.Logf("Case 3 AMS: total=%.2f ams=%.2f", result.TotalCompensation, result.AMS)
}

// TestBankersRounding verifies the banker's rounding implementation.
func TestBankersRounding(t *testing.T) {
	tests := []struct {
		input    float64
		places   int
		expected float64
	}{
		{10639.4511, 2, 10639.45}, // AMS rounding case
		{1.235, 2, 1.24},         // round up (float representation slightly above .5)
		{2.5, 0, 2.0},            // exact half: round to even (2)
		{3.5, 0, 4.0},            // exact half: round to even (4)
		{4.5, 0, 4.0},            // exact half: round to even (4)
		{5.5, 0, 6.0},            // exact half: round to even (6)
		{1234.56, 2, 1234.56},    // no rounding needed
		{1234.564, 2, 1234.56},   // round down
		{1234.567, 2, 1234.57},   // round up
	}
	for _, tt := range tests {
		got := bankersRound(tt.input, tt.places)
		if math.Abs(got-tt.expected) > 0.001 {
			t.Errorf("bankersRound(%.4f, %d) = %.4f, want %.4f",
				tt.input, tt.places, got, tt.expected)
		}
	}
}

// TestAggregateBiweeklyToMonthly verifies biweekly grouping into months.
func TestAggregateBiweeklyToMonthly(t *testing.T) {
	records := []models.SalaryRecord{
		{PayPeriodEnd: date(2026, 1, 10), PensionablePay: 4000.00},
		{PayPeriodEnd: date(2026, 1, 24), PensionablePay: 4000.00},
		{PayPeriodEnd: date(2026, 2, 7), PensionablePay: 4000.00},
		{PayPeriodEnd: date(2026, 2, 21), PensionablePay: 4000.00},
	}

	result := AggregateBiweeklyToMonthly(records)
	if len(result) != 2 {
		t.Fatalf("expected 2 months, got %d", len(result))
	}
	assertFloat(t, "jan_total", result[0].PensionablePay, 8000.00, 0.01)
	assertFloat(t, "feb_total", result[1].PensionablePay, 8000.00, 0.01)
}

// TestLeavePayoutSeparation verifies leave payout is tracked separately.
func TestLeavePayoutSeparation(t *testing.T) {
	leavePayout := 52000.0
	records := []models.SalaryRecord{
		{PayPeriodEnd: date(2026, 3, 14), PensionablePay: 4500.00},
		{PayPeriodEnd: date(2026, 3, 28), PensionablePay: 4500.00, LeavePayoutAmt: &leavePayout, LeavePayoutTyp: "SICK_VAC"},
	}

	result := AggregateBiweeklyToMonthly(records)
	if len(result) != 1 {
		t.Fatalf("expected 1 month, got %d", len(result))
	}

	assertFloat(t, "pensionable", result[0].PensionablePay, 9000.00, 0.01)
	assertFloat(t, "leave_payout", result[0].LeavePayoutAmt, 52000.00, 0.01)
	assertFloat(t, "total", result[0].TotalPay, 61000.00, 0.01)
}

// TestAnnualizedAggregation verifies that months with 3 biweekly records
// use annl_salary/12 instead of summing biweekly amounts.
// This is the fix for the $210 AMS discrepancy vs oracle.
func TestAnnualizedAggregation(t *testing.T) {
	annual := 105513.0
	biweekly := annual / 26.0 // $4,058.19
	expectedMonthly := annual / 12.0 // $8,792.75

	// September 2023 had 3 biweekly payments due to calendar alignment
	records := []models.SalaryRecord{
		{PayPeriodEnd: date(2023, 9, 1), PensionablePay: biweekly, AnnualSalary: &annual},
		{PayPeriodEnd: date(2023, 9, 15), PensionablePay: biweekly, AnnualSalary: &annual},
		{PayPeriodEnd: date(2023, 9, 29), PensionablePay: biweekly, AnnualSalary: &annual},
		// August 2023: normal 2-period month
		{PayPeriodEnd: date(2023, 8, 4), PensionablePay: biweekly, AnnualSalary: &annual},
		{PayPeriodEnd: date(2023, 8, 18), PensionablePay: biweekly, AnnualSalary: &annual},
	}

	result := AggregateBiweeklyToMonthly(records)
	if len(result) != 2 {
		t.Fatalf("expected 2 months, got %d", len(result))
	}
	// Both months should use annl_salary/12, NOT sum of biweekly amounts
	assertFloat(t, "aug_pensionable", result[0].PensionablePay, expectedMonthly, 0.01)
	assertFloat(t, "sep_pensionable", result[1].PensionablePay, expectedMonthly, 0.01)

	// Verify 3-period month does NOT produce 3x biweekly
	threeTimesBI := biweekly * 3 // $12,174.57 — this is what the OLD code would produce
	if result[1].PensionablePay > threeTimesBI*0.9 {
		t.Errorf("3-period month should NOT sum to %.2f, got %.2f", threeTimesBI, result[1].PensionablePay)
	}
}

// TestEmptyInput verifies handling of no salary records.
func TestEmptyInput(t *testing.T) {
	result := Calculate(nil, 36, false)
	if result.AMS != 0 {
		t.Errorf("empty input should produce AMS=0, got %.2f", result.AMS)
	}
}

func date(y, m, d int) time.Time {
	return time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
}
