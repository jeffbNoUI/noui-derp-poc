/**
 * Contribution reporting page — monthly report list with expandable discrepancy details.
 * Consumed by: router.tsx (employer/contributions route)
 * Depends on: employerDemoApi, useEmployerAuth, fmt, employerTheme, Employer types
 */
import { useState, useEffect } from 'react'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerDemoApi } from '@/api/employer-demo-data'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { ContributionReport } from '@/types/Employer'

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  draft: { color: T.text.muted, bg: T.surface.cardAlt },
  submitted: { color: T.status.info, bg: T.status.infoBg },
  verified: { color: T.status.success, bg: T.status.successBg },
  discrepancy: { color: T.status.danger, bg: T.status.dangerBg },
}

export function ContributionReporting() {
  const { deptId } = useEmployerAuth()
  const [reports, setReports] = useState<ContributionReport[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    employerDemoApi.getContributionReports(deptId).then(setReports)
  }, [deptId])

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary }}>
          Contribution Reports
        </div>
        {/* Contribution rates callout — RMC §18-407 */}
        <div style={{ fontSize: 11, color: T.text.muted }}>
          Employee: <strong style={{ color: T.text.primary }}>8.45%</strong>
          <span style={{ margin: '0 8px', color: T.border.base }}>|</span>
          Employer: <strong style={{ color: T.text.primary }}>17.95%</strong>
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
                onClick={() => setExpandedId(isExpanded ? null : report.report_id)}
                style={{
                  display: 'grid', gridTemplateColumns: '100px 100px 1fr 1fr 1fr 90px 90px',
                  alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer',
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
                    <div>
                      {report.status === 'draft' && (
                        <button style={{
                          padding: '8px 16px', background: T.accent.primary, color: '#ffffff',
                          border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}>Verify &amp; Submit</button>
                      )}
                    </div>
                  </div>

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
    </div>
  )
}
