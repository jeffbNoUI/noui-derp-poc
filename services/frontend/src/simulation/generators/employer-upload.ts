/**
 * Employer contribution upload generator — drives upload reducer through 4 phases.
 * Simulates clean, warning, and error file quality scenarios.
 * Consumed by: session-generator.ts
 * Depends on: useContributionUpload.ts (uploadReducer), telemetry-types.ts, noise.ts
 */
import {
  uploadReducer, initialState,
} from '@/pages/employer/upload/useContributionUpload.ts'
import type { UploadState, UploadAction } from '@/pages/employer/upload/useContributionUpload.ts'
import type { TelemetryEvent, PersonaProfile } from '../telemetry-types.ts'
import {
  SessionClock, makeEvent, buildSnapshot, resetEventCounter,
} from './generator-utils.ts'
import type { EventContext } from './generator-utils.ts'
import { dwellTime, actionDelay, navDelay, weightedPick } from '../noise.ts'

const UPLOAD_PHASES = ['upload', 'validating', 'remediation', 'posting'] as const

interface UploadFixture {
  department: string
  period: string
  rowCount: number
  fileQuality: 'clean' | 'warnings' | 'errors'
  warningCount: number
  errorCount: number
}

const UPLOAD_FIXTURES: UploadFixture[] = [
  { department: 'PW', period: '2026-03', rowCount: 8, fileQuality: 'clean', warningCount: 0, errorCount: 0 },
  { department: 'PR', period: '2026-03', rowCount: 6, fileQuality: 'warnings', warningCount: 2, errorCount: 0 },
  { department: 'FIN', period: '2026-03', rowCount: 5, fileQuality: 'errors', warningCount: 1, errorCount: 1 },
]

export interface EmployerUploadOptions {
  sessionId: string
  persona: PersonaProfile
  fixtureIndex: number
  rng: () => number
}

