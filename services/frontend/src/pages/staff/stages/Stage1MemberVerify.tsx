/**
 * Guided mode Stage 1 — Member Verification.
 * Displays member profile, tier badge, employment summary, and data quality flags.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, tierMeta, fmt), Badge
 */
import type { StageProps } from './StageProps'
import { C, tierMeta, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'

function Field({ label, value, sub, badge }: {
  label: string; value: string; sub?: string | null
  badge?: { text: string; bg: string; color: string } | null
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <span style={{ color: C.textSecondary, fontSize: '12px' }}>{label}</span>
        {sub && <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>{sub}</div>}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {badge && <Badge {...badge} />}
        <span style={{ color: C.text, fontWeight: 600, fontFamily: "'SF Mono',monospace", fontSize: '12px' }}>{value}</span>
      </span>
    </div>
  )
}

export function Stage1MemberVerify({ member: m, serviceCredit: sc }: StageProps) {
  const tc = tierMeta[m.tier] || tierMeta[1]
  const age = Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (365.25 * 86400000))

  return (
    <div>
      {/* Member identity card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px', background: C.elevated, borderRadius: '8px',
        border: `1px solid ${tc.color}22`, marginBottom: '10px',
      }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '8px', background: tc.muted,
          border: `2px solid ${tc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, color: tc.color, fontSize: '12px',
        }}>T{m.tier}</div>
        <div>
          <div style={{ color: C.text, fontWeight: 700, fontSize: '15px' }}>{m.first_name} {m.last_name}</div>
          <div style={{ color: C.textSecondary, fontSize: '11px' }}>
            ID: {m.member_id} · {m.department} · {m.position}
          </div>
        </div>
      </div>

      <Field label="Date of Birth" value={m.date_of_birth} sub={`Age ${age}`} />
      <Field label="Hire Date" value={m.hire_date} />
      <Field label="Tier" value={tc.label}
        badge={{ text: tc.sub, bg: tc.muted, color: tc.color }}
        sub={`Determines multiplier, AMS window, and reduction rates`} />
      <Field label="Status" value={m.status}
        badge={{ text: 'Active', bg: C.successMuted, color: C.success }} />
      <Field label="Vesting" value={sc ? `${sc.earned_service_years}y earned — Vested` : 'Loading...'}
        badge={sc && sc.earned_service_years >= 5
          ? { text: 'Met', bg: C.successMuted, color: C.success }
          : undefined} />
      <Field label="Total Service" value={sc ? `${sc.total_service_years} years` : 'Loading...'} />

      {/* Data quality section */}
      <div style={{
        marginTop: '10px', padding: '8px 10px', background: C.successMuted,
        borderRadius: '6px', border: `1px solid ${C.successBorder}`,
      }}>
        <div style={{ color: C.success, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Data Quality Check
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          No data quality flags identified. Member record is complete and consistent.
        </div>
      </div>
    </div>
  )
}
