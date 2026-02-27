/**
 * Guided mode Stage 2 — Service Credit Review.
 * Earned vs. purchased breakdown, vesting status, exclusion callout,
 * and employment history summary for approving service credit.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C), Badge, Field, useEmployment hook
 */
import type { StageProps } from './StageProps'
import { C } from '@/theme'
import { Field } from '@/components/shared/Field'
import { useEmployment } from '@/hooks/useMember'

export function Stage2ServiceCredit({ member: m, memberId, serviceCredit: sc }: StageProps) {
  const { data: employment } = useEmployment(memberId)

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

      {/* Employment history summary — supports service credit approval */}
      {employment && employment.length > 0 && (
        <div style={{
          marginTop: '8px', borderRadius: '6px', overflow: 'hidden',
          border: `1px solid ${C.borderSubtle}`,
        }}>
          <div style={{
            padding: '6px 8px', background: C.elevated, fontSize: '9px', fontWeight: 600,
            color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>Employment History</div>
          <div style={{ padding: '4px 8px' }}>
            {employment.map((evt, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '5px 0',
                borderBottom: i < employment.length - 1 ? `1px solid ${C.borderSubtle}` : 'none',
              }}>
                {/* Timeline dot + line */}
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: i === employment.length - 1 ? C.accent : C.textDim,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: C.text, fontSize: '11px', fontWeight: 500 }}>{evt.position}</span>
                    <span style={{
                      color: C.textMuted, fontSize: '10px', fontFamily: "'SF Mono',monospace",
                      flexShrink: 0, marginLeft: '8px',
                    }}>{evt.effective_date}</span>
                  </div>
                  <div style={{ color: C.textDim, fontSize: '10px' }}>
                    {evt.department}
                    {evt.event_type !== 'hire' && (
                      <span style={{
                        marginLeft: '6px', fontSize: '9px', padding: '0 4px',
                        borderRadius: '3px', background: C.accentMuted, color: C.accent,
                      }}>{evt.event_type}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
