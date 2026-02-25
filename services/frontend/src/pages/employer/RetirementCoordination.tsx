/**
 * Retirement coordination page — pending retirements table with document checklist status.
 * Consumed by: router.tsx (employer/retirements route)
 * Depends on: employerDemoApi, useEmployerAuth, fmt, employerTheme, Employer types
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

export function RetirementCoordination() {
  const { deptId } = useEmployerAuth()
  const navigate = useNavigate()
  const [retirements, setRetirements] = useState<PendingRetirement[]>([])

  useEffect(() => {
    employerDemoApi.getPendingRetirements(deptId).then(setRetirements)
  }, [deptId])

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
            return (
              <div
                key={r.member_id}
                style={{
                  background: T.surface.card, borderRadius: 10,
                  border: `1px solid ${T.border.base}`,
                  padding: 16, boxShadow: T.shadow,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
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
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 8, marginLeft: 16 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 10,
                      fontSize: 10, fontWeight: 600,
                      color: r.application_status === 'In Review' ? T.status.info : T.status.warning,
                      background: r.application_status === 'In Review' ? T.status.infoBg : T.status.warningBg,
                    }}>
                      {r.application_status}
                    </span>

                    {/* Document status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: r.documents_complete ? T.status.success : T.status.warning,
                      }} />
                      <span style={{ fontSize: 10, color: T.text.muted }}>
                        Docs {r.documents_complete ? 'Complete' : 'Incomplete'}
                      </span>
                    </div>

                    {/* Link to staff workspace */}
                    <button
                      onClick={() => navigate(`/staff/case/${r.member_id}`)}
                      style={{
                        fontSize: 10, color: T.accent.primary, background: 'none',
                        border: `1px solid ${T.accent.primary}`, padding: '4px 10px',
                        borderRadius: 4, cursor: 'pointer', fontWeight: 500,
                      }}
                    >View in Staff Workspace</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
