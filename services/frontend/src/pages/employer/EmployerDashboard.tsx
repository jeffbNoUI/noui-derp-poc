/**
 * Employer dashboard — stats cards, recent activity timeline, quick actions, contribution rates.
 * Consumed by: router.tsx (employer index route)
 * Depends on: StatsCard, employerDemoApi, useEmployerAuth, fmt, employer-theme
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatsCard } from '@/components/shared/StatsCard'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerDemoApi } from '@/api/employer-demo-data'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { EmployerDashboardStats } from '@/types/Employer'

const RECENT_ACTIVITY = [
  { date: '2026-02-25', text: 'March contribution reports generated for all departments', type: 'info' as const },
  { date: '2026-02-20', text: 'Robert Martinez (10001) retirement application moved to In Review', type: 'success' as const },
  { date: '2026-02-18', text: 'February contribution reports submitted — awaiting DERP verification', type: 'info' as const },
  { date: '2026-02-15', text: 'Discrepancy flagged in Parks & Rec March report — salary mismatch for Charles Jackson', type: 'warning' as const },
  { date: '2026-02-10', text: 'Jennifer Kim (10002) retirement application submitted — documentation pending', type: 'info' as const },
]

export function EmployerDashboard() {
  const { deptId } = useEmployerAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<EmployerDashboardStats | null>(null)

  useEffect(() => {
    employerDemoApi.getDashboardStats(deptId).then(setStats)
  }, [deptId])

  if (!stats) return <div style={{ padding: 20, color: T.text.muted }}>Loading...</div>

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatsCard label="Active Employees" value={String(stats.active_employees)} color={T.accent.primary} />
        <StatsCard label="Pending Retirements" value={String(stats.pending_retirements)} color={T.status.warning} />
        <StatsCard label="Monthly Payroll" value={fmt(stats.monthly_payroll)} color={T.text.primary} />
        <StatsCard
          label="Avg Service Years"
          value={stats.avg_service_years.toFixed(1)}
          subtitle="years"
          color={T.text.primary}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Recent activity timeline */}
        <div style={{
          background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
          padding: 20, boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 16 }}>
            Recent Activity
          </div>
          {RECENT_ACTIVITY.map((event, i) => {
            const dotColor = event.type === 'success' ? T.status.success
              : event.type === 'warning' ? T.status.warning : T.accent.primary
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, paddingBottom: 14,
                borderLeft: i < RECENT_ACTIVITY.length - 1 ? `2px solid ${T.border.subtle}` : 'none',
                marginLeft: 5, paddingLeft: 16,
                position: 'relative' as const,
              }}>
                <div style={{
                  position: 'absolute' as const, left: -5, top: 2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: dotColor, border: `2px solid ${T.surface.card}`,
                }} />
                <div>
                  <div style={{ fontSize: 12, color: T.text.primary, lineHeight: 1.4 }}>{event.text}</div>
                  <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>{event.date}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column: quick actions + contribution rates */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {/* Quick actions */}
          <div style={{
            background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
            padding: 20, boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary, marginBottom: 12 }}>
              Quick Actions
            </div>
            <button
              onClick={() => navigate('/employer/contributions')}
              style={{
                width: '100%', padding: '10px 14px', marginBottom: 8,
                background: T.accent.primary, color: '#ffffff', border: 'none',
                borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >Submit Contributions</button>
            <button
              onClick={() => navigate('/employer/retirements')}
              style={{
                width: '100%', padding: '10px 14px',
                background: 'transparent', color: T.accent.primary,
                border: `1px solid ${T.accent.primary}`,
                borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >View Pending Retirements</button>
          </div>

          {/* Contribution rates — RMC §18-407 */}
          <div style={{
            background: T.accent.surface, borderRadius: 10,
            border: `1px solid ${T.border.base}`, padding: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text.primary, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
              Contribution Rates
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: T.text.secondary }}>Employee</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.accent.primary }}>8.45%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: T.text.secondary }}>Employer</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.accent.primary }}>17.95%</span>
            </div>
            <div style={{ fontSize: 10, color: T.text.muted, marginTop: 10, fontStyle: 'italic' }}>
              Per RMC \u00A718-407, effective Jan 2024
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
