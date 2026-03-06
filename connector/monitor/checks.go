package main

import (
	"database/sql"
	"fmt"
	"math"
	"time"
)

// CheckFunc is the signature for a monitoring check function.
// Each check queries the database and returns a CheckResult with
// auditable evidence of what was found.
type CheckFunc func(db *sql.DB) CheckResult

// AllChecks returns the ordered list of all monitoring check functions.
func AllChecks() []CheckFunc {
	return []CheckFunc{
		SalaryGapCheck,
		NegativeLeaveBalanceCheck,
		MissingTerminationCheck,
		MissingPayrollRunCheck,
		InvalidHireDateCheck,
		ContributionImbalanceCheck,
	}
}

// SalaryGapCheck finds employees with gaps in their monthly salary slip sequence.
//
// Logic: For each employee, collect all salary slip months (YYYY-MM). Walk
// the sequence and flag any gap > 1 month. Fail if any employee has gaps.
//
// Category: completeness
// Evidence: employee name + missing month(s)
func SalaryGapCheck(db *sql.DB) CheckResult {
	now := time.Now().UTC().Format(time.RFC3339)
	result := CheckResult{
		CheckName: "salary_gap_check",
		Category:  "completeness",
		Timestamp: now,
	}

	// Get all employee/month combinations from submitted salary slips
	query := `
		SELECT employee_name,
		       YEAR(start_date) AS yr,
		       MONTH(start_date) AS mo
		FROM ` + "`tabSalary Slip`" + `
		WHERE docstatus = 1
		ORDER BY employee_name, yr, mo
	`
	rows, err := db.Query(query)
	if err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("query error: %v", err)
		return result
	}
	defer rows.Close()

	// Build per-employee month lists
	type monthKey struct {
		year  int
		month int
	}
	empMonths := make(map[string][]monthKey)
	for rows.Next() {
		var name string
		var yr, mo int
		if err := rows.Scan(&name, &yr, &mo); err != nil {
			result.Status = "fail"
			result.Message = fmt.Sprintf("scan error: %v", err)
			return result
		}
		empMonths[name] = append(empMonths[name], monthKey{yr, mo})
	}
	if err := rows.Err(); err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("rows error: %v", err)
		return result
	}

	// Find gaps
	var details []string
	gapCount := 0
	for emp, months := range empMonths {
		if len(months) < 2 {
			continue
		}
		for i := 1; i < len(months); i++ {
			prev := months[i-1]
			curr := months[i]
			// Calculate expected next month
			expectedYear := prev.year
			expectedMonth := prev.month + 1
			if expectedMonth > 12 {
				expectedMonth = 1
				expectedYear++
			}
			if curr.year != expectedYear || curr.month != expectedMonth {
				gap := fmt.Sprintf("%s: gap between %d-%02d and %d-%02d",
					emp, prev.year, prev.month, curr.year, curr.month)
				details = append(details, gap)
				gapCount++
			}
		}
	}

	result.Expected = 0
	result.Actual = float64(gapCount)
	result.Details = details

	if gapCount > 0 {
		result.Status = "fail"
		result.Message = fmt.Sprintf("found %d salary slip gap(s) across employees", gapCount)
		result.Deviation = 100.0 // any gap is a 100% deviation from expected (0 gaps)
	} else {
		result.Status = "pass"
		result.Message = "no salary slip gaps detected"
	}

	return result
}

// NegativeLeaveBalanceCheck finds leave allocations with negative total_leaves_allocated.
//
// Category: validity
// Evidence: employee name + negative amount
func NegativeLeaveBalanceCheck(db *sql.DB) CheckResult {
	now := time.Now().UTC().Format(time.RFC3339)
	result := CheckResult{
		CheckName: "negative_leave_balance_check",
		Category:  "validity",
		Timestamp: now,
	}

	query := `
		SELECT employee_name, leave_type, total_leaves_allocated
		FROM ` + "`tabLeave Allocation`" + `
		WHERE total_leaves_allocated < 0
		  AND docstatus = 1
	`
	rows, err := db.Query(query)
	if err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("query error: %v", err)
		return result
	}
	defer rows.Close()

	var details []string
	count := 0
	for rows.Next() {
		var name, leaveType string
		var amount float64
		if err := rows.Scan(&name, &leaveType, &amount); err != nil {
			result.Status = "fail"
			result.Message = fmt.Sprintf("scan error: %v", err)
			return result
		}
		details = append(details, fmt.Sprintf("%s: %s = %.2f", name, leaveType, amount))
		count++
	}
	if err := rows.Err(); err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("rows error: %v", err)
		return result
	}

	result.Expected = 0
	result.Actual = float64(count)
	result.Details = details

	if count > 0 {
		result.Status = "fail"
		result.Message = fmt.Sprintf("found %d leave allocation(s) with negative balance", count)
		result.Deviation = 100.0
	} else {
		result.Status = "pass"
		result.Message = "no negative leave balances found"
	}

	return result
}

