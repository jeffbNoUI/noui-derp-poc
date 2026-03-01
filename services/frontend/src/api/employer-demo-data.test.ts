/**
 * Employer demo data integrity tests — departments, employees, contributions, API filters.
 * Consumed by: vitest
 * Depends on: employer-demo-data.ts, Employer.ts types
 *
 * TOUCHPOINTS for employer-demo-data:
 *   Upstream: Employer.ts types, demo-data.ts member fixtures (shared IDs 10001-10008)
 *   Downstream: EmployerDashboard, EmployeeRoster, ContributionReporting, RetirementCoordination
 *   Shared: fmt()
 */
import { describe, it, expect } from 'vitest'
import {
  DEMO_DEPARTMENTS,
  DEMO_EMPLOYER_EMPLOYEES,
  DEMO_CONTRIBUTION_REPORTS,
  DEMO_PENDING_RETIREMENTS,
  employerDemoApi,
} from './employer-demo-data'

// Contribution rates from C.R.S. §24-51-401
const EMPLOYEE_RATE = 0.0845
const EMPLOYER_RATE = 0.1795

describe('Employer demo data — departments', () => {
  it('has exactly 3 departments', () => {
    expect(DEMO_DEPARTMENTS).toHaveLength(3)
  })

  it('departments have correct codes', () => {
    const codes = DEMO_DEPARTMENTS.map(d => d.code)
    expect(codes).toContain('PW')
    expect(codes).toContain('PR')
    expect(codes).toContain('FIN')
  })

  it('department employee_count matches actual employee data', () => {
    for (const dept of DEMO_DEPARTMENTS) {
      const actual = DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === dept.code).length
      expect(actual).toBe(dept.employee_count)
    }
  })
})

describe('Employer demo data — employees', () => {
  it('has 19 total employees (8 PW + 6 PR + 5 FIN)', () => {
    expect(DEMO_EMPLOYER_EMPLOYEES).toHaveLength(19)
    expect(DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === 'PW')).toHaveLength(8)
    expect(DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === 'PR')).toHaveLength(6)
    expect(DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === 'FIN')).toHaveLength(5)
  })

  it('cross-references existing demo member IDs', () => {
    const ids = DEMO_EMPLOYER_EMPLOYEES.map(e => e.member_id)
    // Cases 1-3 and refund case 2
    expect(ids).toContain('10001')  // Robert Martinez — PW, Tier 1
    expect(ids).toContain('10002')  // Jennifer Kim — PR, Tier 2
    expect(ids).toContain('10003')  // David Washington — PW, Tier 3
    expect(ids).toContain('10008')  // Thomas Chen — FIN, Tier 3
  })

  it('Robert Martinez (10001) is in Public Works, Tier 1', () => {
    const martinez = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === '10001')
    expect(martinez).toBeDefined()
    expect(martinez!.department).toBe('PW')
    expect(martinez!.tier).toBe(1)
    expect(martinez!.first_name).toBe('Robert')
    expect(martinez!.last_name).toBe('Martinez')
  })

  it('Jennifer Kim (10002) is in Parks & Rec, Tier 2', () => {
    const kim = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === '10002')
    expect(kim).toBeDefined()
    expect(kim!.department).toBe('PR')
    expect(kim!.tier).toBe(2)
  })

  it('Thomas Chen (10008) is in Finance, Tier 3', () => {
    const chen = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === '10008')
    expect(chen).toBeDefined()
    expect(chen!.department).toBe('FIN')
    expect(chen!.tier).toBe(3)
  })

  it('all employees have valid status', () => {
    const validStatuses = ['active', 'terminated', 'retired', 'deceased']
    for (const emp of DEMO_EMPLOYER_EMPLOYEES) {
      expect(validStatuses).toContain(emp.status)
    }
  })

  it('all employees have positive salary and years_of_service', () => {
    for (const emp of DEMO_EMPLOYER_EMPLOYEES) {
      expect(emp.monthly_salary).toBeGreaterThan(0)
      expect(emp.years_of_service).toBeGreaterThan(0)
    }
  })
})

