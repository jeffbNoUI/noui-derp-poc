// Package models — employer domain types for the DERP connector service.
// Maps legacy database tables (DEPARTMENT_REF, MEMBER_MASTER, CONTRIBUTION_HIST)
// to clean employer-facing domain objects.
// Consumed by: employer_handlers.go (connector API), intelligence connector client
// Depends on: legacy DB schema (DEPARTMENT_REF, MEMBER_MASTER, CONTRIBUTION_HIST, CASE_HIST)
package models

// Department represents a city department with aggregate employee/payroll data.
// Mapped from DEPARTMENT_REF joined with MEMBER_MASTER aggregates.
type Department struct {
	DeptID        string  `json:"dept_id"`
	Name          string  `json:"name"`
	Code          string  `json:"code"`
	EmployeeCount int     `json:"employee_count"`
	MonthlyPayroll float64 `json:"monthly_payroll"`
	ContactName   string  `json:"contact_name"`
	ContactEmail  string  `json:"contact_email"`
}

// EmployerEmployee represents a member as seen from the employer perspective.
// Includes computed fields (tier, years of service) derived from MEMBER_MASTER columns.
type EmployerEmployee struct {
	MemberID         string  `json:"member_id"`
	FirstName        string  `json:"first_name"`
	LastName         string  `json:"last_name"`
	Department       string  `json:"department"`
	Tier             int     `json:"tier"`
	HireDate         string  `json:"hire_date"`
	Status           string  `json:"status"`
	MonthlySalary    float64 `json:"monthly_salary"`
	RetirementDate   *string `json:"retirement_date,omitempty"`
	RetirementStatus string  `json:"retirement_status"`
	YearsOfService   float64 `json:"years_of_service"`
}

// ContributionReport represents an aggregate contribution report for a department/period.
// Aggregated from CONTRIBUTION_HIST grouped by period and department.
type ContributionReport struct {
	ReportID                   string  `json:"report_id"`
	Period                     string  `json:"period"`
	Department                 string  `json:"department"`
	EmployeeCount              int     `json:"employee_count"`
	TotalEmployeeContributions float64 `json:"total_employee_contributions"`
	TotalEmployerContributions float64 `json:"total_employer_contributions"`
	TotalGrossPayroll          float64 `json:"total_gross_payroll"`
	Status                     string  `json:"status"`
	SubmittedAt                *string `json:"submitted_at,omitempty"`
}

// EmployerDashboardStats provides aggregate statistics for the employer dashboard.
// Computed from MEMBER_MASTER and CASE_HIST queries.
type EmployerDashboardStats struct {
	ActiveEmployees          int     `json:"active_employees"`
	PendingRetirements       int     `json:"pending_retirements"`
	MonthlyPayroll           float64 `json:"monthly_payroll"`
	AvgServiceYears          float64 `json:"avg_service_years"`
	ContributionRateEmployee float64 `json:"contribution_rate_employee"`
	ContributionRateEmployer float64 `json:"contribution_rate_employer"`
}
