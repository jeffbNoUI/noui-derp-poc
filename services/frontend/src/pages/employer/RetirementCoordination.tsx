/**
 * Retirement coordination page — pending retirements with expandable detail views,
 * document checklist, status timeline, and employer actions.
 * Self-contained in the employer portal — no navigation to staff workspace.
 * Consumed by: router.tsx (employer/retirements route)
 * Depends on: employerDemoApi, useEmployerAuth, fmt, employerTheme, Employer types
 */
import { useState, useEffect } from 'react'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerDemoApi } from '@/api/employer-demo-data'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { PendingRetirement } from '@/types/Employer'

// Tier badge colors matching employer-theme.ts
const TIER_COLORS: Record<number, { color: string; bg: string }> = {
  1: { color: T.tier.t1, bg: T.tier.t1bg },
  2: { color: T.tier.t2, bg: T.tier.t2bg },
  3: { color: T.tier.t3, bg: T.tier.t3bg },
}

// Document checklist per retirement application — what employer needs to provide
interface DocItem {
  label: string
  required: boolean
}

const EMPLOYER_DOCS: DocItem[] = [
  { label: 'Final pay stub / earnings verification', required: true },
  { label: 'Last day worked confirmation', required: true },
  { label: 'Leave balance summary (sick/vacation/PTO)', required: true },
  { label: 'Service credit verification', required: false },
  { label: 'Department head sign-off', required: true },
]

// Status timeline events — demo data per member
const STATUS_TIMELINE: Record<string, Array<{ date: string; event: string; type: 'info' | 'success' | 'warning' }>> = {
  '10001': [
    { date: '2026-02-10', event: 'Retirement application submitted by member', type: 'info' },
    { date: '2026-02-12', event: 'Application received by DERP — initial review started', type: 'info' },
    { date: '2026-02-15', event: 'Employer documentation requested', type: 'warning' },
    { date: '2026-02-20', event: 'All employer documents received — moved to In Review', type: 'success' },
  ],
  '10002': [
    { date: '2026-02-10', event: 'Retirement application submitted by member', type: 'info' },
    { date: '2026-02-12', event: 'Application received by DERP — documentation review', type: 'info' },
    { date: '2026-02-18', event: 'Employer documentation requested — awaiting response', type: 'warning' },
  ],
  '10003': [
    { date: '2026-03-01', event: 'Retirement application submitted by member', type: 'info' },
    { date: '2026-03-03', event: 'Application received — initial review pending', type: 'info' },
  ],
}

// Demo document completion status per member
const DOC_STATUS: Record<string, boolean[]> = {
  '10001': [true, true, true, true, true],
  '10002': [true, true, false, false, false],
  '10003': [false, false, false, false, false],
}

