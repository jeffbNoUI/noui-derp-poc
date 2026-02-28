/**
 * Employer portal domain types — departments, employees, contributions, retirements.
 * Consumed by: employer-demo-data.ts, EmployerDashboard, EmployeeRoster, ContributionReporting, RetirementCoordination
 * Depends on: Nothing (self-contained type definitions)
 */

export interface Department {
  dept_id: string
  name: string
  code: string
  employee_count: number
  monthly_payroll: number
  contact_name: string
  contact_email: string
}

export interface EmployerEmployee {
  member_id: string
  first_name: string
  last_name: string
  department: string
  tier: number
  hire_date: string
  status: 'active' | 'terminated' | 'retired' | 'deceased'
  monthly_salary: number
  retirement_date?: string
  retirement_status?: 'none' | 'pending' | 'approved'
  years_of_service: number
}

export interface ContributionReport {
  report_id: string
  period: string
  department: string
  employee_count: number
  total_employee_contributions: number
  total_employer_contributions: number
  total_gross_payroll: number
  status: 'draft' | 'submitted' | 'verified' | 'discrepancy'
  discrepancies?: ContributionDiscrepancy[]
  submitted_at?: string
}

export interface ContributionDiscrepancy {
  member_id: string
  member_name: string
  field: string
  expected: number
  actual: number
  severity: 'warning' | 'error'
  message: string
}

export interface PendingRetirement {
  member_id: string
  member_name: string
  tier: number
  department: string
  retirement_date: string
  application_status: string
  documents_complete: boolean
  last_day_worked?: string
  estimated_benefit?: number
  application_submitted_at?: string  // ISO timestamp when application was submitted
}

export interface EmployerDashboardStats {
  active_employees: number
  pending_retirements: number
  monthly_payroll: number
  avg_service_years: number
  contribution_rate_employee: number
  contribution_rate_employer: number
}

// ─── Contribution Upload Types ──────────────────────────────────────────────

/** Single row from an employer contribution CSV file */
export interface ContributionFileRow {
  member_id: string
  ssn_last4: string
  name: string
  pay_period_begin: string
  pay_period_end: string
  department: string
  job_classification: string
  gross_earnings: number
  pensionable_earnings: number
  employee_contribution: number
  employer_contribution: number
  employment_status: 'active' | 'terminated' | 'leave'
  transaction_type: 'regular' | 'adjustment' | 'retroactive'
  tier: number
}

/** Single validation issue on a row */
export interface ValidationIssue {
  issue_id: string
  field: string
  severity: 'warning' | 'error'
  message: string
  expected?: string
  actual?: string
  resolved: boolean
}

/** Per-row validation result */
export interface RowValidationResult {
  row_index: number
  status: 'clean' | 'warning' | 'error'
  issues: ValidationIssue[]
  corrections: Record<string, string | number>
  acknowledged_warnings: string[]
}

/** File metadata extracted at upload time */
export interface ContributionFileMetadata {
  file_name: string
  file_size_bytes: number
  row_count: number
  period: string
  department: string
  uploaded_at: string
}

/** Aggregate validation stats */
export interface ValidationSummary {
  total_rows: number
  clean_rows: number
  warning_rows: number
  error_rows: number
  total_issues: number
  total_payroll: number
  total_ee_contributions: number
  total_er_contributions: number
}
