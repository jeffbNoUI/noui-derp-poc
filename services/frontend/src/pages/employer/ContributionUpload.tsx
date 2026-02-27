/**
 * Contribution upload page — orchestrates 4-phase upload/validate/remediate/post workflow.
 * Consumed by: router.tsx (employer/contributions/upload route)
 * Depends on: useContributionUpload reducer, validation engine, CSV fixtures, employer-demo-data, employerTheme
 */
import { useNavigate } from 'react-router-dom'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerTheme as T } from '@/theme'
import { DEMO_EMPLOYER_EMPLOYEES, employerDemoApi } from '@/api/employer-demo-data'
import { DEMO_UPLOAD_FILE } from '@/api/contribution-csv-fixtures'
import {
  validateFile, computeValidationSummary, revalidateRow, resetIssueCounter,
} from '@/lib/contribution-validation'
import { useContributionUpload } from './upload/useContributionUpload'
import { PhaseProgressBar } from './upload/PhaseProgressBar'
import { UploadPhaseView } from './upload/UploadPhaseView'
import { RemediationPhaseView } from './upload/RemediationPhaseView'
import { PostingPhaseView } from './upload/PostingPhaseView'

export function ContributionUpload() {
  const { deptId } = useEmployerAuth()
  const navigate = useNavigate()
  const [state, dispatch] = useContributionUpload()

  // Roster for current department — used by validation engine
  const roster = DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === deptId)

  // ─── Handlers ────────────────────────────────────────────────────────────

  function handleLoadDemo() {
    dispatch({
      type: 'LOAD_FILE',
      metadata: { ...DEMO_UPLOAD_FILE.metadata, uploaded_at: new Date().toISOString() },
      rows: DEMO_UPLOAD_FILE.rows,
    })
  }

  function handleValidate() {
    resetIssueCounter()
    const results = validateFile(state.rows, roster)
    const summary = computeValidationSummary(state.rows, results)
    dispatch({ type: 'SET_VALIDATION_RESULTS', results, summary })
  }

  function handleCorrect(rowIndex: number, field: string, value: string | number) {
    // Apply correction, then re-validate the row
    const corrections = { ...state.validationResults[rowIndex].corrections, [field]: value }
    const originalRow = state.rows[rowIndex]
    const revalidated = revalidateRow(originalRow, corrections, rowIndex, roster)
    const updatedResults = [...state.validationResults]
    updatedResults[rowIndex] = revalidated
    const summary = computeValidationSummary(state.rows, updatedResults)
    dispatch({ type: 'UPDATE_ROW_RESULT', rowIndex, result: revalidated, summary })
  }

  function handleAcknowledge(rowIndex: number, issueId: string) {
    dispatch({ type: 'ACKNOWLEDGE_WARNING', rowIndex, issueId })
  }

  function handleRemoveRow(rowIndex: number) {
    const newRows = state.rows.filter((_, i) => i !== rowIndex)
    const newResults = state.validationResults
      .filter((_, i) => i !== rowIndex)
      .map((r, i) => ({ ...r, row_index: i }))
    const summary = computeValidationSummary(newRows, newResults)
    dispatch({ type: 'REMOVE_ROW', rowIndex, summary })
  }

  function handleProceed() {
    dispatch({ type: 'SET_PHASE', phase: 'posting' })
  }

  async function handlePost() {
    if (!state.metadata || !state.summary) return
    const reportId = `CR-${state.metadata.period}-${state.metadata.department}-${Date.now()}`
    await employerDemoApi.addContributionReport({
      report_id: reportId,
      period: state.metadata.period,
      department: state.metadata.department,
      employee_count: state.summary.total_rows,
      total_gross_payroll: state.summary.total_payroll,
      total_employee_contributions: state.summary.total_ee_contributions,
      total_employer_contributions: state.summary.total_er_contributions,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    dispatch({ type: 'POST_COMPLETE', reportId })
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary }}>
          Upload Contribution Report
        </div>
        {state.phase === 'complete' ? (
          <button
            onClick={() => navigate('/employer/contributions')}
            style={{
              padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: T.accent.primary, color: T.accent.on, border: 'none', cursor: 'pointer',
            }}
          >
            Back to Reports
          </button>
        ) : (
          <button
            onClick={() => navigate('/employer/contributions')}
            style={{
              padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              background: 'transparent', color: T.text.secondary,
              border: `1px solid ${T.border.base}`, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        )}
      </div>

      <PhaseProgressBar phase={state.phase} />

      {/* Phase content */}
      {(state.phase === 'upload' || state.phase === 'validating') && (
        <UploadPhaseView
          metadata={state.metadata}
          onLoadDemo={handleLoadDemo}
          onValidate={handleValidate}
          isValidating={state.phase === 'validating' && state.validationResults.length === 0}
        />
      )}

      {state.phase === 'remediation' && state.summary && (
        <RemediationPhaseView
          rows={state.rows}
          results={state.validationResults}
          summary={state.summary}
          onCorrect={handleCorrect}
          onAcknowledge={handleAcknowledge}
          onRemoveRow={handleRemoveRow}
          onProceed={handleProceed}
        />
      )}

      {(state.phase === 'posting' || state.phase === 'complete') && state.metadata && state.summary && (
        <PostingPhaseView
          metadata={state.metadata}
          summary={state.summary}
          certified={state.certified}
          onCertify={val => dispatch({ type: 'SET_CERTIFIED', certified: val })}
          onPost={handlePost}
          postedReportId={state.postedReportId}
        />
      )}
    </div>
  )
}