export function RetirementCoordination() {
  const { deptId } = useEmployerAuth()
  const [retirements, setRetirements] = useState<PendingRetirement[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState<{ memberId: string; docIdx: number } | null>(null)

  useEffect(() => {
    employerDemoApi.getPendingRetirements(deptId).then(setRetirements)
  }, [deptId])

  // Simulate document upload
  const handleDocUpload = (memberId: string, docIdx: number) => {
    setUploadingDoc({ memberId, docIdx })
    setTimeout(() => {
      // Update local doc status
      if (DOC_STATUS[memberId]) {
        DOC_STATUS[memberId][docIdx] = true
      }
      setUploadingDoc(null)
      // Force re-render by toggling state
      setRetirements(prev => [...prev])
    }, 800)
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary, marginBottom: 16 }}>
        Pending Retirements
        <span style={{ fontSize: 12, fontWeight: 400, color: T.text.muted, marginLeft: 8 }}>
          {retirements.length} pending
        </span>
      </div>

      {retirements.length === 0 ? (
        <div style={{
          padding: 40, textAlign: 'center' as const, color: T.text.muted, fontSize: 13,
          background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
        }}>
          No pending retirements for this department
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {retirements.map(r => {
            const tc = TIER_COLORS[r.tier] ?? { color: T.text.muted, bg: 'transparent' }
            const isExpanded = expandedId === r.member_id
            const timeline = STATUS_TIMELINE[r.member_id] ?? []
            const docs = DOC_STATUS[r.member_id] ?? EMPLOYER_DOCS.map(() => false)
            const docsComplete = docs.filter((d, i) => d || !EMPLOYER_DOCS[i].required).length
            const docsTotal = EMPLOYER_DOCS.filter(d => d.required).length

            return (
              <div
                key={r.member_id}
                style={{
                  background: T.surface.card, borderRadius: 10,
                  border: `1px solid ${T.border.base}`,
                  overflow: 'hidden', boxShadow: T.shadow,
                }}
              >
                {/* Header row — clickable to expand */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : r.member_id)}
                  style={{
                    padding: 16, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = T.surface.cardAlt }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Left: member info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>
                        {r.member_name}
                      </span>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10,
                        fontSize: 10, fontWeight: 600, color: tc.color, background: tc.bg,
                      }}>
                        Tier {r.tier}
                      </span>
                      <span style={{ fontSize: 11, color: T.text.muted }}>
                        ID: {r.member_id}
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 2 }}>Department</div>
                        <div style={{ fontSize: 12, color: T.text.primary }}>{r.department}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 2 }}>Retirement Date</div>
                        <div style={{ fontSize: 12, color: T.text.primary }}>{r.retirement_date}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 2 }}>Last Day Worked</div>
                        <div style={{ fontSize: 12, color: T.text.primary }}>{r.last_day_worked ?? 'TBD'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 2 }}>Est. Benefit</div>
                        <div style={{ fontSize: 12, color: T.text.primary, fontWeight: 600 }}>
                          {r.estimated_benefit ? fmt(r.estimated_benefit) : 'Pending'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, marginBottom: 2 }}>Submitted</div>
                        <div style={{ fontSize: 12, color: T.text.primary }}>
                          {r.application_submitted_at
                            ? new Date(r.application_submitted_at).toLocaleDateString()
                            : '\u2014'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: status + expand indicator */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, marginLeft: 16 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 10,
                      fontSize: 10, fontWeight: 600,
                      color: r.application_status === 'In Review' ? T.status.info : T.status.warning,
                      background: r.application_status === 'In Review' ? T.status.infoBg : T.status.warningBg,
                    }}>
                      {r.application_status}
                    </span>

                    {/* Document progress */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: r.documents_complete ? T.status.success : T.status.warning,
                      }} />
                      <span style={{ fontSize: 10, color: T.text.muted }}>
                        Docs {docsComplete}/{docsTotal}
                      </span>
                    </div>

                    <span style={{ fontSize: 12, color: T.text.muted }}>
                      {isExpanded ? '\u25B2' : '\u25BC'}
                    </span>
                  </div>
                </div>

                {/* Expanded detail — document checklist + timeline */}
                {isExpanded && (
                  <div style={{ borderTop: `1px solid ${T.border.subtle}`, padding: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      {/* Left: Document Checklist */}
                      <div>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: T.text.primary, marginBottom: 12,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          Employer Documents
                          <span style={{
                            fontSize: 9, padding: '2px 6px', borderRadius: 10,
                            background: r.documents_complete ? T.status.successBg : T.status.warningBg,
                            color: r.documents_complete ? T.status.success : T.status.warning,
                            fontWeight: 600,
                          }}>
                            {docsComplete}/{docsTotal} required
                          </span>
                        </div>
                        {EMPLOYER_DOCS.map((doc, i) => {
                          const isComplete = docs[i]
                          const isUploading = uploadingDoc?.memberId === r.member_id && uploadingDoc?.docIdx === i
                          return (
                            <div key={doc.label} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '8px 10px', marginBottom: 4, borderRadius: 6,
                              background: isComplete ? T.status.successBg : 'transparent',
                              border: `1px solid ${isComplete ? T.status.success + '30' : T.border.subtle}`,
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                                <span style={{
                                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 10,
                                  background: isComplete ? T.status.success : T.surface.cardAlt,
                                  color: isComplete ? '#fff' : T.text.muted,
                                  border: isComplete ? 'none' : `1px solid ${T.border.base}`,
                                }}>
                                  {isComplete ? '\u2713' : ''}
                                </span>
                                <div>
                                  <span style={{
                                    fontSize: 11, color: T.text.primary,
                                    textDecoration: isComplete ? 'none' : 'none',
                                  }}>
                                    {doc.label}
                                  </span>
                                  {doc.required && !isComplete && (
                                    <span style={{ fontSize: 9, color: T.status.danger, marginLeft: 4 }}>Required</span>
                                  )}
                                </div>
                              </div>
                              {!isComplete && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDocUpload(r.member_id, i) }}
                                  disabled={isUploading}
                                  style={{
                                    padding: '3px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
                                    background: isUploading ? T.border.subtle : T.accent.primary,
                                    color: isUploading ? T.text.muted : '#fff',
                                    border: 'none', cursor: isUploading ? 'default' : 'pointer',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isUploading ? 'Uploading...' : 'Upload'}
                                </button>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Right: Application Timeline */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text.primary, marginBottom: 12 }}>
                          Application Timeline
                        </div>
                        {timeline.length === 0 ? (
                          <div style={{ fontSize: 11, color: T.text.muted, fontStyle: 'italic' }}>
                            No timeline events yet
                          </div>
                        ) : (
                          timeline.map((event, i) => {
                            const dotColor = event.type === 'success' ? T.status.success
                              : event.type === 'warning' ? T.status.warning : T.accent.primary
                            return (
                              <div key={i} style={{
                                display: 'flex', gap: 12, paddingBottom: 14,
                                borderLeft: i < timeline.length - 1 ? `2px solid ${T.border.subtle}` : 'none',
                                marginLeft: 5, paddingLeft: 14,
                                position: 'relative' as const,
                              }}>
                                <div style={{
                                  position: 'absolute' as const, left: -4, top: 2,
                                  width: 8, height: 8, borderRadius: '50%',
                                  background: dotColor,
                                }} />
                                <div>
                                  <div style={{ fontSize: 11, color: T.text.primary, lineHeight: 1.4 }}>
                                    {event.event}
                                  </div>
                                  <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>
                                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </div>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
