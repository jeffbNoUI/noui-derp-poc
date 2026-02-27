/**
 * Employer portal demo data — departments, employees, contribution reports, pending retirements.
 * Consumed by: EmployerDashboard, EmployeeRoster, ContributionReporting, RetirementCoordination, employer-demo-data.test.ts
 * Depends on: Employer.ts types, demo-data.ts member fixtures (shared member IDs 10001-10008)
 */
import type {
  Department, EmployerEmployee, ContributionReport, PendingRetirement,
  EmployerDashboardStats,
} from '@/types/Employer'

// ─── Contribution rates from RMC §18-407 ────────────────────────────────────
const EMPLOYEE_RATE = 0.0845  // 8.45% employee contribution
const EMPLOYER_RATE = 0.1795  // 17.95% employer contribution

// ─── Departments ─────────────────────────────────────────────────────────────

export const DEMO_DEPARTMENTS: Department[] = [
  {
    dept_id: 'PW', name: 'Public Works', code: 'PW', employee_count: 8,
    monthly_payroll: 72400, contact_name: 'Sarah Mitchell', contact_email: 's.mitchell@denver.gov',
  },
  {
    dept_id: 'PR', name: 'Parks & Recreation', code: 'PR', employee_count: 6,
    monthly_payroll: 48200, contact_name: 'Michael Torres', contact_email: 'm.torres@denver.gov',
  },
  {
    dept_id: 'FIN', name: 'Finance', code: 'FIN', employee_count: 5,
    monthly_payroll: 52100, contact_name: 'Lisa Chang', contact_email: 'l.chang@denver.gov',
  },
]

// ─── Employees ───────────────────────────────────────────────────────────────
// Cross-references existing demo member IDs from demo-data.ts

