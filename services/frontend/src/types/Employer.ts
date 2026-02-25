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
}

export interface EmployerDashboardStats {
  active_employees: number
  pending_retirements: number
  monthly_payroll: number
  avg_service_years: number
  contribution_rate_employee: number
  contribution_rate_employer: number
}
