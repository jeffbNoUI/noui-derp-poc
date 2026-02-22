/**
 * Guided mode Stage 6 — Additional Benefits.
 * IPR (earned service only) and death benefit amount/election.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, fmt), Badge
 */
import type { StageProps } from './StageProps'
import { C, fmt } from '@/theme'
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

export function Stage6Supplemental({ benefit: ben }: StageProps) {
  if (!ben) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading benefit data...</div>
  }

  return (
    <div>
      {/* IPR Section */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Increased Pension Reserve (IPR)
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        {ben.ipr ? (
          <>
            <Field label="Service for IPR" value={`${ben.ipr.eligible_service_years}y`}
              sub="Earned only — purchased service excluded"
              badge={{ text: 'Earned Only', bg: C.warmMuted, color: C.warm }} />
            <Field label="Pre-Medicare Rate (< 65)" value="$12.50/mo per year"
              sub="$150/year of earned service" />
            <Field label="Pre-Medicare Amount" value={fmt(ben.ipr.monthly_amount)} highlight
              sub={`$12.50 \u00D7 ${ben.ipr.eligible_service_years} years`} />
            <Field label="Post-Medicare Rate (\u2265 65)" value="$6.25/mo per year"
              sub="$75/year of earned service" />
            <Field label="Post-Medicare Amount" value={fmt(ben.ipr.monthly_amount / 2)}
              sub={`$6.25 \u00D7 ${ben.ipr.eligible_service_years} years`} />
            <div style={{
              marginTop: '6px', padding: '8px 10px', background: C.accentMuted,
              borderRadius: '6px', border: `1px solid ${C.accentSolid}`,
            }}>
              <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                IPR Note
              </div>
              <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
                IPR offsets health insurance premiums. Rate changes at Medicare eligibility (age 65). RMC {'\u00A7'}18-414.
              </div>
            </div>
          </>
        ) : (
          <div style={{ color: C.textMuted, fontSize: '11px', padding: '4px 0' }}>
            IPR data not available.
          </div>
        )}
      </div>

      {/* Death Benefit Section */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Death Benefit
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`,
      }}>
        {ben.death_benefit ? (
          <>
            <Field label="Amount" value={fmt(ben.death_benefit.amount)} highlight
              sub={`Lump sum — ${ben.death_benefit.retirement_type === 'rule_of_75' || ben.death_benefit.retirement_type === 'rule_of_85' || ben.death_benefit.retirement_type === 'normal' ? 'Normal/Rule of N' : 'Early retirement'}`} />
            <Field label="Retirement Type" value={ben.death_benefit.retirement_type}
              badge={{ text: `Tier ${ben.death_benefit.tier}`, bg: C.accentMuted, color: C.accent }} />
            {ben.death_benefit.amount < 5000 && (
              <div style={{
                marginTop: '6px', padding: '8px 10px', background: C.warmMuted,
                borderRadius: '6px', border: `1px solid ${C.warmBorder}`,
              }}>
                <div style={{ color: C.warm, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                  Early Retirement Reduction Applied
                </div>
                <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
                  Death benefit reduced from $5,000 base for early retirement.
                  {ben.death_benefit.tier === 3
                    ? ' Tier 3: $500/year under 65.'
                    : ' Tiers 1-2: $250/year under 65.'}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{ color: C.textMuted, fontSize: '11px', padding: '4px 0' }}>
            Death benefit data not available.
          </div>
        )}
      </div>
    </div>
  )
}