// MissingTerminationCheck finds employees with status='Left' but no Employee Separation record.
//
// Category: completeness
// Evidence: employee IDs missing separation records
func MissingTerminationCheck(db *sql.DB) CheckResult {
	now := time.Now().UTC().Format(time.RFC3339)
	result := CheckResult{
		CheckName: "missing_termination_check",
		Category:  "completeness",
		Timestamp: now,
	}

	query := `
		SELECT e.name, e.employee_name
		FROM ` + "`tabEmployee`" + ` e
		LEFT JOIN ` + "`tabEmployee Separation`" + ` es
		  ON e.name = es.employee
		WHERE e.status = 'Left'
		  AND es.name IS NULL
	`
	rows, err := db.Query(query)
	if err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("query error: %v", err)
		return result
	}
	defer rows.Close()

	var details []string
	count := 0
	for rows.Next() {
		var empID, empName string
		if err := rows.Scan(&empID, &empName); err != nil {
			result.Status = "fail"
			result.Message = fmt.Sprintf("scan error: %v", err)
			return result
		}
		details = append(details, fmt.Sprintf("%s (%s): status=Left, no Employee Separation record", empID, empName))
		count++
	}
	if err := rows.Err(); err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("rows error: %v", err)
		return result
	}

	result.Expected = 0
	result.Actual = float64(count)
	result.Details = details

	if count > 0 {
		result.Status = "fail"
		result.Message = fmt.Sprintf("found %d employee(s) with status=Left but no separation record", count)
		result.Deviation = 100.0
	} else {
		result.Status = "pass"
		result.Message = "all terminated employees have separation records"
	}

	return result
}

// MissingPayrollRunCheck finds months where salary slips exist but no Payroll Entry.
//
// Category: completeness
// Evidence: months with salary slips but no payroll entry
func MissingPayrollRunCheck(db *sql.DB) CheckResult {
	now := time.Now().UTC().Format(time.RFC3339)
	result := CheckResult{
		CheckName: "missing_payroll_run_check",
		Category:  "completeness",
		Timestamp: now,
	}

	// Get months that have submitted salary slips but no submitted payroll entry
	query := `
		SELECT ss_months.yr, ss_months.mo
		FROM (
			SELECT DISTINCT YEAR(start_date) AS yr, MONTH(start_date) AS mo
			FROM ` + "`tabSalary Slip`" + `
			WHERE docstatus = 1
		) ss_months
		LEFT JOIN (
			SELECT DISTINCT YEAR(start_date) AS yr, MONTH(start_date) AS mo
			FROM ` + "`tabPayroll Entry`" + `
			WHERE docstatus = 1
		) pe_months
		  ON ss_months.yr = pe_months.yr AND ss_months.mo = pe_months.mo
		WHERE pe_months.yr IS NULL
		ORDER BY ss_months.yr, ss_months.mo
	`
	rows, err := db.Query(query)
	if err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("query error: %v", err)
		return result
	}
	defer rows.Close()

	var details []string
	count := 0
	for rows.Next() {
		var yr, mo int
		if err := rows.Scan(&yr, &mo); err != nil {
			result.Status = "fail"
			result.Message = fmt.Sprintf("scan error: %v", err)
			return result
		}
		details = append(details, fmt.Sprintf("%d-%02d: salary slips exist but no Payroll Entry", yr, mo))
		count++
	}
	if err := rows.Err(); err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("rows error: %v", err)
		return result
	}

	result.Expected = 0
	result.Actual = float64(count)
	result.Details = details

	if count > 0 {
		result.Status = "fail"
		result.Message = fmt.Sprintf("found %d month(s) with salary slips but no payroll entry", count)
		result.Deviation = 100.0
	} else {
		result.Status = "pass"
		result.Message = "all months with salary slips have corresponding payroll entries"
	}

	return result
}

