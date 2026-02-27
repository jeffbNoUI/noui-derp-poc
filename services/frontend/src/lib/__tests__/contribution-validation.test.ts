/**
 * Tests for contribution validation engine — pure function tests.
 * TOUCHPOINTS:
 *   Upstream: Employer.ts types, employer-demo-data.ts (roster fixtures)
 *   Downstream: ContributionUpload page (consumes validation functions)
 *   Shared: EMPLOYEE_RATE/EMPLOYER_RATE constants
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateRow, validateFile, computeValidationSummary, revalidateRow, isReadyToPost,
  EMPLOYEE_RATE, EMPLOYER_RATE, resetIssueCounter,
} from '@/lib/contribution-validation'
import type { ContributionFileRow, RowValidationResult, EmployerEmployee } from '@/types/Employer'

// Minimal roster for testing
const ROSTER: EmployerEmployee[] = [
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
    member_id: '10016', first_name: 'Karen', last_name: 'Wilson', department: 'PW',
    tier: 2, hire_date: '2010-06-01', status: 'active', monthly_salary: 8360,
    retirement_status: 'none', years_of_service: 15.73,
  },
]

function makeCleanRow(emp: EmployerEmployee): ContributionFileRow {
  return {
    member_id: emp.member_id,
    ssn_last4: '1234',
    name: `${emp.first_name} ${emp.last_name}`,
    pay_period_begin: '2026-04-01',
    pay_period_end: '2026-04-30',
    department: emp.department,
    job_classification: 'Test',
    gross_earnings: emp.monthly_salary,
    pensionable_earnings: emp.monthly_salary,
    employee_contribution: Math.round(emp.monthly_salary * EMPLOYEE_RATE * 100) / 100,
    employer_contribution: Math.round(emp.monthly_salary * EMPLOYER_RATE * 100) / 100,
    employment_status: 'active',
    transaction_type: 'regular',
    tier: emp.tier,
  }
}

beforeEach(() => {
  resetIssueCounter()
})

describe('validateRow', () => {
  it('returns clean for a valid row', () => {
    const row = makeCleanRow(ROSTER[0])
    const result = validateRow(row, 0, ROSTER)
    expect(result.status).toBe('clean')
    expect(result.issues).toHaveLength(0)
  })

  it('returns error for unknown member', () => {
    const row = makeCleanRow(ROSTER[0])
    row.member_id = '99999'
    const result = validateRow(row, 0, ROSTER)
    expect(result.status).toBe('error')
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].field).toBe('member_id')
    expect(result.issues[0].severity).toBe('error')
  })

  it('returns warning for name mismatch (case-insensitive)', () => {
    const row = makeCleanRow(ROSTER[0])
    row.name = 'James Andersen' // Misspelling
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'name' && i.severity === 'warning')).toBe(true)
  })

  it('returns error for department mismatch', () => {
    const row = makeCleanRow(ROSTER[0])
    row.department = 'FIN'
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'department' && i.severity === 'error')).toBe(true)
  })

  it('returns error for tier mismatch', () => {
    const row = makeCleanRow(ROSTER[0])
    row.tier = 3
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'tier' && i.severity === 'error')).toBe(true)
  })

  it('returns warning for salary deviation 10-20%', () => {
    const row = makeCleanRow(ROSTER[0]) // monthly_salary = 7850
    row.pensionable_earnings = 8700 // ~10.8% deviation
    row.employee_contribution = Math.round(8700 * EMPLOYEE_RATE * 100) / 100
    row.employer_contribution = Math.round(8700 * EMPLOYER_RATE * 100) / 100
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'pensionable_earnings' && i.severity === 'warning')).toBe(true)
  })

  it('returns error for salary deviation >20%', () => {
    const row = makeCleanRow(ROSTER[0])
    row.pensionable_earnings = 10000 // ~27% deviation from 7850
    row.employee_contribution = Math.round(10000 * EMPLOYEE_RATE * 100) / 100
    row.employer_contribution = Math.round(10000 * EMPLOYER_RATE * 100) / 100
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'pensionable_earnings' && i.severity === 'error')).toBe(true)
  })

  it('returns error for incorrect EE contribution', () => {
    const row = makeCleanRow(ROSTER[1]) // Linda Brown, salary 6500
    row.employee_contribution = 540.00 // Should be 549.25
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'employee_contribution' && i.severity === 'error')).toBe(true)
  })

  it('returns error for incorrect ER contribution', () => {
    const row = makeCleanRow(ROSTER[1])
    row.employer_contribution = 1000 // Should be 1166.75
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.some(i => i.field === 'employer_contribution' && i.severity === 'error')).toBe(true)
  })

  it('accepts contribution within $0.01 tolerance', () => {
    const row = makeCleanRow(ROSTER[0])
    // Add $0.005 (within tolerance)
    row.employee_contribution = Math.round(ROSTER[0].monthly_salary * EMPLOYEE_RATE * 100) / 100 + 0.005
    const result = validateRow(row, 0, ROSTER)
    expect(result.issues.filter(i => i.field === 'employee_contribution')).toHaveLength(0)
  })
})

describe('validateFile', () => {
  it('validates all rows', () => {
    const rows = ROSTER.map(e => makeCleanRow(e))
    const results = validateFile(rows, ROSTER)
    expect(results).toHaveLength(3)
    expect(results.every(r => r.status === 'clean')).toBe(true)
  })

  it('detects duplicate member_id', () => {
    const rows = [makeCleanRow(ROSTER[0]), makeCleanRow(ROSTER[0])]
    const results = validateFile(rows, ROSTER)
    expect(results[1].status).toBe('error')
    expect(results[1].issues.some(i => i.field === 'member_id' && i.message.includes('Duplicate'))).toBe(true)
  })
})

describe('computeValidationSummary', () => {
  it('computes correct counts and totals', () => {
    const rows = ROSTER.map(e => makeCleanRow(e))
    const results: RowValidationResult[] = [
      { row_index: 0, status: 'clean', issues: [], corrections: {}, acknowledged_warnings: [] },
      { row_index: 1, status: 'warning', issues: [{ issue_id: 'ISS-1', field: 'name', severity: 'warning', message: 'test', resolved: false }], corrections: {}, acknowledged_warnings: [] },
      { row_index: 2, status: 'error', issues: [{ issue_id: 'ISS-2', field: 'tier', severity: 'error', message: 'test', resolved: false }], corrections: {}, acknowledged_warnings: [] },
    ]
    const summary = computeValidationSummary(rows, results)
    expect(summary.total_rows).toBe(3)
    expect(summary.clean_rows).toBe(1)
    expect(summary.warning_rows).toBe(1)
    expect(summary.error_rows).toBe(1)
    expect(summary.total_issues).toBe(2)
    expect(summary.total_payroll).toBeCloseTo(ROSTER[0].monthly_salary + ROSTER[1].monthly_salary + ROSTER[2].monthly_salary)
  })
})

describe('revalidateRow', () => {
  it('resolves issues when correction is applied', () => {
    const row = makeCleanRow(ROSTER[0])
    row.department = 'FIN' // Introduce error
    const corrections = { department: 'PW' } // Fix it
    const result = revalidateRow(row, corrections, 0, ROSTER)
    expect(result.status).toBe('clean')
    expect(result.corrections).toEqual(corrections)
  })

  it('preserves corrections in result', () => {
    const row = makeCleanRow(ROSTER[1])
    row.employee_contribution = 540.00
    const corrections = { employee_contribution: Math.round(6500 * EMPLOYEE_RATE * 100) / 100 }
    const result = revalidateRow(row, corrections, 0, ROSTER)
    expect(result.corrections.employee_contribution).toBeDefined()
  })
})

describe('isReadyToPost', () => {
  it('returns true when all rows are clean', () => {
    const results: RowValidationResult[] = [
      { row_index: 0, status: 'clean', issues: [], corrections: {}, acknowledged_warnings: [] },
    ]
    expect(isReadyToPost(results)).toBe(true)
  })

  it('returns false when unresolved errors exist', () => {
    const results: RowValidationResult[] = [
      { row_index: 0, status: 'error', issues: [{ issue_id: 'ISS-1', field: 'tier', severity: 'error', message: 'test', resolved: false }], corrections: {}, acknowledged_warnings: [] },
    ]
    expect(isReadyToPost(results)).toBe(false)
  })

  it('returns true when all errors are resolved', () => {
    const results: RowValidationResult[] = [
      { row_index: 0, status: 'clean', issues: [{ issue_id: 'ISS-1', field: 'tier', severity: 'error', message: 'test', resolved: true }], corrections: {}, acknowledged_warnings: [] },
    ]
    expect(isReadyToPost(results)).toBe(true)
  })

  it('returns false when warnings are not acknowledged', () => {
    const results: RowValidationResult[] = [
      { row_index: 0, status: 'warning', issues: [{ issue_id: 'ISS-1', field: 'name', severity: 'warning', message: 'test', resolved: false }], corrections: {}, acknowledged_warnings: [] },
    ]
    expect(isReadyToPost(results)).toBe(false)
  })

  it('returns true when warnings are acknowledged', () => {
    const results: RowValidationResult[] = [
      { row_index: 0, status: 'warning', issues: [{ issue_id: 'ISS-1', field: 'name', severity: 'warning', message: 'test', resolved: false }], corrections: {}, acknowledged_warnings: ['ISS-1'] },
    ]
    expect(isReadyToPost(results)).toBe(true)
  })

  it('returns true for empty results', () => {
    expect(isReadyToPost([])).toBe(true)
  })
})
