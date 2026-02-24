/**
 * Guided mode Stage 3 — Retirement Date & Eligibility.
 * Date picker, Rule of N evaluation, reduction factor, conditions met/unmet.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, tierMeta), Badge
 */
import type { StageProps } from './StageProps'
import { C, tierMeta } from '@/theme'
import { Field } from '@/components/shared/Field'
import { WhyPopover } from '@/components/shared/WhyPopover'

export function Stage3Eligibility({
  member: m, serviceCredit: sc, eligibility: elig,
  retirementDate, onRetirementDateChange,
}: StageProps) {
  const tc = tierMeta[m.tier] || tierMeta[1]
  const age = elig?.age_at_retirement ?? 0
  const ruleType = m.tier === 3 ? 'Rule of 85' : 'Rule of 75'
  const ruleTarget = m.tier === 3 ? 85 : 75
  const ruleSum = elig?.rule_of_n_value ?? 0
  const ruleMet = elig?.retirement_type === 'rule_of_75' || elig?.retirement_type === 'rule_of_85'
  const reductionPct = elig ? Math.round((1 - elig.reduction_factor) * 100) : 0
  const yrsUnder65 = elig ? Math.max(0, 65 - elig.age_at_retirement) : 0
  const reductionRate = m.tier === 3 ? 6 : 3
  const isLeaveEligible = m.tier <= 2 && new Date(m.hire_date) < new Date('2010-01-01')

  return (
    <div>
      {/* Date picker */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0',
        borderBottom: `1px solid ${C.borderSubtle}`,
      }}>
        <span style={{ color: C.textSecondary, fontSize: '12px', flex: 1 }}>Retirement Date</span>
        <input type="date" value={retirementDate}
          onChange={e => onRetirementDateChange(e.target.value)}
          style={{
            background: C.elevated, border: `1px solid ${C.border}`, borderRadius: '4px',
            color: C.accent, padding: '3px 8px', fontSize: '12px', fontFamily: 'monospace',
            outline: 'none',
          }}
        />
      </div>

      {elig && sc ? (
        <>
          <Field label="Age at Retirement" value={`${age} years`} />
          <Field label="Tier" value={tc.label} badge={{ text: tc.sub, bg: tc.muted, color: tc.color }} />
          <Field label="Years of Service (Eligibility)" value={`${sc.total_for_eligibility} years`}
            sub={sc.purchased_service_years > 0 ? 'Purchased service excluded from eligibility' : undefined} />

          {/* Rule of N evaluation */}
          {(() => {
            const ruleEntry = elig.audit_trail?.find(e => e.rule_id === 'RULE-ELIG-075' || e.rule_id === 'RULE-ELIG-085')
            const field = (
              <Field label={ruleType} value={`${ruleSum.toFixed(2)} ${ruleMet ? '\u2265' : '<'} ${ruleTarget}`}
                highlight={ruleMet}
                badge={{
                  text: ruleMet ? 'Met' : 'Not Met',
                  bg: ruleMet ? C.successMuted : C.dangerMuted,
                  color: ruleMet ? C.success : C.danger,
                }} />
            )
            return ruleEntry ? <WhyPopover entry={ruleEntry}>{field}</WhyPopover> : field
          })()}
          <Field label={`Minimum Age (${m.tier === 3 ? 60 : 55})`}
            value={`${age} \u2014 Met`}
            badge={{ text: 'Met', bg: C.successMuted, color: C.success }} />
          {(() => {
            const reduceEntry = elig.audit_trail?.find(e => e.rule_id.startsWith('RULE-REDUCE'))
            const field = (
              <Field label="Benefit Reduction"
                value={reductionPct === 0 ? 'None (0%)' : `${reductionPct}%`}
                highlight={reductionPct === 0}
                badge={reductionPct > 0
                  ? { text: `${yrsUnder65}y under 65`, bg: C.dangerMuted, color: C.danger }
                  : undefined} />
            )
            return reduceEntry ? <WhyPopover entry={reduceEntry}>{field}</WhyPopover> : field
          })()}
          <Field label="Leave Payout"
            value={isLeaveEligible ? 'Eligible' : 'Not eligible'}
            sub={isLeaveEligible ? 'Hired before Jan 1, 2010' : 'Hired after Jan 1, 2010 or Tier 3'} />

          {/* Eligibility result callout */}
          {ruleMet ? (
            <div style={{
              marginTop: '8px', padding: '8px 10px', background: C.successMuted,
              borderRadius: '6px', border: `1px solid ${C.successBorder}`,
            }}>
              <div style={{ color: C.success, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                {ruleType} Satisfied
              </div>
              <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
                Age {age} + Service {sc.total_for_eligibility} = {ruleSum.toFixed(2)} {'\u2265'} {ruleTarget}. No early retirement reduction applies.
              </div>
            </div>
          ) : (
            <div style={{
              marginTop: '8px', padding: '8px 10px', background: C.dangerMuted,
              borderRadius: '6px', border: `1px solid ${C.dangerBorder}`,
            }}>
              <div style={{ color: C.danger, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
                Early Retirement Reduction
              </div>
              <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
                {yrsUnder65} years under 65 {'\u00D7'} {reductionRate}%/year = {reductionPct}% reduction.
                Member receives {100 - reductionPct}% of calculated benefit.
              </div>
            </div>
          )}

          {/* Conditions met/unmet */}
          {elig.conditions_met.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px' }}>
                Conditions Met
              </div>
              {elig.conditions_met.map((c, i) => (
                <div key={i} style={{ color: C.success, fontSize: '10.5px', padding: '2px 0' }}>
                  {'\u2713'} {c}
                </div>
              ))}
            </div>
          )}
          {elig.conditions_unmet.length > 0 && (
            <div style={{ marginTop: '6px' }}>
              <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px' }}>
                Conditions Not Met
              </div>
              {elig.conditions_unmet.map((c, i) => (
                <div key={i} style={{ color: C.danger, fontSize: '10.5px', padding: '2px 0' }}>
                  {'\u2717'} {c}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading eligibility...</div>
      )}
    </div>
  )
}
