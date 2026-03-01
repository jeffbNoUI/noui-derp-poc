/**
 * Contribution reporting page — monthly report list with expandable discrepancy details.
 * Consumed by: router.tsx (employer/contributions route)
 * Depends on: employerDemoApi, useEmployerAuth, fmt, employerTheme, Employer types
 */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerDemoApi } from '@/api/employer-demo-data'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { ContributionReport, ContributionFileRow } from '@/types/Employer'
import { DataTable, type Column } from '@/components/shared/DataTable'

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  draft: { color: T.text.muted, bg: T.surface.cardAlt },
  submitted: { color: T.status.info, bg: T.status.infoBg },
  verified: { color: T.status.success, bg: T.status.successBg },
  discrepancy: { color: T.status.danger, bg: T.status.dangerBg },
}

export function ContributionReporting() {
  const { deptId } = useEmployerAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState<ContributionReport[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [copyModalOpen, setCopyModalOpen] = useState(false)
  const [copySource, setCopySource] = useState<string | null>(null)
  const [newPeriod, setNewPeriod] = useState('')
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [memberListReportId, setMemberListReportId] = useState<string | null>(null)
  const [memberRows, setMemberRows] = useState<ContributionFileRow[]>([])

  const loadReports = useCallback(() => {
    employerDemoApi.getContributionReports(deptId).then(setReports)
  }, [deptId])

  useEffect(() => { loadReports() }, [loadReports])

  // Handle verify & submit for draft reports
  const handleVerifySubmit = async (reportId: string) => {
    setSubmittingId(reportId)
    await employerDemoApi.updateContributionReportStatus(reportId, 'submitted')
    // Update local state to reflect the change
    setReports(prev => prev.map(r =>
      r.report_id === reportId
        ? { ...r, status: 'submitted' as const, submitted_at: new Date().toISOString() }
        : r
    ))
    setSubmittingId(null)
  }

  // Toggle member-level row list for a report
  const handleToggleMembers = async (reportId: string) => {
    if (memberListReportId === reportId) {
      setMemberListReportId(null)
      setMemberRows([])
      return
    }
    const detail = await employerDemoApi.getContributionReportDetail(reportId)
    if (detail) {
      setMemberRows(detail.rows)
      setMemberListReportId(reportId)
    }
  }

  // Close member list when collapsing a report
  const handleToggleExpand = (reportId: string) => {
    const next = expandedId === reportId ? null : reportId
    setExpandedId(next)
    if (!next) {
      setMemberListReportId(null)
      setMemberRows([])
    }
  }

  const memberColumns: Column<ContributionFileRow>[] = [
    { key: 'member_id', label: 'ID', sortable: true, width: '70px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'ssn_last4', label: 'SSN Last 4', width: '80px' },
    { key: 'job_classification', label: 'Job Class', sortable: true },
    { key: 'gross_earnings', label: 'Gross ($)', sortable: true, render: r => fmt(r.gross_earnings) },
    { key: 'pensionable_earnings', label: 'Pensionable ($)', sortable: true, render: r => fmt(r.pensionable_earnings) },
    { key: 'employee_contribution', label: 'EE Contrib ($)', sortable: true, render: r => fmt(r.employee_contribution) },
    { key: 'employer_contribution', label: 'ER Contrib ($)', sortable: true, render: r => fmt(r.employer_contribution) },
    {
      key: 'tier', label: 'Tier', sortable: true, width: '50px',
      render: r => (
        <span style={{
          padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 600,
          background: T.surface.cardAlt, color: T.text.secondary,
        }}>T{r.tier}</span>
      ),
    },
    {
      key: 'employment_status', label: 'Status', sortable: true, width: '70px',
      render: r => (
        <span style={{
          fontSize: 10, textTransform: 'uppercase' as const, fontWeight: 600,
          color: r.employment_status === 'active' ? T.status.success : T.text.muted,
        }}>{r.employment_status}</span>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary }}>
          Contribution Reports
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Contribution rates callout — C.R.S. §24-51-401 */}
          <div style={{ fontSize: 11, color: T.text.muted }}>
            Employee: <strong style={{ color: T.text.primary }}>8.45%</strong>
            <span style={{ margin: '0 8px', color: T.border.base }}>|</span>
            Employer: <strong style={{ color: T.text.primary }}>17.95%</strong>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden' }}>
              <button
                onClick={() => navigate('/employer/contributions/upload')}
                style={{
                  padding: '6px 14px', fontSize: 11, fontWeight: 600,
                  background: T.accent.primary, color: T.accent.on, border: 'none', cursor: 'pointer',
                  borderRight: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                Upload Report
              </button>
              <button
                onClick={() => setNewMenuOpen(v => !v)}
                style={{
                  padding: '6px 8px', fontSize: 11,
                  background: T.accent.primary, color: T.accent.on, border: 'none', cursor: 'pointer',
                }}
              >{'\u25BE'}</button>
            </div>
            {newMenuOpen && (
              <>
                <div onClick={() => setNewMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 98 }} />
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4,
                  background: T.surface.card, border: `1px solid ${T.border.base}`,
                  borderRadius: 8, boxShadow: T.shadowLg, zIndex: 99, minWidth: 200,
                  overflow: 'hidden',
                }}>
                  <button onClick={() => { setCopyModalOpen(true); setNewMenuOpen(false) }} style={{
                    display: 'block', width: '100%', textAlign: 'left' as const,
                    padding: '10px 14px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, color: T.text.primary,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface.cardAlt)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ fontWeight: 600 }}>Copy from Prior Report</div>
                    <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>
                      Start with data from a previous period
                    </div>
                  </button>
                  <div style={{ borderTop: `1px solid ${T.border.subtle}` }} />
                  <button onClick={() => { navigate('/employer/contributions/new'); setNewMenuOpen(false) }} style={{
                    display: 'block', width: '100%', textAlign: 'left' as const,
                    padding: '10px 14px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 12, color: T.text.primary,
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface.cardAlt)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <div style={{ fontWeight: 600 }}>Create Blank Report</div>
                    <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>
                      Start a new report from scratch
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
        {reports.map(report => {
          const isExpanded = expandedId === report.report_id
          const style = STATUS_STYLES[report.status] ?? STATUS_STYLES.draft
          const hasDiscrepancies = report.discrepancies && report.discrepancies.length > 0

          return (
            <div
              key={report.report_id}
              style={{
                background: T.surface.card, borderRadius: 10,
                border: `1px solid ${hasDiscrepancies ? T.status.danger : T.border.base}`,
                overflow: 'hidden', boxShadow: T.shadow,
              }}
            >
              {/* Report header row */}
              <div
                onClick={() => handleToggleExpand(report.report_id)}
                style={{
                  display: 'grid', gridTemplateColumns: '80px 80px 1fr 1fr 1fr 70px 90px 90px',
                  alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.surface.cardAlt }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{report.period}</div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>{report.department}</div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>
                  <span style={{ color: T.text.muted, fontSize: 10 }}>Gross: </span>{fmt(report.total_gross_payroll)}
                </div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>
                  <span style={{ color: T.text.muted, fontSize: 10 }}>EE: </span>{fmt(report.total_employee_contributions)}
                </div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>
                  <span style={{ color: T.text.muted, fontSize: 10 }}>ER: </span>{fmt(report.total_employer_contributions)}
                </div>
                <div style={{ fontSize: 12, color: T.text.secondary }}>{report.employee_count} emp</div>
                <div style={{ fontSize: 10, color: T.text.muted }}>
                  {report.submitted_at
                    ? new Date(report.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : '\u2014'}
                </div>
                <div>
                  <span style={{
                    display: 'inline-block', padding: '3px 8px', borderRadius: 10,
                    fontSize: 10, fontWeight: 600, color: style.color, background: style.bg,
                    textTransform: 'uppercase' as const, letterSpacing: 0.3,
                  }}>
                    {report.status}
                  </span>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ borderTop: `1px solid ${T.border.subtle}`, padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: hasDiscrepancies ? 16 : 0 }}>
                    <div>
                      <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 4 }}>Submitted</div>
                      <div style={{ fontSize: 12, color: T.text.primary }}>{report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : 'Not submitted'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 4 }}>Report ID</div>
                      <div style={{ fontSize: 12, color: T.text.primary, fontFamily: 'monospace' }}>{report.report_id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {report.status === 'draft' && (
                        <button
                          onClick={() => handleVerifySubmit(report.report_id)}
                          disabled={submittingId === report.report_id}
                          style={{
                            padding: '8px 16px',
                            background: submittingId === report.report_id ? T.border.subtle : T.accent.primary,
                            color: submittingId === report.report_id ? T.text.muted : '#ffffff',
                            border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
                            cursor: submittingId === report.report_id ? 'default' : 'pointer',
                          }}
                        >
                          {submittingId === report.report_id ? 'Submitting...' : 'Verify & Submit'}
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleMembers(report.report_id)}
                        style={{
                          padding: '8px 16px',
                          background: memberListReportId === report.report_id ? T.surface.cardAlt : 'transparent',
                          color: T.accent.primary, border: `1px solid ${T.accent.primary}`,
                          borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {memberListReportId === report.report_id ? 'Hide Members' : 'View Members'}
                      </button>
                    </div>
                  </div>

                  {/* Member-level rows */}
                  {memberListReportId === report.report_id && memberRows.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.text.primary, marginBottom: 8 }}>
                        Members ({memberRows.length})
                      </div>
                      <DataTable<ContributionFileRow>
                        columns={memberColumns}
                        data={memberRows}
                        colors={{
                          bg: T.surface.bg, card: T.surface.card, border: T.border.subtle,
                          text: T.text.primary, accent: T.accent.primary, hoverBg: T.surface.cardAlt,
                        }}
                      />
                      {/* Summary totals for cross-check */}
                      <div style={{
                        display: 'flex', gap: 24, padding: '10px 12px', marginTop: 8,
                        background: T.surface.cardAlt, borderRadius: 6, fontSize: 11,
                      }}>
                        <div>
                          <span style={{ color: T.text.muted }}>Total Gross: </span>
                          <span style={{ fontWeight: 600, color: T.text.primary }}>
                            {fmt(memberRows.reduce((s, r) => s + r.gross_earnings, 0))}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: T.text.muted }}>Total EE: </span>
                          <span style={{ fontWeight: 600, color: T.text.primary }}>
                            {fmt(memberRows.reduce((s, r) => s + r.employee_contribution, 0))}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: T.text.muted }}>Total ER: </span>
                          <span style={{ fontWeight: 600, color: T.text.primary }}>
                            {fmt(memberRows.reduce((s, r) => s + r.employer_contribution, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Discrepancy details */}
                  {hasDiscrepancies && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.status.danger, marginBottom: 8 }}>
                        Discrepancies ({report.discrepancies!.length})
                      </div>
                      {report.discrepancies!.map((d, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 12, padding: '10px 12px', marginBottom: 6,
                          borderRadius: 6,
                          background: d.severity === 'error' ? T.status.dangerBg : T.status.warningBg,
                          border: `1px solid ${d.severity === 'error' ? 'rgba(220,38,38,0.2)' : 'rgba(217,119,6,0.2)'}`,
                        }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                            color: d.severity === 'error' ? T.status.danger : T.status.warning,
                            background: d.severity === 'error' ? 'rgba(220,38,38,0.1)' : 'rgba(217,119,6,0.1)',
                            textTransform: 'uppercase' as const,
                            alignSelf: 'flex-start' as const,
                          }}>
                            {d.severity}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: T.text.primary, fontWeight: 500 }}>
                              {d.member_name} ({d.member_id}) — {d.field}
                            </div>
                            <div style={{ fontSize: 11, color: T.text.secondary, marginTop: 2 }}>
                              Expected: {fmt(d.expected)} | Actual: {fmt(d.actual)}
                            </div>
                            <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>
                              {d.message}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Copy from Prior Report modal */}
      {copyModalOpen && (
        <>
          <div onClick={() => setCopyModalOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`,
            boxShadow: T.shadowLg, zIndex: 201, width: 420, overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px', borderBottom: `1px solid ${T.border.subtle}`,
              fontSize: 14, fontWeight: 700, color: T.text.primary,
            }}>Copy from Prior Report</div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: 11, color: T.text.muted, textTransform: 'uppercase' as const,
                  letterSpacing: 0.5, fontWeight: 600, marginBottom: 6,
                }}>Source Report</div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {reports.filter(r => r.status === 'verified' || r.status === 'submitted').map(r => (
                    <button key={r.report_id} onClick={() => setCopySource(r.report_id)} style={{
                      padding: '10px 12px', borderRadius: 6, textAlign: 'left' as const,
                      border: `2px solid ${copySource === r.report_id ? T.accent.primary : T.border.subtle}`,
                      background: copySource === r.report_id ? T.accent.surface : T.surface.cardAlt,
                      cursor: 'pointer',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>{r.period}</div>
                      <div style={{ fontSize: 10, color: T.text.muted }}>
                        {r.employee_count} employees &middot; {fmt(r.total_gross_payroll)} gross
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, color: T.text.muted, textTransform: 'uppercase' as const,
                  letterSpacing: 0.5, fontWeight: 600, marginBottom: 6,
                }}>New Period</div>
                <input
                  type="text" placeholder="e.g. 2026-03" value={newPeriod}
                  onChange={e => setNewPeriod(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', fontSize: 13, borderRadius: 6,
                    border: `1px solid ${T.border.base}`, background: T.surface.bg,
                    color: T.text.primary, fontFamily: 'inherit',
                    boxSizing: 'border-box' as const,
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setCopyModalOpen(false); setCopySource(null); setNewPeriod('') }} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12,
                  background: 'transparent', border: `1px solid ${T.border.base}`,
                  color: T.text.secondary, cursor: 'pointer',
                }}>Cancel</button>
                <button onClick={() => {
                  if (copySource && newPeriod) {
                    navigate(`/employer/contributions/new?copy=${copySource}&period=${newPeriod}`)
                  }
                  setCopyModalOpen(false); setCopySource(null); setNewPeriod('')
                }} style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: copySource && newPeriod ? T.accent.primary : T.border.subtle,
                  color: copySource && newPeriod ? T.accent.on : T.text.muted,
                  border: 'none', cursor: copySource && newPeriod ? 'pointer' : 'default',
                }}>Create Report</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
