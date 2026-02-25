// Package db — employer-specific database queries for the DERP connector service.
// Queries aggregate data from DEPARTMENT_REF, MEMBER_MASTER, CONTRIBUTION_HIST,
// and CASE_HIST to support employer portal endpoints.
// Consumed by: employer_handlers.go (API layer)
// Depends on: PostgreSQL legacy schema, models/employer.go types
package db

import (
	"fmt"
	"log"
	"time"

	"github.com/noui-derp-poc/connector/internal/models"
)

// GetDepartments retrieves all departments with employee counts and payroll aggregates.
// Queries DEPARTMENT_REF and joins with MEMBER_MASTER to compute per-department stats.
// Falls back to empty results on query failure (POC — legacy DB may lack perfect data).
func (q *Queries) GetDepartments() ([]models.Department, error) {
	rows, err := q.db.Query(`
		SELECT
			d.DEPT_ID, d.DEPT_NM, d.DEPT_CD,
			COALESCE(counts.emp_count, 0),
			COALESCE(counts.monthly_payroll, 0),
			COALESCE(d.CONTACT_NM, ''),
			COALESCE(d.CONTACT_EMAIL, '')
		FROM DEPARTMENT_REF d
		LEFT JOIN (
			SELECT DEPT_CD,
			       COUNT(*) AS emp_count,
			       SUM(COALESCE(ANNUAL_SALARY, 0) / 12.0) AS monthly_payroll
			FROM MEMBER_MASTER
			WHERE STATUS_CD = 'A'
			GROUP BY DEPT_CD
		) counts ON d.DEPT_CD = counts.DEPT_CD
		ORDER BY d.DEPT_NM
	`)
	if err != nil {
		log.Printf("WARN: GetDepartments query failed (may be missing DEPARTMENT_REF table): %v", err)
		return []models.Department{}, nil
	}
	defer rows.Close()

	var depts []models.Department
	for rows.Next() {
		d := models.Department{}
		if err := rows.Scan(
			&d.DeptID, &d.Name, &d.Code,
			&d.EmployeeCount, &d.MonthlyPayroll,
			&d.ContactName, &d.ContactEmail,
		); err != nil {
			log.Printf("WARN: GetDepartments scan error: %v", err)
			continue
		}
		depts = append(depts, d)
	}
	if err := rows.Err(); err != nil {
		log.Printf("WARN: GetDepartments rows error: %v", err)
	}
	return depts, nil
}

// GetEmployeesByDepartment retrieves active employees in a department.
// Computes tier from hire date and years of service from hire date to now.
// Falls back to empty results on query failure.
func (q *Queries) GetEmployeesByDepartment(deptCode string) ([]models.EmployerEmployee, error) {
	rows, err := q.db.Query(`
		SELECT
			m.MBR_ID, m.FIRST_NM, m.LAST_NM,
			COALESCE(m.DEPT_CD, ''),
			COALESCE(m.TIER_CD, 0),
			m.HIRE_DT,
			m.STATUS_CD,
			COALESCE(m.ANNUAL_SALARY, 0),
			m.TERM_DT
		FROM MEMBER_MASTER m
		WHERE m.DEPT_CD = $1
		ORDER BY m.LAST_NM, m.FIRST_NM
	`, deptCode)
	if err != nil {
		log.Printf("WARN: GetEmployeesByDepartment(%s) query failed: %v", deptCode, err)
		return []models.EmployerEmployee{}, nil
	}
	defer rows.Close()

	now := time.Now()
	var employees []models.EmployerEmployee
	for rows.Next() {
		var (
			memberID     string
			firstName    string
			lastName     string
			department   string
			tier         int
			hireDate     *time.Time
			statusCode   string
			annualSalary float64
			termDate     *time.Time
		)
		if err := rows.Scan(
			&memberID, &firstName, &lastName,
			&department, &tier, &hireDate,
			&statusCode, &annualSalary, &termDate,
		); err != nil {
			log.Printf("WARN: GetEmployeesByDepartment scan error: %v", err)
			continue
		}

		emp := models.EmployerEmployee{
			MemberID:      memberID,
			FirstName:     firstName,
			LastName:      lastName,
			Department:    department,
			Tier:          tier,
			Status:        statusCode,
			MonthlySalary: annualSalary / 12.0,
		}

		if hireDate != nil {
			emp.HireDate = hireDate.Format("2006-01-02")
			// Compute years of service from hire date to now (or term date if terminated)
			endDate := now
			if termDate != nil {
				endDate = *termDate
			}
			emp.YearsOfService = endDate.Sub(*hireDate).Hours() / (24 * 365.25)
		}

		// Determine retirement status from CASE_HIST or status code
		switch statusCode {
		case "A":
			emp.RetirementStatus = "active"
		case "R":
			emp.RetirementStatus = "retired"
			if termDate != nil {
				retDateStr := termDate.Format("2006-01-02")
				emp.RetirementDate = &retDateStr
			}
		case "T":
			emp.RetirementStatus = "terminated"
		default:
			emp.RetirementStatus = statusCode
		}

		employees = append(employees, emp)
	}
	if err := rows.Err(); err != nil {
		log.Printf("WARN: GetEmployeesByDepartment rows error: %v", err)
	}
	return employees, nil
}

