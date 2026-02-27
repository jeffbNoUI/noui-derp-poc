/**
 * Tests for contribution upload reducer — state machine transitions.
 * TOUCHPOINTS:
 *   Upstream: Employer.ts types, useContributionUpload reducer
 *   Downstream: ContributionUpload page (consumes reducer)
 *   Shared: UploadPhase, UploadState, UploadAction types
 */
import { describe, it, expect } from 'vitest'
import { uploadReducer, initialState } from '@/pages/employer/upload/useContributionUpload'
import type { ContributionFileRow, ContributionFileMetadata, RowValidationResult, ValidationSummary } from '@/types/Employer'

const mockMetadata: ContributionFileMetadata = {
  file_name: 'test.csv', file_size_bytes: 1000, row_count: 2,
  period: '2026-04', department: 'PW', uploaded_at: '2026-04-01T00:00:00Z',
}

const mockRows: ContributionFileRow[] = [
  {
    member_id: '10013', ssn_last4: '2345', name: 'James Anderson',
    pay_period_begin: '2026-04-01', pay_period_end: '2026-04-30',
    department: 'PW', job_classification: 'Test', gross_earnings: 7850,
    pensionable_earnings: 7850, employee_contribution: 663.33, employer_contribution: 1409.08,
    employment_status: 'active', transaction_type: 'regular', tier: 2,
  },
]

const mockResults: RowValidationResult[] = [
  { row_index: 0, status: 'clean', issues: [], corrections: {}, acknowledged_warnings: [] },
]

const mockSummary: ValidationSummary = {
  total_rows: 1, clean_rows: 1, warning_rows: 0, error_rows: 0,
  total_issues: 0, total_payroll: 7850, total_ee_contributions: 663.33, total_er_contributions: 1409.08,
}

describe('uploadReducer', () => {
  it('starts in upload phase', () => {
    expect(initialState.phase).toBe('upload')
    expect(initialState.rows).toHaveLength(0)
  })

  it('LOAD_FILE transitions to validating and stores data', () => {
    const state = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: mockMetadata, rows: mockRows })
    expect(state.phase).toBe('validating')
    expect(state.metadata).toEqual(mockMetadata)
    expect(state.rows).toEqual(mockRows)
  })

  it('SET_VALIDATION_RESULTS transitions to remediation', () => {
    const loaded = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: mockMetadata, rows: mockRows })
    const state = uploadReducer(loaded, { type: 'SET_VALIDATION_RESULTS', results: mockResults, summary: mockSummary })
    expect(state.phase).toBe('remediation')
    expect(state.validationResults).toEqual(mockResults)
    expect(state.summary).toEqual(mockSummary)
  })

  it('CORRECT_VALUE stores correction in result', () => {
    const loaded = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: mockMetadata, rows: mockRows })
    const validated = uploadReducer(loaded, { type: 'SET_VALIDATION_RESULTS', results: mockResults, summary: mockSummary })
    const state = uploadReducer(validated, { type: 'CORRECT_VALUE', rowIndex: 0, field: 'tier', value: 3 })
    expect(state.validationResults[0].corrections.tier).toBe(3)
  })

  it('ACKNOWLEDGE_WARNING marks issue as resolved', () => {
    const warningResults: RowValidationResult[] = [{
      row_index: 0, status: 'warning',
      issues: [{ issue_id: 'ISS-1', field: 'name', severity: 'warning', message: 'test', resolved: false }],
      corrections: {}, acknowledged_warnings: [],
    }]
    const warningSummary = { ...mockSummary, warning_rows: 1, clean_rows: 0 }

    const loaded = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: mockMetadata, rows: mockRows })
    const validated = uploadReducer(loaded, { type: 'SET_VALIDATION_RESULTS', results: warningResults, summary: warningSummary })
    const state = uploadReducer(validated, { type: 'ACKNOWLEDGE_WARNING', rowIndex: 0, issueId: 'ISS-1' })
    expect(state.validationResults[0].acknowledged_warnings).toContain('ISS-1')
    expect(state.validationResults[0].issues[0].resolved).toBe(true)
    expect(state.validationResults[0].status).toBe('clean')
  })

  it('REMOVE_ROW removes row and re-indexes', () => {
    const twoRows = [mockRows[0], { ...mockRows[0], member_id: '10014' }]
    const twoResults: RowValidationResult[] = [
      { ...mockResults[0], row_index: 0 },
      { ...mockResults[0], row_index: 1 },
    ]
    const twoSummary = { ...mockSummary, total_rows: 2, clean_rows: 2 }

    const loaded = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: { ...mockMetadata, row_count: 2 }, rows: twoRows })
    const validated = uploadReducer(loaded, { type: 'SET_VALIDATION_RESULTS', results: twoResults, summary: twoSummary })
    const afterRemoveSummary = { ...mockSummary, total_rows: 1, clean_rows: 1 }
    const state = uploadReducer(validated, { type: 'REMOVE_ROW', rowIndex: 0, summary: afterRemoveSummary })
    expect(state.rows).toHaveLength(1)
    expect(state.validationResults).toHaveLength(1)
    expect(state.validationResults[0].row_index).toBe(0)
    expect(state.metadata!.row_count).toBe(1)
  })

  it('SET_PHASE changes phase', () => {
    const state = uploadReducer(initialState, { type: 'SET_PHASE', phase: 'posting' })
    expect(state.phase).toBe('posting')
  })

  it('SET_CERTIFIED toggles certification', () => {
    const state = uploadReducer(initialState, { type: 'SET_CERTIFIED', certified: true })
    expect(state.certified).toBe(true)
  })

  it('POST_COMPLETE transitions to complete with report ID', () => {
    const state = uploadReducer(initialState, { type: 'POST_COMPLETE', reportId: 'CR-2026-04-PW-123' })
    expect(state.phase).toBe('complete')
    expect(state.postedReportId).toBe('CR-2026-04-PW-123')
  })

  it('RESET returns to initial state', () => {
    const loaded = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: mockMetadata, rows: mockRows })
    const state = uploadReducer(loaded, { type: 'RESET' })
    expect(state).toEqual(initialState)
  })

  it('end-to-end: upload → validate → remediate → post', () => {
    let state = uploadReducer(initialState, { type: 'LOAD_FILE', metadata: mockMetadata, rows: mockRows })
    expect(state.phase).toBe('validating')

    state = uploadReducer(state, { type: 'SET_VALIDATION_RESULTS', results: mockResults, summary: mockSummary })
    expect(state.phase).toBe('remediation')

    state = uploadReducer(state, { type: 'SET_PHASE', phase: 'posting' })
    expect(state.phase).toBe('posting')

    state = uploadReducer(state, { type: 'SET_CERTIFIED', certified: true })
    expect(state.certified).toBe(true)

    state = uploadReducer(state, { type: 'POST_COMPLETE', reportId: 'CR-TEST' })
    expect(state.phase).toBe('complete')
    expect(state.postedReportId).toBe('CR-TEST')
  })
})
