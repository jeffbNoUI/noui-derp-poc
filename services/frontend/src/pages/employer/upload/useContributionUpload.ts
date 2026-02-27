/**
 * Contribution upload reducer — manages 4-phase upload workflow state.
 * Phases: upload → validating → remediation → posting → complete.
 * Consumed by: ContributionUpload page component
 * Depends on: Employer.ts types
 */
import { useReducer } from 'react'
import type {
  ContributionFileRow, ContributionFileMetadata, RowValidationResult, ValidationSummary,
} from '@/types/Employer'

export type UploadPhase = 'upload' | 'validating' | 'remediation' | 'posting' | 'complete'

export interface UploadState {
  phase: UploadPhase
  metadata: ContributionFileMetadata | null
  rows: ContributionFileRow[]
  validationResults: RowValidationResult[]
  summary: ValidationSummary | null
  certified: boolean
  postedReportId: string | null
}

export type UploadAction =
  | { type: 'LOAD_FILE'; metadata: ContributionFileMetadata; rows: ContributionFileRow[] }
  | { type: 'SET_VALIDATION_RESULTS'; results: RowValidationResult[]; summary: ValidationSummary }
  | { type: 'CORRECT_VALUE'; rowIndex: number; field: string; value: string | number }
  | { type: 'ACKNOWLEDGE_WARNING'; rowIndex: number; issueId: string }
  | { type: 'UPDATE_ROW_RESULT'; rowIndex: number; result: RowValidationResult; summary: ValidationSummary }
  | { type: 'REMOVE_ROW'; rowIndex: number; summary: ValidationSummary }
  | { type: 'SET_PHASE'; phase: UploadPhase }
  | { type: 'SET_CERTIFIED'; certified: boolean }
  | { type: 'POST_COMPLETE'; reportId: string }
  | { type: 'RESET' }

const initialState: UploadState = {
  phase: 'upload',
  metadata: null,
  rows: [],
  validationResults: [],
  summary: null,
  certified: false,
  postedReportId: null,
}

function uploadReducer(state: UploadState, action: UploadAction): UploadState {
  switch (action.type) {
    case 'LOAD_FILE':
      return {
        ...state,
        phase: 'validating',
        metadata: action.metadata,
        rows: action.rows,
        validationResults: [],
        summary: null,
      }

    case 'SET_VALIDATION_RESULTS':
      return {
        ...state,
        phase: 'remediation',
        validationResults: action.results,
        summary: action.summary,
      }

    case 'CORRECT_VALUE': {
      // Store correction in the result's corrections map — preserves original row for audit
      const results = [...state.validationResults]
      const r = { ...results[action.rowIndex] }
      r.corrections = { ...r.corrections, [action.field]: action.value }
      results[action.rowIndex] = r
      return { ...state, validationResults: results }
    }

    case 'ACKNOWLEDGE_WARNING': {
      const results = [...state.validationResults]
      const r = { ...results[action.rowIndex] }
      r.acknowledged_warnings = [...r.acknowledged_warnings, action.issueId]
      // Mark the specific issue as resolved
      r.issues = r.issues.map(iss =>
        iss.issue_id === action.issueId ? { ...iss, resolved: true } : iss
      )
      // Re-evaluate row status
      const hasUnresolvedError = r.issues.some(i => i.severity === 'error' && !i.resolved)
      const hasUnresolvedWarning = r.issues.some(i => i.severity === 'warning' && !i.resolved && !r.acknowledged_warnings.includes(i.issue_id))
      r.status = hasUnresolvedError ? 'error' : hasUnresolvedWarning ? 'warning' : 'clean'
      results[action.rowIndex] = r
      return { ...state, validationResults: results }
    }

    case 'UPDATE_ROW_RESULT': {
      const results = [...state.validationResults]
      results[action.rowIndex] = action.result
      return { ...state, validationResults: results, summary: action.summary }
    }

    case 'REMOVE_ROW': {
      const rows = state.rows.filter((_, i) => i !== action.rowIndex)
      const results = state.validationResults
        .filter((_, i) => i !== action.rowIndex)
        .map((r, i) => ({ ...r, row_index: i }))
      return {
        ...state,
        rows,
        validationResults: results,
        summary: action.summary,
        metadata: state.metadata ? { ...state.metadata, row_count: rows.length } : null,
      }
    }

    case 'SET_PHASE':
      return { ...state, phase: action.phase }

    case 'SET_CERTIFIED':
      return { ...state, certified: action.certified }

    case 'POST_COMPLETE':
      return { ...state, phase: 'complete', postedReportId: action.reportId }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

export function useContributionUpload() {
  return useReducer(uploadReducer, initialState)
}

// Export reducer for direct testing
export { uploadReducer, initialState }