describe('Employer demo data — contribution reports', () => {
  it('has 9 reports (3 months x 3 departments)', () => {
    expect(DEMO_CONTRIBUTION_REPORTS).toHaveLength(9)
  })

  it('contribution math: employee contributions = gross_payroll * 8.45%', () => {
    for (const report of DEMO_CONTRIBUTION_REPORTS) {
      const expected = Math.round(report.total_gross_payroll * EMPLOYEE_RATE * 100) / 100
      expect(report.total_employee_contributions).toBeCloseTo(expected, 2)
    }
  })

  it('contribution math: employer contributions = gross_payroll * 17.95%', () => {
    for (const report of DEMO_CONTRIBUTION_REPORTS) {
      const expected = Math.round(report.total_gross_payroll * EMPLOYER_RATE * 100) / 100
      expect(report.total_employer_contributions).toBeCloseTo(expected, 2)
    }
  })

  it('at least one report has discrepancies', () => {
    const withDiscrepancies = DEMO_CONTRIBUTION_REPORTS.filter(
      r => r.discrepancies && r.discrepancies.length > 0
    )
    expect(withDiscrepancies.length).toBeGreaterThanOrEqual(1)
  })

  it('discrepancy report has status "discrepancy"', () => {
    const withDiscrepancies = DEMO_CONTRIBUTION_REPORTS.filter(
      r => r.discrepancies && r.discrepancies.length > 0
    )
    for (const report of withDiscrepancies) {
      expect(report.status).toBe('discrepancy')
    }
  })

  it('all reports have valid status', () => {
    const validStatuses = ['draft', 'submitted', 'verified', 'discrepancy']
    for (const report of DEMO_CONTRIBUTION_REPORTS) {
      expect(validStatuses).toContain(report.status)
    }
  })
})

describe('Employer demo data — pending retirements', () => {
  it('has 3 pending retirements (Cases 1-3)', () => {
    expect(DEMO_PENDING_RETIREMENTS).toHaveLength(3)
  })

  it('includes members 10001, 10002, 10003', () => {
    const ids = DEMO_PENDING_RETIREMENTS.map(r => r.member_id)
    expect(ids).toContain('10001')
    expect(ids).toContain('10002')
    expect(ids).toContain('10003')
  })
})

describe('Employer demo API — filter methods', () => {
  it('getEmployees filters by department', async () => {
    const pwEmployees = await employerDemoApi.getEmployees('PW')
    expect(pwEmployees.every(e => e.department === 'PW')).toBe(true)
    expect(pwEmployees).toHaveLength(8)

    const prEmployees = await employerDemoApi.getEmployees('PR')
    expect(prEmployees.every(e => e.department === 'PR')).toBe(true)
    expect(prEmployees).toHaveLength(6)
  })

  it('getEmployees returns all when no filter', async () => {
    const all = await employerDemoApi.getEmployees()
    expect(all).toHaveLength(19)
  })

  it('getContributionReports filters by department', async () => {
    const finReports = await employerDemoApi.getContributionReports('FIN')
    expect(finReports.every(r => r.department === 'FIN')).toBe(true)
    expect(finReports).toHaveLength(3)
  })

  it('getPendingRetirements filters by department', async () => {
    const pwRetirements = await employerDemoApi.getPendingRetirements('PW')
    expect(pwRetirements.every(r => r.department === 'PW')).toBe(true)
    expect(pwRetirements).toHaveLength(2) // Martinez + Washington
  })

  it('getDashboardStats computes correct values', async () => {
    const stats = await employerDemoApi.getDashboardStats()
    expect(stats.active_employees).toBe(19)
    expect(stats.pending_retirements).toBe(3)
    expect(stats.monthly_payroll).toBeGreaterThan(0)
    expect(stats.avg_service_years).toBeGreaterThan(0)
    // Verify rates from C.R.S. §24-51-401
    expect(stats.contribution_rate_employee).toBe(0.0845)
    expect(stats.contribution_rate_employer).toBe(0.1795)
  })

  it('getDashboardStats filters by department', async () => {
    const finStats = await employerDemoApi.getDashboardStats('FIN')
    expect(finStats.active_employees).toBe(5)
    expect(finStats.pending_retirements).toBe(0) // No finance retirements pending
  })
})