export function generateEmployerUploadSession(opts: EmployerUploadOptions): TelemetryEvent[] {
  const { sessionId, persona, fixtureIndex, rng } = opts
  const fixture = UPLOAD_FIXTURES[fixtureIndex % UPLOAD_FIXTURES.length]
  const events: TelemetryEvent[] = []

  resetEventCounter()

  const clock = new SessionClock(Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000))
  const ctx: EventContext = {
    session_id: sessionId,
    portal: 'employer',
    workflow: 'contribution',
    member_id: `dept-${fixture.department}`,
    persona,
    clock,
  }

  const visited = new Set<string>()
  const confirmed = new Set<string>()

  // Drive the reducer
  let state: UploadState = { ...initialState }

  events.push(makeEvent(ctx, 'session_start', {
    department: fixture.department,
    period: fixture.period,
    file_quality: fixture.fileQuality,
  }, buildSnapshot(null, confirmed, visited, clock)))

  // Phase 1: Upload
  visited.add('upload')
  clock.advance(navDelay(rng))
  events.push(makeEvent(ctx, 'upload_phase_enter', {
    phase: 'upload',
  }, buildSnapshot('upload', confirmed, visited, clock)))

  // Simulate file selection and upload
  clock.advance(dwellTime(persona.speed_factor * 0.5, rng))

  // Build synthetic rows and metadata for the reducer
  const mockRows = Array.from({ length: fixture.rowCount }, (_, i) => ({
    member_id: `100${(10 + i).toString().padStart(2, '0')}`,
    ssn_last4: `${1000 + i}`,
    name: `Employee ${i + 1}`,
    pay_period_begin: '2026-03-01',
    pay_period_end: '2026-03-31',
    department: fixture.department,
    job_classification: 'Regular',
    gross_earnings: 6000 + Math.floor(rng() * 4000),
    pensionable_earnings: 6000 + Math.floor(rng() * 4000),
    employee_contribution: 500 + Math.floor(rng() * 300),
    employer_contribution: 1000 + Math.floor(rng() * 600),
    employment_status: 'active' as const,
    transaction_type: 'regular' as const,
    tier: weightedPick([
      { value: 1, weight: 30 },
      { value: 2, weight: 40 },
      { value: 3, weight: 30 },
    ], rng),
  }))

  const loadAction: UploadAction = {
    type: 'LOAD_FILE',
    metadata: {
      file_name: `contributions-${fixture.department}-${fixture.period}.csv`,
      file_size_bytes: fixture.rowCount * 200,
      row_count: fixture.rowCount,
      period: fixture.period,
      department: fixture.department,
      uploaded_at: new Date().toISOString(),
    },
    rows: mockRows,
  }
  state = uploadReducer(state, loadAction)

  events.push(makeEvent(ctx, 'data_load', {
    phase: 'upload',
    row_count: fixture.rowCount,
    file_name: loadAction.metadata.file_name,
  }, buildSnapshot('upload', confirmed, visited, clock)))
  confirmed.add('upload')

  // Phase 2: Validating
  visited.add('validating')
  clock.resetStageTimer()
  clock.advance(navDelay(rng))
  events.push(makeEvent(ctx, 'upload_phase_enter', {
    phase: 'validating',
  }, buildSnapshot('validating', confirmed, visited, clock)))

  // Simulate validation processing time
  clock.advance(1000 + Math.floor(rng() * 2000))

  // Build validation results
  const validationResults = mockRows.map((_, i) => {
    const issues = []
    const isWarningRow = fixture.fileQuality !== 'clean' && i < fixture.warningCount
    const isErrorRow = fixture.fileQuality === 'errors' && i < fixture.errorCount

    if (isErrorRow) {
      issues.push({
        issue_id: `ERR-${i}`,
        field: 'employee_contribution',
        severity: 'error' as const,
        message: 'Contribution amount does not match expected rate',
        resolved: false,
      })
    }
    if (isWarningRow) {
      issues.push({
        issue_id: `WARN-${i}`,
        field: 'gross_earnings',
        severity: 'warning' as const,
        message: 'Salary differs from prior period by more than 10%',
        resolved: false,
      })
    }

    return {
      row_index: i,
      status: isErrorRow ? 'error' as const : isWarningRow ? 'warning' as const : 'clean' as const,
      issues,
      corrections: {},
      acknowledged_warnings: [] as string[],
    }
  })

  const summary = {
    total_rows: fixture.rowCount,
    clean_rows: fixture.rowCount - fixture.warningCount - fixture.errorCount,
    warning_rows: fixture.warningCount,
    error_rows: fixture.errorCount,
    total_issues: fixture.warningCount + fixture.errorCount,
    total_payroll: mockRows.reduce((s, r) => s + r.gross_earnings, 0),
    total_ee_contributions: mockRows.reduce((s, r) => s + r.employee_contribution, 0),
    total_er_contributions: mockRows.reduce((s, r) => s + r.employer_contribution, 0),
  }

  const valAction: UploadAction = {
    type: 'SET_VALIDATION_RESULTS',
    results: validationResults,
    summary,
  }
  state = uploadReducer(state, valAction)
  confirmed.add('validating')

  events.push(makeEvent(ctx, 'data_load', {
    phase: 'validating',
    clean_rows: summary.clean_rows,
    warning_rows: summary.warning_rows,
    error_rows: summary.error_rows,
  }, buildSnapshot('validating', confirmed, visited, clock)))

  // Phase 3: Remediation
  visited.add('remediation')
  clock.resetStageTimer()
  clock.advance(navDelay(rng))
  events.push(makeEvent(ctx, 'upload_phase_enter', {
    phase: 'remediation',
  }, buildSnapshot('remediation', confirmed, visited, clock)))

  // Process issues
  if (fixture.fileQuality !== 'clean') {
    // Review each issue
    for (let i = 0; i < validationResults.length; i++) {
      const result = validationResults[i]
      for (const issue of result.issues) {
        clock.advance(dwellTime(persona.speed_factor * 0.4, rng))
        events.push(makeEvent(ctx, 'data_inspect', {
          phase: 'remediation',
          row_index: i,
          issue_id: issue.issue_id,
          severity: issue.severity,
        }, buildSnapshot('remediation', confirmed, visited, clock)))

        if (issue.severity === 'error') {
          // Correct the error
          clock.advance(actionDelay(rng))
          state = uploadReducer(state, {
            type: 'CORRECT_VALUE',
            rowIndex: i,
            field: issue.field,
            value: 500,
          })
          events.push(makeEvent(ctx, 'analyst_input', {
            phase: 'remediation',
            row_index: i,
            field: issue.field,
            action: 'correct',
          }, buildSnapshot('remediation', confirmed, visited, clock)))
        } else {
          // Acknowledge warning
          clock.advance(actionDelay(rng))
          state = uploadReducer(state, {
            type: 'ACKNOWLEDGE_WARNING',
            rowIndex: i,
            issueId: issue.issue_id,
          })
          events.push(makeEvent(ctx, 'analyst_input', {
            phase: 'remediation',
            row_index: i,
            issue_id: issue.issue_id,
            action: 'acknowledge',
          }, buildSnapshot('remediation', confirmed, visited, clock)))
        }
      }
    }
  } else {
    // Clean file — quick review
    clock.advance(dwellTime(persona.speed_factor * 0.3, rng))
  }

  confirmed.add('remediation')

  // Certify
  state = uploadReducer(state, { type: 'SET_CERTIFIED', certified: true })
  clock.advance(actionDelay(rng))

  // Phase 4: Posting
  visited.add('posting')
  clock.resetStageTimer()
  state = uploadReducer(state, { type: 'SET_PHASE', phase: 'posting' })
  clock.advance(navDelay(rng))
  events.push(makeEvent(ctx, 'upload_phase_enter', {
    phase: 'posting',
  }, buildSnapshot('posting', confirmed, visited, clock)))

  clock.advance(1500 + Math.floor(rng() * 2000))

  // Complete
  const reportId = `CR-${fixture.period}-${fixture.department}`
  state = uploadReducer(state, { type: 'POST_COMPLETE', reportId })
  confirmed.add('posting')

  events.push(makeEvent(ctx, 'save_complete', {
    report_id: reportId,
    department: fixture.department,
    period: fixture.period,
  }, buildSnapshot('posting', confirmed, visited, clock)))

  events.push(makeEvent(ctx, 'session_complete', {
    total_phases: UPLOAD_PHASES.length,
    duration_ms: clock.elapsed(),
    file_quality: fixture.fileQuality,
    issues_resolved: fixture.warningCount + fixture.errorCount,
  }, buildSnapshot(null, confirmed, visited, clock)))

  return events
}