// InvalidHireDateCheck finds employees with date_of_joining in the future.
//
// Category: validity
// Evidence: employee IDs and future dates
func InvalidHireDateCheck(db *sql.DB) CheckResult {
	now := time.Now().UTC().Format(time.RFC3339)
	result := CheckResult{
		CheckName: "invalid_hire_date_check",
		Category:  "validity",
		Timestamp: now,
	}

	query := `
		SELECT name, employee_name, date_of_joining
		FROM ` + "`tabEmployee`" + `
		WHERE date_of_joining > CURDATE()
	`
	rows, err := db.Query(query)
	if err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("query error: %v", err)
		return result
	}
	defer rows.Close()

	var details []string
	count := 0
	for rows.Next() {
		var empID, empName, dateStr string
		if err := rows.Scan(&empID, &empName, &dateStr); err != nil {
			result.Status = "fail"
			result.Message = fmt.Sprintf("scan error: %v", err)
			return result
		}
		details = append(details, fmt.Sprintf("%s (%s): date_of_joining=%s (future)", empID, empName, dateStr))
		count++
	}
	if err := rows.Err(); err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("rows error: %v", err)
		return result
	}

	result.Expected = 0
	result.Actual = float64(count)
	result.Details = details

	if count > 0 {
		result.Status = "fail"
		result.Message = fmt.Sprintf("found %d employee(s) with future hire dates", count)
		result.Deviation = 100.0
	} else {
		result.Status = "pass"
		result.Message = "no employees with future hire dates"
	}

	return result
}

// ContributionImbalanceCheck finds employees where salary slip gross_pay deviates
// from their salary structure assignment base amount.
//
// Logic: JOIN salary slips with the most recent salary structure assignment for
// each employee. Compare gross_pay to the base amount. Warn if deviation is 5-10%,
// fail if >10%.
//
// Category: consistency
// Evidence: employee IDs, expected base, actual gross, deviation percentage
func ContributionImbalanceCheck(db *sql.DB) CheckResult {
	now := time.Now().UTC().Format(time.RFC3339)
	result := CheckResult{
		CheckName: "contribution_imbalance_check",
		Category:  "consistency",
		Timestamp: now,
	}

	// For each employee, get their latest salary structure assignment base
	// and compare with their latest salary slip gross_pay.
	query := `
		SELECT
			ss.employee_name,
			ss.name AS slip_name,
			ss.gross_pay,
			ssa.base AS expected_base,
			ABS(ss.gross_pay - ssa.base) / NULLIF(ssa.base, 0) * 100 AS deviation_pct
		FROM ` + "`tabSalary Slip`" + ` ss
		INNER JOIN (
			SELECT employee, base,
			       ROW_NUMBER() OVER (PARTITION BY employee ORDER BY from_date DESC) AS rn
			FROM ` + "`tabSalary Structure Assignment`" + `
			WHERE docstatus = 1
		) ssa ON ss.employee = ssa.employee AND ssa.rn = 1
		WHERE ss.docstatus = 1
		  AND ssa.base > 0
		  AND ABS(ss.gross_pay - ssa.base) / ssa.base * 100 > 5
		ORDER BY deviation_pct DESC
	`
	rows, err := db.Query(query)
	if err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("query error: %v", err)
		return result
	}
	defer rows.Close()

	var details []string
	warnCount := 0
	failCount := 0
	for rows.Next() {
		var empName, slipName string
		var grossPay, expectedBase, devPct float64
		if err := rows.Scan(&empName, &slipName, &grossPay, &expectedBase, &devPct); err != nil {
			result.Status = "fail"
			result.Message = fmt.Sprintf("scan error: %v", err)
			return result
		}
		devPct = round2(devPct)
		severity := "WARN"
		if devPct > 10 {
			severity = "FAIL"
			failCount++
		} else {
			warnCount++
		}
		details = append(details, fmt.Sprintf("[%s] %s (slip %s): expected=%.2f actual=%.2f deviation=%.2f%%",
			severity, empName, slipName, expectedBase, grossPay, devPct))
	}
	if err := rows.Err(); err != nil {
		result.Status = "fail"
		result.Message = fmt.Sprintf("rows error: %v", err)
		return result
	}

	totalIssues := warnCount + failCount
	result.Expected = 0
	result.Actual = float64(totalIssues)
	result.Details = details

	if totalIssues > 0 {
		if failCount > 0 {
			result.Status = "fail"
			result.Message = fmt.Sprintf("found %d slip(s) with >10%% deviation, %d with 5-10%% deviation from salary structure base",
				failCount, warnCount)
		} else {
			result.Status = "warn"
			result.Message = fmt.Sprintf("found %d slip(s) with 5-10%% deviation from salary structure base", warnCount)
		}
		result.Deviation = round2(math.Max(float64(failCount), float64(warnCount)) / math.Max(result.Actual, 1) * 100)
	} else {
		result.Status = "pass"
		result.Message = "all salary slips are within 5% of salary structure base"
		result.Deviation = 0
	}

	return result
}
