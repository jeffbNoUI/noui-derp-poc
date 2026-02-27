/**
 * Remediation phase — validation results table with inline correction and acknowledgment.
 * Most complex sub-component: summary cards, filter toggles, expandable row detail, inline editing.
 * Consumed by: ContributionUpload page
 * Depends on: employerTheme, fmt, Employer types, isReadyToPost
 */
import { useState } from 'react'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { ContributionFileRow, RowValidationResult, ValidationSummary } from '@/types/Employer'
import { isReadyToPost } from '@/lib/contribution-validation'

type Filter = 'all' | 'error' | 'warning' | 'clean'

interface Props {
  rows: ContributionFileRow[]
  results: RowValidationResult[]
  summary: ValidationSummary
  onCorrect: (rowIndex: number, field: string, value: string | number) => void
  onAcknowledge: (rowIndex: number, issueId: string) => void
  onRemoveRow: (rowIndex: number) => void
  onProceed: () => void
}

const STATUS_BADGE: Record<string, { color: string; bg: string }> = {
  clean: { color: T.status.success, bg: T.status.successBg },
  warning: { color: T.status.warning, bg: T.status.warningBg },
  error: { color: T.status.danger, bg: T.status.dangerBg },
}

export function RemediationPhaseView({ rows, results, summary, onCorrect, onAcknowledge, onRemoveRow, onProceed }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [editField, setEditField] = useState<{ row: number; field: string; value: string } | null>(null)

  const filteredIndices = results
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => filter === 'all' || r.status === filter)
    .map(({ i }) => i)

  const resolvedCount = results.reduce((c, r) => {
    const resolved = r.issues.filter(i => i.resolved || r.acknowledged_warnings.includes(i.issue_id)).length
    return c + resolved
  }, 0)
  const totalIssues = summary.total_issues
  const ready = isReadyToPost(results)

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Total Rows', value: summary.total_rows, color: T.text.primary },
          { label: 'Clean', value: summary.clean_rows, color: T.status.success },
          { label: 'Warnings', value: summary.warning_rows, color: T.status.warning },
          { label: 'Errors', value: summary.error_rows, color: T.status.danger },
        ].map(card => (
          <div key={card.label} style={{
            background: T.surface.card, border: `1px solid ${T.border.base}`, borderRadius: 8,
            padding: '12px 16px', boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase', marginBottom: 4 }}>{card.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Resolution progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.text.muted, marginBottom: 4 }}>
          <span>{resolvedCount} of {totalIssues} issues resolved</span>
          <span>{totalIssues > 0 ? Math.round((resolvedCount / totalIssues) * 100) : 100}%</span>
        </div>
        <div style={{ height: 6, background: T.surface.cardAlt, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: ready ? T.status.success : T.accent.primary,
            width: totalIssues > 0 ? `${(resolvedCount / totalIssues) * 100}%` : '100%',
            transition: 'width 0.3s ease',
          }} />
        </div>
      </div>

      {/* Filter toggles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'error', 'warning', 'clean'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${filter === f ? T.accent.primary : T.border.base}`,
              background: filter === f ? T.accent.light : 'transparent',
              color: filter === f ? T.accent.primary : T.text.secondary,
              cursor: 'pointer', textTransform: 'capitalize',
            }}
          >
            {f} {f !== 'all' && `(${f === 'error' ? summary.error_rows : f === 'warning' ? summary.warning_rows : summary.clean_rows})`}
          </button>
        ))}
      </div>

      {/* Data table */}
      <div style={{ background: T.surface.card, border: `1px solid ${T.border.base}`, borderRadius: 10, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 16 }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '50px 80px 1fr 80px 100px 90px',
          gap: 8, padding: '10px 14px', background: T.surface.cardAlt,
          fontSize: 10, fontWeight: 700, color: T.text.muted, textTransform: 'uppercase',
        }}>
          <div>Row</div><div>ID</div><div>Name</div><div>Dept</div><div>Earnings</div><div>Status</div>
        </div>

        {filteredIndices.map(idx => {
          const row = rows[idx]
          const result = results[idx]
          const isExpanded = expandedRow === idx
          const badge = STATUS_BADGE[result.status]

          return (
            <div key={idx}>
              <div
                onClick={() => setExpandedRow(isExpanded ? null : idx)}
                style={{
                  display: 'grid', gridTemplateColumns: '50px 80px 1fr 80px 100px 90px',
                  gap: 8, padding: '10px 14px', cursor: 'pointer',
                  borderTop: `1px solid ${T.border.subtle}`,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.surface.cardAlt }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: 12, color: T.text.muted }}>{idx + 1}</div>
                <div style={{ fontSize: 12, color: T.text.primary, fontFamily: 'monospace' }}>{row.member_id}</div>
                <div style={{ fontSize: 12, color: T.text.primary }}>{row.name}</div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>{row.department}</div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>{fmt(row.pensionable_earnings)}</div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                    fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg,
                    textTransform: 'uppercase',
                  }}>
                    {result.status} {result.issues.length > 0 && `(${result.issues.length})`}
                  </span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && result.issues.length > 0 && (
                <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${T.border.subtle}` }}>
                  {result.issues.map(issue => {
                    const isAcked = issue.resolved || result.acknowledged_warnings.includes(issue.issue_id)
                    const isEditing = editField?.row === idx && editField?.field === issue.field

                    return (
                      <div key={issue.issue_id} style={{
                        display: 'flex', gap: 12, padding: '10px 12px', marginTop: 8, borderRadius: 6,
                        background: isAcked ? T.status.successBg : issue.severity === 'error' ? T.status.dangerBg : T.status.warningBg,
                        border: `1px solid ${isAcked ? 'rgba(22,163,74,0.2)' : issue.severity === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)'}`,
                        opacity: isAcked ? 0.7 : 1,
                      }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                          color: isAcked ? T.status.success : issue.severity === 'error' ? T.status.danger : T.status.warning,
                          background: isAcked ? 'rgba(22,163,74,0.1)' : issue.severity === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                          textTransform: 'uppercase', alignSelf: 'flex-start',
                        }}>
                          {isAcked ? 'resolved' : issue.severity}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: T.text.primary }}>{issue.message}</div>
                          {issue.expected && (
                            <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>
                              Expected: <strong>{issue.expected}</strong> | Actual: <strong>{issue.actual}</strong>
                            </div>
                          )}
                          {/* Action buttons */}
                          {!isAcked && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                              {/* Inline correction for correctable fields */}
                              {issue.field !== 'member_id' && !isEditing && (
                                <button
                                  onClick={e => { e.stopPropagation(); setEditField({ row: idx, field: issue.field, value: issue.expected ?? '' }) }}
                                  style={{
                                    padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                    background: T.accent.primary, color: T.accent.on, border: 'none', cursor: 'pointer',
                                  }}
                                >
                                  Correct
                                </button>
                              )}
                              {isEditing && (
                                <>
                                  <input
                                    value={editField.value}
                                    onChange={e => setEditField({ ...editField, value: e.target.value })}
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                      padding: '4px 8px', borderRadius: 4, fontSize: 11, width: 140,
                                      border: `1px solid ${T.border.active}`, outline: 'none',
                                    }}
                                  />
                                  <button
                                    onClick={e => {
                                      e.stopPropagation()
                                      const numFields = ['pensionable_earnings', 'gross_earnings', 'employee_contribution', 'employer_contribution', 'tier']
                                      const val = numFields.includes(issue.field) ? parseFloat(editField.value) : editField.value
                                      onCorrect(idx, issue.field, val)
                                      setEditField(null)
                                    }}
                                    style={{
                                      padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                      background: T.status.success, color: '#fff', border: 'none', cursor: 'pointer',
                                    }}
                                  >
                                    Apply
                                  </button>
                                </>
                              )}
                              {/* Acknowledge for warnings */}
                              {issue.severity === 'warning' && (
                                <button
                                  onClick={e => { e.stopPropagation(); onAcknowledge(idx, issue.issue_id) }}
                                  style={{
                                    padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                    background: 'transparent', color: T.status.warning,
                                    border: `1px solid ${T.status.warning}`, cursor: 'pointer',
                                  }}
                                >
                                  Acknowledge
                                </button>
                              )}
                              {/* Remove row for unknown members */}
                              {issue.field === 'member_id' && (
                                <button
                                  onClick={e => { e.stopPropagation(); onRemoveRow(idx); setExpandedRow(null) }}
                                  style={{
                                    padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                                    background: T.status.danger, color: '#fff', border: 'none', cursor: 'pointer',
                                  }}
                                >
                                  Remove Row
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Proceed button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onProceed}
          disabled={!ready}
          style={{
            padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            background: ready ? T.accent.primary : T.border.base,
            color: ready ? T.accent.on : T.text.muted,
            border: 'none', cursor: ready ? 'pointer' : 'not-allowed',
          }}
        >
          Proceed to Post
        </button>
      </div>
    </div>
  )
}