// GetContributionReports retrieves aggregate contribution reports for a department.
// Groups CONTRIBUTION_HIST by fiscal year/quarter and department.
// Optional period filter (e.g., "2025-Q1"). Falls back to empty results.
func (q *Queries) GetContributionReports(deptCode string) ([]models.ContributionReport, error) {
	rows, err := q.db.Query(`
		SELECT
			COALESCE(c.FISCAL_YR, 0),
			COALESCE(c.QTR, 0),
			COUNT(DISTINCT c.MBR_ID) AS emp_count,
			COALESCE(SUM(c.EMPL_CONTRIB), 0),
			COALESCE(SUM(c.EMPR_CONTRIB), 0),
			COALESCE(SUM(c.PENS_SALARY), 0)
		FROM CONTRIBUTION_HIST c
		JOIN MEMBER_MASTER m ON c.MBR_ID = m.MBR_ID
		WHERE m.DEPT_CD = $1
		GROUP BY c.FISCAL_YR, c.QTR
		ORDER BY c.FISCAL_YR DESC, c.QTR DESC
		LIMIT 20
	`, deptCode)
	if err != nil {
		log.Printf("WARN: GetContributionReports(%s) query failed: %v", deptCode, err)
		return []models.ContributionReport{}, nil
	}
	defer rows.Close()

	var reports []models.ContributionReport
	for rows.Next() {
		var (
			fiscalYear int
			quarter    int
			empCount   int
			emplTotal  float64
			emprTotal  float64
			payroll    float64
		)
		if err := rows.Scan(&fiscalYear, &quarter, &empCount, &emplTotal, &emprTotal, &payroll); err != nil {
			log.Printf("WARN: GetContributionReports scan error: %v", err)
			continue
		}

		period := fmt.Sprintf("%d-Q%d", fiscalYear, quarter)
		reportID := fmt.Sprintf("CR-%s-%s", deptCode, period)

		reports = append(reports, models.ContributionReport{
			ReportID:                   reportID,
			Period:                     period,
			Department:                 deptCode,
			EmployeeCount:              empCount,
			TotalEmployeeContributions: emplTotal,
			TotalEmployerContributions: emprTotal,
			TotalGrossPayroll:          payroll,
			Status:                     "submitted",
		})
	}
	if err := rows.Err(); err != nil {
		log.Printf("WARN: GetContributionReports rows error: %v", err)
	}
	return reports, nil
}