export const DEMO_EMPLOYER_EMPLOYEES: EmployerEmployee[] = [
  // Public Works (PW) — 8 employees
  {
    member_id: '10001', first_name: 'Robert', last_name: 'Martinez', department: 'PW',
    tier: 1, hire_date: '1997-06-15', status: 'active', monthly_salary: 10639,
    retirement_status: 'pending', years_of_service: 28.75,
  },
  {
    member_id: '10003', first_name: 'David', last_name: 'Washington', department: 'PW',
    tier: 3, hire_date: '2013-09-01', status: 'active', monthly_salary: 7200,
    retirement_status: 'pending', years_of_service: 12.58,
  },
  {
    member_id: '10011', first_name: 'Thomas', last_name: 'Nguyen', department: 'PW',
    tier: 2, hire_date: '2006-03-15', status: 'active', monthly_salary: 8450,
    retirement_status: 'none', years_of_service: 19.94,
  },
  {
    member_id: '10012', first_name: 'Patricia', last_name: 'Garcia', department: 'PW',
    tier: 1, hire_date: '2001-08-20', status: 'active', monthly_salary: 9200,
    retirement_status: 'none', years_of_service: 24.51,
  },
  {
    member_id: '10013', first_name: 'James', last_name: 'Anderson', department: 'PW',
    tier: 2, hire_date: '2008-11-01', status: 'active', monthly_salary: 7850,
    retirement_status: 'none', years_of_service: 17.32,
  },
  {
    member_id: '10014', first_name: 'Linda', last_name: 'Brown', department: 'PW',
    tier: 3, hire_date: '2015-04-15', status: 'active', monthly_salary: 6500,
    retirement_status: 'none', years_of_service: 10.86,
  },
  {
    member_id: '10015', first_name: 'William', last_name: 'Davis', department: 'PW',
    tier: 1, hire_date: '1999-01-10', status: 'active', monthly_salary: 11200,
    retirement_status: 'none', years_of_service: 27.13,
  },
  {
    member_id: '10016', first_name: 'Karen', last_name: 'Wilson', department: 'PW',
    tier: 2, hire_date: '2010-06-01', status: 'active', monthly_salary: 8360,
    retirement_status: 'none', years_of_service: 15.73,
  },

  // Parks & Recreation (PR) — 6 employees
  {
    member_id: '10002', first_name: 'Jennifer', last_name: 'Kim', department: 'PR',
    tier: 2, hire_date: '2005-03-15', status: 'active', monthly_salary: 9150,
    retirement_status: 'pending', years_of_service: 20.92,
  },
  {
    member_id: '10017', first_name: 'Richard', last_name: 'Taylor', department: 'PR',
    tier: 1, hire_date: '2000-07-01', status: 'active', monthly_salary: 9800,
    retirement_status: 'none', years_of_service: 25.66,
  },
  {
    member_id: '10018', first_name: 'Susan', last_name: 'Moore', department: 'PR',
    tier: 2, hire_date: '2007-02-15', status: 'active', monthly_salary: 7650,
    retirement_status: 'none', years_of_service: 19.03,
  },
  {
    member_id: '10019', first_name: 'Charles', last_name: 'Jackson', department: 'PR',
    tier: 3, hire_date: '2014-08-01', status: 'active', monthly_salary: 6400,
    retirement_status: 'none', years_of_service: 11.57,
  },
  {
    member_id: '10020', first_name: 'Margaret', last_name: 'White', department: 'PR',
    tier: 2, hire_date: '2009-05-01', status: 'active', monthly_salary: 8200,
    retirement_status: 'none', years_of_service: 16.82,
  },
  {
    member_id: '10021', first_name: 'Daniel', last_name: 'Harris', department: 'PR',
    tier: 1, hire_date: '2003-11-15', status: 'active', monthly_salary: 7000,
    retirement_status: 'none', years_of_service: 22.28,
  },

  // Finance (FIN) — 5 employees
  {
    member_id: '10008', first_name: 'Thomas', last_name: 'Chen', department: 'FIN',
    tier: 3, hire_date: '2018-09-15', status: 'active', monthly_salary: 11200,
    retirement_status: 'none', years_of_service: 7.44,
  },
  {
    member_id: '10022', first_name: 'Nancy', last_name: 'Robinson', department: 'FIN',
    tier: 2, hire_date: '2006-01-15', status: 'active', monthly_salary: 10800,
    retirement_status: 'none', years_of_service: 20.11,
  },
  {
    member_id: '10023', first_name: 'Joseph', last_name: 'Clark', department: 'FIN',
    tier: 1, hire_date: '1998-04-01', status: 'active', monthly_salary: 12500,
    retirement_status: 'none', years_of_service: 27.91,
  },
  {
    member_id: '10024', first_name: 'Betty', last_name: 'Lewis', department: 'FIN',
    tier: 3, hire_date: '2016-07-01', status: 'active', monthly_salary: 8900,
    retirement_status: 'none', years_of_service: 9.65,
  },
  {
    member_id: '10025', first_name: 'Steven', last_name: 'Walker', department: 'FIN',
    tier: 2, hire_date: '2010-10-15', status: 'active', monthly_salary: 8700,
    retirement_status: 'none', years_of_service: 15.37,
  },
]

// ─── Contribution Reports ────────────────────────────────────────────────────

function buildReport(
  id: string, period: string, dept: string, employees: EmployerEmployee[],
  status: ContributionReport['status'],
  overrides?: Partial<ContributionReport>,
): ContributionReport {
  const deptEmployees = employees.filter(e => e.department === dept && e.status === 'active')
  const grossPayroll = deptEmployees.reduce((sum, e) => sum + e.monthly_salary, 0)
  return {
    report_id: id,
    period,
    department: dept,
    employee_count: deptEmployees.length,
    total_gross_payroll: grossPayroll,
    // Contribution rates from RMC §18-407
    total_employee_contributions: Math.round(grossPayroll * EMPLOYEE_RATE * 100) / 100,
    total_employer_contributions: Math.round(grossPayroll * EMPLOYER_RATE * 100) / 100,
    status,
    ...overrides,
  }
}

