/**
 * Guided mode Stage 2 — Service Credit Review.
 * Earned vs. purchased breakdown, vesting status, exclusion callout.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C), Badge
 */
import type { StageProps } from './StageProps'
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'

function Field({ label, value, sub, highlight, badge }: {
  label: string; value: string; sub?: string | null; highlight?: boolean
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
        <span style={{
          color: highlight ? C.accent : C.text, fontWeight: 600,
          fontFamily: "'SF Mono',monospace", fontSize: '12px',
          textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
        }}>{value}</span>
      </span>
    </div>
  )
}

export function Stage2ServiceCredit({ member: m, serviceCredit: sc }: StageProps) {
  if (!sc) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading service credit...</div>
  }

  const hasPurchased = sc.purchased_service_years > 0
  const ruleType = m.tier === 3 ? 'Rule of 85' : 'Rule of 75'

  return (
    <div>
      <Field label="Earned Service" value={`${sc.earned_service_years} years`}
        sub="Active employment credit" />
      {hasPurchased && (
        <Field label="Purchased Service" value={`${sc.purchased_service_years} years`}
          sub="Counts for benefit, excluded from eligibility"
          badge={{ text: 'Benefit Only', bg: C.warmMuted, color: C.warm }} />
      )}
      {sc.military_service_years > 0 && (
        <Field label="Military Service" value={`${sc.military_service_years} years`} />
      )}
      <Field label="Total Service (Benefit)" value={`${sc.total_for_benefit} years`} highlight
        sub="Used in benefit formula: AMS × multiplier × service" />
      <Field label={`Total Service (${ruleType})`} value={`${sc.total_for_eligibility} years`}
        sub={hasPurchased ? 'Purchased service excluded' : 'Same as total — no purchased service'}
        badge={hasPurchased
          ? { text: 'Purchased Excluded', bg: C.dangerMuted, color: C.danger }
          : undefined} />

      {/* Vesting status */}
      <Field label="Vesting Requirement" value={sc.earned_service_years >= 5 ? 'Met' : 'Not Met'}
        sub="5 years required for all tiers (RMC §18-403)"
        badge={sc.earned_service_years >= 5
          ? { text: `${sc.earned_service_years}y ≥ 5y`, bg: C.successMuted, color: C.success }
          : { text: `${sc.earned_service_years}y < 5y`, bg: C.dangerMuted, color: C.danger }} />

      {/* Visual service breakdown */}
      <div style={{
        marginTop: '10px', borderRadius: '6px', overflow: 'hidden',
        border: `1px solid ${C.borderSubtle}`,
      }}>
        <div style={{
          padding: '6px 8px', background: C.elevated, fontSize: '9px', fontWeight: 600,
          color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>Service Breakdown</div>
        <div style={{ padding: '8px' }}>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: '8px', borderRadius: '4px', overflow: 'hidden', gap: '1px' }}>
            <div style={{
              flex: sc.earned_service_years, background: C.accent, borderRadius: '4px 0 0 4px',
            }} />
            {hasPurchased && (
              <div style={{
                flex: sc.purchased_service_years, background: C.warm, borderRadius: '0 4px 4px 0',
              }} />
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: C.accent }} />
              <span style={{ color: C.textSecondary, fontSize: '10px' }}>Earned ({sc.earned_service_years}y)</span>
            </div>
            {hasPurchased && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: C.warm }} />
                <span style={{ color: C.textSecondary, fontSize: '10px' }}>Purchased ({sc.purchased_service_years}y)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchased service exclusion callout */}
      {hasPurchased && (
        <div style={{
          marginTop: '8px', padding: '8px 10px', background: C.warmMuted,
          borderRadius: '6px', border: `1px solid ${C.warmBorder}`,
        }}>
          <div style={{ color: C.warm, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
            Purchased Service Exclusion
          </div>
          <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
            {sc.purchased_service_years} years of purchased service counts toward the benefit calculation
            but is excluded from {ruleType} and IPR eligibility per RMC §18-407.
          </div>
        </div>
      )}
    </div>
  )
}
