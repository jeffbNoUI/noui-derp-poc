/**
 * Staff contribution review API tests — getSubmittedContributionReports, getContributionReportDetail,
 * updateContributionReportStatus.
 * Consumed by: vitest
 * Depends on: employer-demo-data.ts (employerDemoApi, resetContributionReportStore)
 *
 * TOUCHPOINTS:
 *   Upstream: employer-demo-data.ts, contribution-csv-fixtures.ts, Employer.ts types
 *   Downstream: ContributionQueue, ContributionReview (via useContributionReview hooks)
 *   Shared: resetContributionReportStore()
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { employerDemoApi, resetContributionReportStore } from '../employer-demo-data'

beforeEach(() => {
  resetContributionReportStore()
})

describe('getSubmittedContributionReports', () => {
  it('returns only reports with status "submitted"', async () => {
    const submitted = await employerDemoApi.getSubmittedContributionReports()
    expect(submitted.length).toBeGreaterThan(0)
    for (const r of submitted) {
      expect(r.status).toBe('submitted')
    }
  })

  it('returns 3 submitted reports from seed data (Feb 2026 PW/PR/FIN)', async () => {
    const submitted = await employerDemoApi.getSubmittedContributionReports()
    expect(submitted).toHaveLength(3)
    const depts = submitted.map(r => r.department).sort()
    expect(depts).toEqual(['FIN', 'PR', 'PW'])
  })
})

describe('getContributionReportDetail', () => {
  it('returns report + rows for a valid report ID', async () => {
    const detail = await employerDemoApi.getContributionReportDetail('CR-2026-02-PW')
    expect(detail).not.toBeNull()
    expect(detail!.report.report_id).toBe('CR-2026-02-PW')
    expect(detail!.report.department).toBe('PW')
    expect(detail!.rows.length).toBeGreaterThan(0)
    // All rows should be PW department employees
    for (const row of detail!.rows) {
      expect(row.department).toBe('PW')
    }
  })

  it('returns null for unknown report ID', async () => {
    const detail = await employerDemoApi.getContributionReportDetail('CR-NONEXISTENT')
    expect(detail).toBeNull()
  })

  it('row count matches report employee_count', async () => {
    const detail = await employerDemoApi.getContributionReportDetail('CR-2026-02-PW')
    expect(detail).not.toBeNull()
    expect(detail!.rows.length).toBe(detail!.report.employee_count)
  })
})

describe('updateContributionReportStatus', () => {
  it('changes status from submitted to verified', async () => {
    const result = await employerDemoApi.updateContributionReportStatus('CR-2026-02-PW', 'verified')
    expect(result).not.toBeNull()
    expect(result!.status).toBe('verified')

    // Verify the store was mutated — should no longer appear in submitted list
    const submitted = await employerDemoApi.getSubmittedContributionReports()
    const found = submitted.find(r => r.report_id === 'CR-2026-02-PW')
    expect(found).toBeUndefined()
  })

  it('changes status to discrepancy and attaches discrepancies', async () => {
    const discrepancies = [{
      member_id: '10001', member_name: 'Robert Martinez',
      field: 'monthly_salary', expected: 10639, actual: 11000,
      severity: 'error' as const, message: 'Salary mismatch',
    }]
    const result = await employerDemoApi.updateContributionReportStatus(
      'CR-2026-02-PR', 'discrepancy', discrepancies,
    )
    expect(result).not.toBeNull()
    expect(result!.status).toBe('discrepancy')
    expect(result!.discrepancies).toHaveLength(1)
    expect(result!.discrepancies![0].member_id).toBe('10001')
  })

  it('returns null for unknown report ID', async () => {
    const result = await employerDemoApi.updateContributionReportStatus('CR-NONEXISTENT', 'verified')
    expect(result).toBeNull()
  })
})