// Mutable store for contribution reports — same pattern as form-submission-store.ts
const SEED_CONTRIBUTION_REPORTS: ContributionReport[] = [
  // January 2026 — verified
  buildReport('CR-2026-01-PW', '2026-01', 'PW', DEMO_EMPLOYER_EMPLOYEES, 'verified', {
    submitted_at: '2026-02-05T14:30:00Z',
  }),
  buildReport('CR-2026-01-PR', '2026-01', 'PR', DEMO_EMPLOYER_EMPLOYEES, 'verified', {
    submitted_at: '2026-02-04T10:15:00Z',
  }),
  buildReport('CR-2026-01-FIN', '2026-01', 'FIN', DEMO_EMPLOYER_EMPLOYEES, 'verified', {
    submitted_at: '2026-02-03T16:45:00Z',
  }),
  // February 2026 — submitted (awaiting verification)
  buildReport('CR-2026-02-PW', '2026-02', 'PW', DEMO_EMPLOYER_EMPLOYEES, 'submitted', {
    submitted_at: '2026-03-04T09:00:00Z',
  }),
  buildReport('CR-2026-02-PR', '2026-02', 'PR', DEMO_EMPLOYER_EMPLOYEES, 'submitted', {
    submitted_at: '2026-03-05T11:30:00Z',
  }),
  buildReport('CR-2026-02-FIN', '2026-02', 'FIN', DEMO_EMPLOYER_EMPLOYEES, 'submitted', {
    submitted_at: '2026-03-03T15:20:00Z',
  }),
  // March 2026 — draft, one with discrepancy
  buildReport('CR-2026-03-PW', '2026-03', 'PW', DEMO_EMPLOYER_EMPLOYEES, 'draft'),
  buildReport('CR-2026-03-PR', '2026-03', 'PR', DEMO_EMPLOYER_EMPLOYEES, 'discrepancy', {
    discrepancies: [
      {
        member_id: '10019', member_name: 'Charles Jackson',
        field: 'monthly_salary', expected: 6400, actual: 6800,
        severity: 'error',
        message: 'Reported salary $6,800 does not match payroll record $6,400 — verify recent pay action',
      },
      {
        member_id: '10020', member_name: 'Margaret White',
        field: 'employee_contribution', expected: 692.90, actual: 685.50,
        severity: 'warning',
        message: 'Employee contribution $685.50 is $7.40 less than expected at 8.45% rate',
      },
    ],
  }),
  buildReport('CR-2026-03-FIN', '2026-03', 'FIN', DEMO_EMPLOYER_EMPLOYEES, 'draft'),
]

// Mutable copy for runtime additions (upload workflow posts new reports here)
let contributionReportStore = [...SEED_CONTRIBUTION_REPORTS]

/** Reset store to seed data — for test isolation */
export function resetContributionReportStore(): void {
  contributionReportStore = [...SEED_CONTRIBUTION_REPORTS]
}

// Re-export seed data under original name for backward compat with tests
export const DEMO_CONTRIBUTION_REPORTS = SEED_CONTRIBUTION_REPORTS

// ─── Pending Retirements ─────────────────────────────────────────────────────
// Cross-references Cases 1-3 from the demo cases

export const DEMO_PENDING_RETIREMENTS: PendingRetirement[] = [
  {
    member_id: '10001', member_name: 'Robert Martinez', tier: 1,
    department: 'PW', retirement_date: '2026-04-01',
    application_status: 'In Review', documents_complete: true,
    last_day_worked: '2026-03-31', estimated_benefit: 6117.03,
  },
  {
    member_id: '10002', member_name: 'Jennifer Kim', tier: 2,
    department: 'PR', retirement_date: '2026-05-01',
    application_status: 'Documentation', documents_complete: false,
    last_day_worked: '2026-04-30', estimated_benefit: 1992.53,
  },
  {
    member_id: '10003', member_name: 'David Washington', tier: 3,
    department: 'PW', retirement_date: '2026-04-01',
    application_status: 'Initial Review', documents_complete: false,
    last_day_worked: '2026-03-31', estimated_benefit: 1191.64,
  },
]