// GetPendingRetirements retrieves pending retirement cases for a department.
// Joins CASE_HIST with MEMBER_MASTER to find open retirement cases.
// Falls back to empty results.
func (q *Queries) GetPendingRetirements(deptCode string) ([]models.EmployerEmployee, error) {
	rows, err := q.db.Query(`
		SELECT
			m.MBR_ID, m.FIRST_NM, m.LAST_NM,
			COALESCE(m.DEPT_CD, ''),
			COALESCE(m.TIER_CD, 0),
			m.HIRE_DT,
			c.CASE_STATUS,
			COALESCE(m.ANNUAL_SALARY, 0),
			c.OPEN_DT
		FROM CASE_HIST c
		JOIN MEMBER_MASTER m ON c.MBR_ID = m.MBR_ID
		WHERE m.DEPT_CD = $1
		  AND c.CASE_TYPE = 'SVC_RET'
		  AND c.CASE_STATUS IN ('IN_REVIEW', 'PENDING', 'SUBMITTED')
		ORDER BY c.OPEN_DT DESC
	`, deptCode)
	if err != nil {
		log.Printf("WARN: GetPendingRetirements(%s) query failed: %v", deptCode, err)
		return []models.EmployerEmployee{}, nil
	}
	defer rows.Close()

	var employees []models.EmployerEmployee
	for rows.Next() {
		var (
			memberID     string
			firstName    string
			lastName     string
			department   string
			tier         int
			hireDate     *time.Time
			caseStatus   string
			annualSalary float64
			openDate     *time.Time
		)
		if err := rows.Scan(
			&memberID, &firstName, &lastName,
			&department, &tier, &hireDate,
			&caseStatus, &annualSalary, &openDate,
		); err != nil {
			log.Printf("WARN: GetPendingRetirements scan error: %v", err)
			continue
		}

		emp := models.EmployerEmployee{
			MemberID:         memberID,
			FirstName:        firstName,
			LastName:         lastName,
			Department:       department,
			Tier:             tier,
			Status:           "A",
			MonthlySalary:    annualSalary / 12.0,
			RetirementStatus: caseStatus,
		}

		if hireDate != nil {
			emp.HireDate = hireDate.Format("2006-01-02")
			emp.YearsOfService = time.Since(*hireDate).Hours() / (24 * 365.25)
		}
		if openDate != nil {
			retDateStr := openDate.Format("2006-01-02")
			emp.RetirementDate = &retDateStr
		}

		employees = append(employees, emp)
	}
	if err := rows.Err(); err != nil {
		log.Printf("WARN: GetPendingRetirements rows error: %v", err)
	}
	return employees, nil
}

// GetEmployerDashboardStats computes aggregate employer dashboard statistics.
// Aggregates from MEMBER_MASTER and CASE_HIST for a specific department.
// If deptCode is empty, aggregates across all departments.
// Contribution rates are statutory constants: 8.45% employee, 17.95% employer.
func (q *Queries) GetEmployerDashboardStats(deptCode string) (*models.EmployerDashboardStats, error) {
	stats := &models.EmployerDashboardStats{
		// Statutory contribution rates — RMC §18-401, DERP Handbook Jan 2024
		ContributionRateEmployee: 8.45,
		ContributionRateEmployer: 17.95,
	}

	// Count active employees and compute payroll
	var query string
	var args []interface{}
	if deptCode != "" {
		query = `
			SELECT
				COUNT(*),
				COALESCE(SUM(ANNUAL_SALARY / 12.0), 0),
				COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - HIRE_DT)) / (365.25 * 86400)), 0)
			FROM MEMBER_MASTER
			WHERE STATUS_CD = 'A' AND DEPT_CD = $1
		`
		args = []interface{}{deptCode}
	} else {
		query = `
			SELECT
				COUNT(*),
				COALESCE(SUM(ANNUAL_SALARY / 12.0), 0),
				COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - HIRE_DT)) / (365.25 * 86400)), 0)
			FROM MEMBER_MASTER
			WHERE STATUS_CD = 'A'
		`
	}

	row := q.db.QueryRow(query, args...)
	if err := row.Scan(&stats.ActiveEmployees, &stats.MonthlyPayroll, &stats.AvgServiceYears); err != nil {
		log.Printf("WARN: GetEmployerDashboardStats query failed: %v", err)
		return stats, nil
	}

	// Count pending retirements
	var pendingQuery string
	if deptCode != "" {
		pendingQuery = `
			SELECT COUNT(*)
			FROM CASE_HIST c
			JOIN MEMBER_MASTER m ON c.MBR_ID = m.MBR_ID
			WHERE c.CASE_TYPE = 'SVC_RET'
			  AND c.CASE_STATUS IN ('IN_REVIEW', 'PENDING', 'SUBMITTED')
			  AND m.DEPT_CD = $1
		`
		row = q.db.QueryRow(pendingQuery, deptCode)
	} else {
		pendingQuery = `
			SELECT COUNT(*)
			FROM CASE_HIST c
			WHERE c.CASE_TYPE = 'SVC_RET'
			  AND c.CASE_STATUS IN ('IN_REVIEW', 'PENDING', 'SUBMITTED')
		`
		row = q.db.QueryRow(pendingQuery)
	}
	if err := row.Scan(&stats.PendingRetirements); err != nil {
		log.Printf("WARN: GetEmployerDashboardStats pending retirements query failed: %v", err)
	}

	return stats, nil
}
