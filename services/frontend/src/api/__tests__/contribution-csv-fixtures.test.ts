/**
 * Tests for contribution CSV demo fixtures — shape validation and injected issues.
 * TOUCHPOINTS:
 *   Upstream: Employer.ts types, employer-demo-data.ts (DEMO_EMPLOYER_EMPLOYEES roster)
 *   Downstream: ContributionUpload page (loads fixtures for demo mode)
 *   Shared: EMPLOYEE_RATE, EMPLOYER_RATE constants
 */
import { describe, it, expect } from 'vitest'
import { generateCleanFile, generateFileWithIssues, DEMO_UPLOAD_FILE } from '@/api/contribution-csv-fixtures'
import { DEMO_EMPLOYER_EMPLOYEES } from '@/api/employer-demo-data'

const EMPLOYEE_RATE = 0.0845
const EMPLOYER_RATE = 0.1795

describe('generateCleanFile', () => {
  it('generates rows for all active PW employees', () => {
    const rows = generateCleanFile('PW', '2026-04')
    const pwActive = DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === 'PW' && e.status === 'active')
    expect(rows).toHaveLength(pwActive.length)
  })

  it('all rows have correct contribution math', () => {
    const rows = generateCleanFile('PW', '2026-04')
    for (const row of rows) {
      const expectedEE = Math.round(row.pensionable_earnings * EMPLOYEE_RATE * 100) / 100
      const expectedER = Math.round(row.pensionable_earnings * EMPLOYER_RATE * 100) / 100
      expect(row.employee_contribution).toBeCloseTo(expectedEE, 2)
      expect(row.employer_contribution).toBeCloseTo(expectedER, 2)
    }
  })

  it('member IDs match roster', () => {
    const rows = generateCleanFile('PW', '2026-04')
    for (const row of rows) {
      const emp = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === row.member_id)
      expect(emp).toBeDefined()
      expect(row.department).toBe(emp!.department)
    }
  })

  it('pay period dates are within the correct month', () => {
    const rows = generateCleanFile('PR', '2026-03')
    for (const row of rows) {
      expect(row.pay_period_begin).toBe('2026-03-01')
      expect(row.pay_period_end).toBe('2026-03-31')
    }
  })
})

describe('generateFileWithIssues', () => {
  it('has more rows than clean file (adds unknown member)', () => {
    const clean = generateCleanFile('PW', '2026-04')
    const issues = generateFileWithIssues('PW', '2026-04')
    expect(issues.length).toBe(clean.length + 1)
  })

  it('includes unknown member 99999', () => {
    const rows = generateFileWithIssues('PW', '2026-04')
    expect(rows.some(r => r.member_id === '99999')).toBe(true)
  })

  it('has salary mismatch for James Anderson (10013)', () => {
    const rows = generateFileWithIssues('PW', '2026-04')
    const anderson = rows.find(r => r.member_id === '10013')
    expect(anderson).toBeDefined()
    expect(anderson!.pensionable_earnings).toBe(8400) // Expected 7850
  })

  it('has bad EE contribution for Linda Brown (10014)', () => {
    const rows = generateFileWithIssues('PW', '2026-04')
    const brown = rows.find(r => r.member_id === '10014')
    expect(brown).toBeDefined()
    expect(brown!.employee_contribution).toBe(540.00) // Should be 549.25
  })

  it('has name typo for Karen Wilson (10016)', () => {
    const rows = generateFileWithIssues('PW', '2026-04')
    const wilson = rows.find(r => r.member_id === '10016')
    expect(wilson).toBeDefined()
    expect(wilson!.name).toBe('Karen Willson')
  })
})

describe('DEMO_UPLOAD_FILE', () => {
  it('has valid metadata shape', () => {
    expect(DEMO_UPLOAD_FILE.metadata.file_name).toBe('PW_contributions_2026-04.csv')
    expect(DEMO_UPLOAD_FILE.metadata.period).toBe('2026-04')
    expect(DEMO_UPLOAD_FILE.metadata.department).toBe('PW')
    expect(DEMO_UPLOAD_FILE.metadata.row_count).toBe(DEMO_UPLOAD_FILE.rows.length)
    expect(DEMO_UPLOAD_FILE.metadata.file_size_bytes).toBeGreaterThan(0)
    expect(DEMO_UPLOAD_FILE.metadata.uploaded_at).toBeTruthy()
  })

  it('rows array is not empty', () => {
    expect(DEMO_UPLOAD_FILE.rows.length).toBeGreaterThan(0)
  })
})
