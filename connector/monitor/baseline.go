package main

import (
	"database/sql"
	"fmt"
	"math"
)

// round2 rounds a float64 to 2 decimal places.
func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

// ComputeBaselines queries the database and establishes statistical baselines
// for key HR/payroll metrics. All numeric outputs are rounded to 2 decimal places.
func ComputeBaselines(db *sql.DB) ([]Baseline, error) {
	var baselines []Baseline

	// 1. Monthly employee count: avg number of salary slips per month
	empCount, err := computeMonthlyEmployeeCount(db)
	if err != nil {
		return nil, fmt.Errorf("monthly_employee_count: %w", err)
	}
	baselines = append(baselines, empCount)

	// 2. Monthly gross total: avg total gross pay per month
	grossTotal, err := computeMonthlyGrossTotal(db)
	if err != nil {
		return nil, fmt.Errorf("monthly_gross_total: %w", err)
	}
	baselines = append(baselines, grossTotal)

	// 3. Monthly average gross: avg gross pay per employee per month
	avgGross, err := computeMonthlyAvgGross(db)
	if err != nil {
		return nil, fmt.Errorf("monthly_avg_gross: %w", err)
	}
	baselines = append(baselines, avgGross)

	// 4. Average leave allocation per employee per year
	leaveAlloc, err := computeAvgLeaveAllocation(db)
	if err != nil {
		return nil, fmt.Errorf("avg_leave_allocation: %w", err)
	}
	baselines = append(baselines, leaveAlloc)

	// 5. Monthly payroll runs: expected 1 per month
	payrollRuns, err := computeMonthlyPayrollRuns(db)
	if err != nil {
		return nil, fmt.Errorf("monthly_payroll_runs: %w", err)
	}
	baselines = append(baselines, payrollRuns)

	return baselines, nil
}

// computeMonthlyEmployeeCount returns statistics on the count of salary slips per month.
func computeMonthlyEmployeeCount(db *sql.DB) (Baseline, error) {
	query := `
		SELECT COUNT(*) AS slip_count
		FROM ` + "`tabSalary Slip`" + `
		WHERE docstatus = 1
		GROUP BY YEAR(start_date), MONTH(start_date)
		ORDER BY YEAR(start_date), MONTH(start_date)
	`
	values, err := queryFloatColumn(db, query)
	if err != nil {
		return Baseline{}, err
	}
	return computeStats("monthly_employee_count", values), nil
}

// computeMonthlyGrossTotal returns statistics on total gross pay per month.
func computeMonthlyGrossTotal(db *sql.DB) (Baseline, error) {
	query := `
		SELECT COALESCE(SUM(gross_pay), 0) AS total_gross
		FROM ` + "`tabSalary Slip`" + `
		WHERE docstatus = 1
		GROUP BY YEAR(start_date), MONTH(start_date)
		ORDER BY YEAR(start_date), MONTH(start_date)
	`
	values, err := queryFloatColumn(db, query)
	if err != nil {
		return Baseline{}, err
	}
	return computeStats("monthly_gross_total", values), nil
}

// computeMonthlyAvgGross returns statistics on average gross pay per employee per month.
func computeMonthlyAvgGross(db *sql.DB) (Baseline, error) {
	query := `
		SELECT COALESCE(AVG(gross_pay), 0) AS avg_gross
		FROM ` + "`tabSalary Slip`" + `
		WHERE docstatus = 1
		GROUP BY YEAR(start_date), MONTH(start_date)
		ORDER BY YEAR(start_date), MONTH(start_date)
	`
	values, err := queryFloatColumn(db, query)
	if err != nil {
		return Baseline{}, err
	}
	return computeStats("monthly_avg_gross", values), nil
}

// computeAvgLeaveAllocation returns statistics on leaves allocated per employee per year.
func computeAvgLeaveAllocation(db *sql.DB) (Baseline, error) {
	query := `
		SELECT COALESCE(total_leaves_allocated, 0) AS leaves
		FROM ` + "`tabLeave Allocation`" + `
		WHERE docstatus = 1
	`
	values, err := queryFloatColumn(db, query)
	if err != nil {
		return Baseline{}, err
	}
	return computeStats("avg_leave_allocation", values), nil
}

// computeMonthlyPayrollRuns returns statistics on the number of payroll entries per month.
func computeMonthlyPayrollRuns(db *sql.DB) (Baseline, error) {
	query := `
		SELECT COUNT(*) AS run_count
		FROM ` + "`tabPayroll Entry`" + `
		WHERE docstatus = 1
		GROUP BY YEAR(start_date), MONTH(start_date)
		ORDER BY YEAR(start_date), MONTH(start_date)
	`
	values, err := queryFloatColumn(db, query)
	if err != nil {
		return Baseline{}, err
	}
	return computeStats("monthly_payroll_runs", values), nil
}

// queryFloatColumn executes a query and returns a slice of float64 values
// from the first column of each result row.
func queryFloatColumn(db *sql.DB, query string) ([]float64, error) {
	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var values []float64
	for rows.Next() {
		var v float64
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		values = append(values, v)
	}
	return values, rows.Err()
}

// computeStats calculates mean, standard deviation, min, max from a slice of values.
// All outputs are rounded to 2 decimal places.
func computeStats(name string, values []float64) Baseline {
	b := Baseline{
		MetricName: name,
		SampleSize: len(values),
	}

	if len(values) == 0 {
		return b
	}

	// Mean
	var sum float64
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))
	b.Mean = round2(mean)

	// Min / Max
	minVal := values[0]
	maxVal := values[0]
	for _, v := range values[1:] {
		if v < minVal {
			minVal = v
		}
		if v > maxVal {
			maxVal = v
		}
	}
	b.Min = round2(minVal)
	b.Max = round2(maxVal)

	// Standard deviation (population)
	if len(values) > 1 {
		var sumSqDiff float64
		for _, v := range values {
			diff := v - mean
			sumSqDiff += diff * diff
		}
		b.StdDev = round2(math.Sqrt(sumSqDiff / float64(len(values))))
	}

	return b
}
