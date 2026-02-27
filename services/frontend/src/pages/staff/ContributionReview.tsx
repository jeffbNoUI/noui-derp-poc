/**
 * Staff contribution report review — detailed view with employee data, validation, and actions.
 * Follows SubmissionReview.tsx pattern: header + metadata grid + detail table + validation + actions.
 * Consumed by: router.tsx (/staff/contributions/:reportId)
 * Depends on: useContributionReportDetail, useUpdateReportStatus, validateFile, computeValidationSummary,
 *             DEMO_EMPLOYER_EMPLOYEES, DataTable, Badge, C theme, fmt
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { C } from '@/theme'
import { fmt } from '@/lib/constants'
import { Badge } from '@/components/shared/Badge'
import { DataTable } from '@/components/shared/DataTable'
import { useContributionReportDetail, useUpdateReportStatus, useSubmittedReports } from '@/hooks/useContributionReview'
import { validateFile, computeValidationSummary } from '@/lib/contribution-validation'
import { DEMO_EMPLOYER_EMPLOYEES } from '@/api/employer-demo-data'
import type { ContributionFileRow, ValidationSummary, RowValidationResult } from '@/types/Employer'

const DEPT_NAMES: Record<string, string> = {
  PW: 'Public Works',
  PR: 'Parks & Recreation',
  FIN: 'Finance',
}

const STATUS_BADGE: Record<string, { text: string; color: string; bg: string }> = {
  submitted: { text: 'New', color: '#16a34a', bg: '#dcfce720' },
  verified: { text: 'Verified', color: '#0d9488', bg: '#0d948820' },
  discrepancy: { text: 'Discrepancy', color: '#dc2626', bg: '#dc262620' },
}

// Contribution rates from RMC §18-407
const EMPLOYEE_RATE = 0.0845
const EMPLOYER_RATE = 0.1795

export function ContributionReview() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const { data: detail, isLoading } = useContributionReportDetail(reportId || '')
  const updateStatus = useUpdateReportStatus()
  const { data: submittedReports } = useSubmittedReports()
  const [actionTaken, setActionTaken] = useState('')
  const [allComplete, setAllComplete] = useState(false)
  const [flagNote, setFlagNote] = useState('')
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [validationResult, setValidationResult] = useState<{ summary: ValidationSummary; results: RowValidationResult[] } | null>(null)

  // Auto-navigate to staff home when all submitted reports have been processed
  useEffect(() => {
    if (!allComplete) return
    const timer = setTimeout(() => navigate('/staff'), 2500)
    return () => clearTimeout(timer)
  }, [allComplete, navigate])

  if (isLoading) {
    return <div style={{ flex: 1, padding: 40, textAlign: 'center' as const, color: C.textMuted }}>Loading...</div>
  }

  if (!detail) {
    return (
      <div style={{ flex: 1, padding: 40, textAlign: 'center' as const }}>
        <div style={{ color: C.textMuted, marginBottom: 12 }}>Report not found.</div>
        <button onClick={() => navigate('/staff/contributions')} style={{
          padding: '6px 16px', borderRadius: 6, border: `1px solid ${C.border}`,
          background: 'transparent', color: C.textSecondary, fontSize: 11, cursor: 'pointer',
        }}>Back</button>
      </div>
    )
  }

  const { report, rows } = detail
  const deptName = DEPT_NAMES[report.department] || report.department
  const badge = STATUS_BADGE[report.status] || { text: report.status, color: C.textMuted, bg: `${C.textMuted}20` }

  const handleAction = async (action: string) => {
    if (action === 'verify') {
      await updateStatus.mutateAsync({ reportId: report.report_id, status: 'verified' })
    } else if (action === 'flag') {
      await updateStatus.mutateAsync({ reportId: report.report_id, status: 'discrepancy' })
      setShowFlagInput(false)
    }
    setActionTaken(action)
    // Check if this was the last submitted report — remaining count excludes current report
    const remaining = (submittedReports || []).filter(r => r.report_id !== report.report_id)
    if (remaining.length === 0) {
      setAllComplete(true)
    }
  }

  const handleRunValidation = () => {
    const results = validateFile(rows, DEMO_EMPLOYER_EMPLOYEES)
    const summary = computeValidationSummary(rows, results)
    setValidationResult({ summary, results })
  }

  // Employee detail table columns
  const employeeColumns = [
    {
      key: 'member_id', label: 'Member ID', width: '90px',
      render: (row: ContributionFileRow) => (
        <span style={{ fontWeight: 600, color: C.text, fontSize: 11 }}>{row.member_id}</span>
      ),
    },
    {
      key: 'name', label: 'Name',
      render: (row: ContributionFileRow) => (
        <span style={{ color: C.text, fontSize: 11 }}>{row.name}</span>
      ),
    },
    {
      key: 'tier', label: 'Tier', width: '60px',
      render: (row: ContributionFileRow) => {
        const colors: Record<number, { color: string; bg: string }> = {
          1: { color: '#3b82f6', bg: '#3b82f620' },
          2: { color: '#8b5cf6', bg: '#8b5cf620' },
          3: { color: '#f59e0b', bg: '#f59e0b20' },
        }
        const tc = colors[row.tier] || { color: C.textMuted, bg: `${C.textMuted}20` }
        return <Badge text={`T${row.tier}`} color={tc.color} bg={tc.bg} />
      },
    },
    {
      key: 'pensionable_earnings', label: 'Pensionable', sortable: true,
      render: (row: ContributionFileRow) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{fmt(row.pensionable_earnings)}</span>
      ),
    },
    {
      key: 'employee_contribution', label: 'EE Contrib',
      render: (row: ContributionFileRow) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{fmt(row.employee_contribution)}</span>
      ),
    },
    {
      key: 'employer_contribution', label: 'ER Contrib',
      render: (row: ContributionFileRow) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{fmt(row.employer_contribution)}</span>
      ),
    },
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <button onClick={() => navigate('/staff/contributions')} style={{
              fontSize: 10, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, display: 'block',
            }}>&larr; Back to Contribution Reports</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {deptName} — {report.period}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>{report.report_id}</div>
          </div>
          <Badge text={badge.text} color={badge.color} bg={badge.bg} />
        </div>

        {/* Action taken toast */}
        {actionTaken && (
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 16,
            background: actionTaken === 'verify' ? '#0d948820' : '#dc262620',
            borderLeft: `3px solid ${actionTaken === 'verify' ? '#0d9488' : '#dc2626'}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: actionTaken === 'verify' ? '#0d9488' : '#dc2626' }}>
              {actionTaken === 'verify' ? 'Report verified.' : 'Report flagged with discrepancy.'}
            </span>
          </div>
        )}

        {/* All tasks complete — auto-redirects to staff home */}
        {allComplete && (
          <div style={{
            padding: '16px 20px', borderRadius: 8, marginBottom: 16,
            background: '#16a34a15', border: '1px solid #16a34a40',
            textAlign: 'center' as const,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>All Tasks Complete.</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Returning to Staff Workspace...</div>
          </div>
        )}

        {/* Metadata grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Submitted', report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : '\u2014'],
            ['Employees', String(report.employee_count)],
            ['Gross Payroll', fmt(report.total_gross_payroll)],
            ['EE Contributions', fmt(report.total_employee_contributions)],
            ['ER Contributions', fmt(report.total_employer_contributions)],
            ['Rates', `${(EMPLOYEE_RATE * 100).toFixed(2)}% / ${(EMPLOYER_RATE * 100).toFixed(2)}%`],
          ].map(([label, val]) => (
            <div key={label as string} style={{ padding: '10px 14px', background: C.surface, borderRadius: 8, border: `1px solid ${C.borderSubtle}` }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Employee detail table */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8 }}>Employee Details</div>
          <DataTable
            columns={employeeColumns}
            data={rows}
            emptyMessage="No employee data"
            colors={{ bg: C.bg, card: C.surface, border: C.borderSubtle, text: C.text, accent: C.accent, hoverBg: `${C.accent}10` }}
          />
        </div>

        {/* Validation section */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Validation</div>
            <button onClick={handleRunValidation} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 10, fontWeight: 600,
              border: `1px solid ${C.accent}`, background: C.accentMuted, color: C.accent, cursor: 'pointer',
            }}>Run Validation</button>
          </div>

          {validationResult && (
            <div>
              {/* Summary counts */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                {[
                  { label: 'Clean', count: validationResult.summary.clean_rows, color: '#16a34a' },
                  { label: 'Warnings', count: validationResult.summary.warning_rows, color: '#f59e0b' },
                  { label: 'Errors', count: validationResult.summary.error_rows, color: '#dc2626' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '8px 16px', borderRadius: 8, background: `${s.color}10`,
                    border: `1px solid ${s.color}30`,
                  }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.count}</span>
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 6 }}>{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Issue cards */}
              {validationResult.results
                .filter(r => r.issues.length > 0)
                .map(r => (
                  <div key={r.row_index} style={{
                    background: C.surface, borderRadius: 8, border: `1px solid ${C.borderSubtle}`,
                    padding: '12px 16px', marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 6 }}>
                      Row {r.row_index + 1} — {rows[r.row_index]?.name || 'Unknown'}
                    </div>
                    {r.issues.map((issue, i) => (
                      <div key={i} style={{
                        fontSize: 11, color: issue.severity === 'error' ? '#dc2626' : '#f59e0b',
                        padding: '4px 0', borderTop: i > 0 ? `1px solid ${C.borderSubtle}` : undefined,
                      }}>
                        <Badge
                          text={issue.severity}
                          color={issue.severity === 'error' ? '#dc2626' : '#f59e0b'}
                          bg={issue.severity === 'error' ? '#dc262620' : '#f59e0b20'}
                        />
                        <span style={{ marginLeft: 8, color: C.textSecondary }}>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                ))}

              {validationResult.summary.total_issues === 0 && (
                <div style={{ padding: 16, background: '#16a34a10', borderRadius: 8, border: '1px solid #16a34a30' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>
                    All rows pass validation. Report is ready for verification.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons — same pattern as SubmissionReview:161-175 */}
        {(report.status === 'submitted') && (
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' as const }}>
            <button onClick={() => handleAction('verify')} style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: 'none', background: '#0d9488', color: '#fff', cursor: 'pointer',
            }}>Verify Report</button>
            <button onClick={() => setShowFlagInput(!showFlagInput)} style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: '1px solid #dc2626', background: 'transparent', color: '#dc2626', cursor: 'pointer',
            }}>Flag Discrepancy</button>
          </div>
        )}

        {/* Flag discrepancy inline textarea */}
        {showFlagInput && (
          <div style={{ marginTop: 12 }}>
            <textarea
              value={flagNote}
              onChange={e => setFlagNote(e.target.value)}
              placeholder="Describe the discrepancy..."
              style={{
                width: '100%', minHeight: 60, padding: '8px 12px', borderRadius: 6,
                border: `1px solid ${C.border}`, background: C.surface, color: C.text,
                fontSize: 11, resize: 'vertical' as const, fontFamily: 'inherit',
              }}
            />
            <button onClick={() => handleAction('flag')} style={{
              marginTop: 8, padding: '6px 16px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer',
            }}>Submit Flag</button>
          </div>
        )}
      </div>
    </div>
  )
}