// ─── Staff Review Types ─────────────────────────────────────────────────────

export interface ContributionReportDetail {
  report: ContributionReport
  rows: import('@/types/Employer').ContributionFileRow[]
}

// ─── Demo API ────────────────────────────────────────────────────────────────

function delay<T>(val: T): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(val), 80))
}

export const employerDemoApi = {
  async getDashboardStats(deptId?: string): Promise<EmployerDashboardStats> {
    const employees = deptId
      ? DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === deptId)
      : DEMO_EMPLOYER_EMPLOYEES
    const active = employees.filter(e => e.status === 'active')
    const pending = deptId
      ? DEMO_PENDING_RETIREMENTS.filter(r => r.department === deptId)
      : DEMO_PENDING_RETIREMENTS
    const totalPayroll = active.reduce((sum, e) => sum + e.monthly_salary, 0)
    const avgYears = active.length > 0
      ? active.reduce((sum, e) => sum + e.years_of_service, 0) / active.length
      : 0

    return delay({
      active_employees: active.length,
      pending_retirements: pending.length,
      monthly_payroll: totalPayroll,
      avg_service_years: Math.round(avgYears * 100) / 100,
      // Rates from RMC §18-407
      contribution_rate_employee: EMPLOYEE_RATE,
      contribution_rate_employer: EMPLOYER_RATE,
    })
  },

  async getEmployees(deptId?: string): Promise<EmployerEmployee[]> {
    const employees = deptId
      ? DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === deptId)
      : DEMO_EMPLOYER_EMPLOYEES
    return delay(employees)
  },

  async getContributionReports(deptId?: string): Promise<ContributionReport[]> {
    const reports = deptId
      ? contributionReportStore.filter(r => r.department === deptId)
      : contributionReportStore
    return delay(reports)
  },

  async addContributionReport(report: ContributionReport): Promise<ContributionReport> {
    contributionReportStore = [report, ...contributionReportStore]
    return delay(report)
  },

  async getPendingRetirements(deptId?: string): Promise<PendingRetirement[]> {
    const retirements = deptId
      ? DEMO_PENDING_RETIREMENTS.filter(r => r.department === deptId)
      : DEMO_PENDING_RETIREMENTS
    return delay(retirements)
  },

  // ── Staff review methods ──────────────────────────────────────────────────

  /** Filter contribution reports to only those with status 'submitted' — feeds staff queue */
  async getSubmittedContributionReports(): Promise<ContributionReport[]> {
    return delay(contributionReportStore.filter(r => r.status === 'submitted'))
  },

  /** Get full report detail + generated row-level employee data for staff review */
  async getContributionReportDetail(reportId: string): Promise<ContributionReportDetail | null> {
    const report = contributionReportStore.find(r => r.report_id === reportId)
    if (!report) return delay(null)
    // Generate row-level data from the same fixtures the employer upload uses
    const { generateCleanFile } = await import('@/api/contribution-csv-fixtures')
    const rows = generateCleanFile(report.department, report.period)
    return delay({ report, rows })
  },

  /** Mutate report status in-place — submitted → verified | discrepancy */
  async updateContributionReportStatus(
    reportId: string,
    status: ContributionReport['status'],
    discrepancies?: ContributionReport['discrepancies'],
  ): Promise<ContributionReport | null> {
    const report = contributionReportStore.find(r => r.report_id === reportId)
    if (!report) return delay(null)
    report.status = status
    if (discrepancies) report.discrepancies = discrepancies
    return delay(report)
  },
}
