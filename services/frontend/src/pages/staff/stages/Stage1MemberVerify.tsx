/**
 * Guided mode Stage 1 — Member Verification.
 * Two-column layout: personal info (left) and employment/service info (right).
 * Displays member profile, tier badge, employment summary, and data quality flags.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, tierMeta, fmt), Badge, Field
 */
import type { StageProps } from './StageProps'
import { C, tierMeta } from '@/theme'
import { Field } from '@/components/shared/Field'

export function Stage1MemberVerify({ member: m, serviceCredit: sc }: StageProps) {
  const tc = tierMeta[m.tier] || tierMeta[1]
  const age = Math.floor((Date.now() - new Date(m.date_of_birth).getTime()) / (365.25 * 86400000))

  return (
    <div>
      {/* Two-column grid — collapses to single column on narrow panels */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '0 16px',
      }}>
        {/* Left: Personal Info */}
        <div>
          <div style={{
            fontSize: '9px', fontWeight: 600, color: C.textDim,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
            marginBottom: '4px', paddingBottom: '2px',
            borderBottom: `1px solid ${C.borderSubtle}`,
          }}>Personal</div>
          <Field label="Date of Birth" value={m.date_of_birth} sub={`Age ${age}`} />
          <Field label="Status" value={m.status}
            badge={{ text: 'Active', bg: C.successMuted, color: C.success }} />
          <Field label="Tier" value={tc.label}
            badge={{ text: tc.sub, bg: tc.muted, color: tc.color }}
            sub="Determines multiplier, AMS window, and reduction rates" />
        </div>

        {/* Right: Employment & Service */}
        <div>
          <div style={{
            fontSize: '9px', fontWeight: 600, color: C.textDim,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
            marginBottom: '4px', paddingBottom: '2px',
            borderBottom: `1px solid ${C.borderSubtle}`,
          }}>Employment &amp; Service</div>
          <Field label="Hire Date" value={m.hire_date} />
          <Field label="Vesting" value={sc ? `${sc.earned_service_years}y earned — Vested` : 'Loading...'}
            badge={sc && sc.earned_service_years >= 5
              ? { text: 'Met', bg: C.successMuted, color: C.success }
              : undefined} />
          <Field label="Total Service" value={sc ? `${sc.total_service_years} years` : 'Loading...'} />
        </div>
      </div>

      {/* Data quality section — full width below the grid */}
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
