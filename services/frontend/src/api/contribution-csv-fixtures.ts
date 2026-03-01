/**
 * Demo CSV fixtures for contribution file upload — generates realistic rows from employer roster.
 * Consumed by: ContributionUpload page (demo mode), contribution-csv-fixtures.test.ts
 * Depends on: Employer.ts types, employer-demo-data.ts (DEMO_EMPLOYER_EMPLOYEES roster)
 */
import type { ContributionFileRow, ContributionFileMetadata } from '@/types/Employer'
import { DEMO_EMPLOYER_EMPLOYEES } from '@/api/employer-demo-data'

// Contribution rates from C.R.S. §24-51-401
const EMPLOYEE_RATE = 0.0845
const EMPLOYER_RATE = 0.1795

// SSN last-4 lookup — deterministic fake values for demo members
const SSN_LAST4: Record<string, string> = {
  '10001': '4521', '10003': '8734', '10011': '3156', '10012': '6789',
  '10013': '2345', '10014': '5678', '10015': '9012', '10016': '1234',
  '10002': '7890', '10017': '4567', '10018': '0123', '10019': '3456',
  '10020': '6780', '10021': '9013', '10008': '2346', '10022': '5679',
  '10023': '8901', '10024': '1235', '10025': '4568',
}

// Job classifications by department — realistic Denver government titles
const JOB_CLASS: Record<string, string[]> = {
  PW: ['Streets Supervisor', 'Equipment Operator', 'Maintenance Tech', 'Traffic Engineer', 'Fleet Manager', 'Project Coordinator', 'Admin Specialist', 'Inspector'],
  PR: ['Recreation Director', 'Park Ranger', 'Grounds Supervisor', 'Program Coord', 'Aquatics Mgr', 'Admin Assistant'],
  FIN: ['Budget Analyst', 'Accountant III', 'Controller', 'Revenue Specialist', 'Payroll Lead'],
}

/** Build a clean contribution row from an employee record */
function buildRow(
  emp: typeof DEMO_EMPLOYER_EMPLOYEES[number],
  period: string,
  jobIndex: number,
): ContributionFileRow {
  const jobs = JOB_CLASS[emp.department] ?? ['General']
  const ee = Math.round(emp.monthly_salary * EMPLOYEE_RATE * 100) / 100
  const er = Math.round(emp.monthly_salary * EMPLOYER_RATE * 100) / 100
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()

  return {
    member_id: emp.member_id,
    ssn_last4: SSN_LAST4[emp.member_id] ?? '0000',
    name: `${emp.first_name} ${emp.last_name}`,
    pay_period_begin: `${period}-01`,
    pay_period_end: `${period}-${lastDay}`,
    department: emp.department,
    job_classification: jobs[jobIndex % jobs.length],
    gross_earnings: emp.monthly_salary,
    pensionable_earnings: emp.monthly_salary,
    employee_contribution: ee,
    employer_contribution: er,
    employment_status: 'active',
    transaction_type: 'regular',
    tier: emp.tier,
  }
}

/**
 * Generate a clean contribution file — all rows pass validation.
 */
export function generateCleanFile(department: string, period: string): ContributionFileRow[] {
  return DEMO_EMPLOYER_EMPLOYEES
    .filter(e => e.department === department && e.status === 'active')
    .map((emp, i) => buildRow(emp, period, i))
}

/**
 * Generate a file with 4 intentional issues for demo remediation workflow.
 * Issues:
 *   1. Member 10013 (James Anderson) — salary $8,400 vs expected $7,850 (>10% → error)
 *   2. Member 10014 (Linda Brown) — EE contribution $540.00 vs expected $549.25 (math error)
 *   3. Member 10016 (Karen Wilson) — last name "Willson" (spelling → warning)
 *   4. Member 99999 — unknown member not in roster (→ error)
 */
export function generateFileWithIssues(department: string, period: string): ContributionFileRow[] {
  const rows = generateCleanFile(department, period)

  // Issue 1: Salary mismatch for James Anderson (10013)
  const anderson = rows.find(r => r.member_id === '10013')
  if (anderson) {
    anderson.pensionable_earnings = 8400
    anderson.gross_earnings = 8400
    // Recalculate contributions with the wrong salary
    anderson.employee_contribution = Math.round(8400 * EMPLOYEE_RATE * 100) / 100
    anderson.employer_contribution = Math.round(8400 * EMPLOYER_RATE * 100) / 100
  }

  // Issue 2: Bad EE contribution for Linda Brown (10014) — intentionally wrong math
  const brown = rows.find(r => r.member_id === '10014')
  if (brown) {
    brown.employee_contribution = 540.00 // Should be 6500 × 0.0845 = 549.25
  }

  // Issue 3: Name typo for Karen Wilson (10016)
  const wilson = rows.find(r => r.member_id === '10016')
  if (wilson) {
    wilson.name = 'Karen Willson' // Extra 'l'
  }

  // Issue 4: Unknown member
  const [year, month] = period.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  rows.push({
    member_id: '99999',
    ssn_last4: '0000',
    name: 'Ghost Employee',
    pay_period_begin: `${period}-01`,
    pay_period_end: `${period}-${lastDay}`,
    department,
    job_classification: 'Unknown',
    gross_earnings: 5000,
    pensionable_earnings: 5000,
    employee_contribution: Math.round(5000 * EMPLOYEE_RATE * 100) / 100,
    employer_contribution: Math.round(5000 * EMPLOYER_RATE * 100) / 100,
    employment_status: 'active',
    transaction_type: 'regular',
    tier: 2,
  })

  return rows
}

/** Pre-built demo file: Public Works, April 2026, with 4 issues */
export const DEMO_UPLOAD_FILE: { rows: ContributionFileRow[]; metadata: ContributionFileMetadata } = (() => {
  const rows = generateFileWithIssues('PW', '2026-04')
  return {
    rows,
    metadata: {
      file_name: 'PW_contributions_2026-04.csv',
      file_size_bytes: rows.length * 180, // ~180 bytes per CSV row
      row_count: rows.length,
      period: '2026-04',
      department: 'PW',
      uploaded_at: new Date().toISOString(),
    },
  }
})()
