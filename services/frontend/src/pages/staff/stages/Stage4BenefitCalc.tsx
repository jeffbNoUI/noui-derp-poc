/**
 * Guided mode Stage 4 — Salary & Benefit Calculation.
 * HAS window, salary table, leave payout, formula, final monthly benefit.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, tierMeta, fmt), Badge
 */
import type { StageProps } from './StageProps'
import { C, tierMeta, fmt } from '@/theme'
import { Field } from '@/components/shared/Field'
import { WhyPopover } from '@/components/shared/WhyPopover'

// Salary period data matching BenefitWorkspace (duplicated — stable demo fixtures)
const SALARY_ROWS: Record<string, { period: string; months: number; monthly: number }[]> = {
  '10001': [
    { period: '2023 (Apr-Dec)', months: 9, monthly: 8792.75 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 9144.50 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 9420.25 },
    { period: '2026 (Jan-Mar)', months: 3, monthly: 9702.83 },
  ],
  '10002': [
    { period: '2023 (May-Dec)', months: 8, monthly: 7007.42 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 7287.75 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 7506.33 },
    { period: '2026 (Jan-Apr)', months: 4, monthly: 7731.50 },
  ],
  '10003': [
    { period: '2021 (Apr-Dec)', months: 9, monthly: 6250.00 },
    { period: '2022 (Jan-Dec)', months: 12, monthly: 6437.50 },
    { period: '2023 (Jan-Dec)', months: 12, monthly: 6695.00 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 6962.80 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 7171.67 },
    { period: '2026 (Jan-Mar)', months: 3, monthly: 7386.82 },
  ],
  '10004': [
    { period: '2023 (Apr-Dec)', months: 9, monthly: 8792.75 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 9144.50 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 9420.25 },
    { period: '2026 (Jan-Mar)', months: 3, monthly: 9702.83 },
  ],
}

const LEAVE_PAYOUTS: Record<string, number> = {
  '10001': 52000, '10002': 0, '10003': 0, '10004': 52000,
}

const AMS_NO_LEAVE: Record<string, number> = {
  '10001': 9194.45, '10004': 9194.45,
}

export function Stage4BenefitCalc({ memberId, member: m, benefit: ben, eligibility: elig }: StageProps) {
  const tc = tierMeta[m.tier] || tierMeta[1]
  const leavePayout = LEAVE_PAYOUTS[memberId] || 0
  const reductionPct = elig ? Math.round((1 - elig.reduction_factor) * 100) : 0
  const ruleType = m.tier === 3 ? 'Rule of 85' : 'Rule of 75'

  if (!ben) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading benefit calculation...</div>
  }

  const rows = SALARY_ROWS[memberId] || []

  return (
    <div>
      {/* AMS window info */}
      <Field label="HAS Window" value={`${ben.ams_window_months} consecutive months`}
        sub={m.tier === 3 ? 'Division 3: 60-month (vs 36 for Division 1/2)' : undefined}
        badge={m.tier === 3 ? { text: '60 months', bg: C.tier3Muted, color: C.tier3 } : undefined} />

      {/* Salary table */}
      {rows.length > 0 && (
        <div style={{ margin: '6px 0', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
            padding: '6px 10px', background: C.elevated, fontSize: '10.5px',
            textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: C.textMuted, fontWeight: 600,
          }}>
            <span>Period</span><span style={{ textAlign: 'right' }}>Mo</span>
            <span style={{ textAlign: 'right' }}>Monthly</span><span style={{ textAlign: 'right' }}>Subtotal</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
              padding: '5px 10px', fontSize: '12px', borderTop: `1px solid ${C.borderSubtle}`,
              background: i === rows.length - 1 && leavePayout > 0 ? C.warmMuted : 'transparent',
            }}>
              <span style={{ color: C.text }}>{r.period}</span>
              <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{r.months}</span>
              <span style={{ textAlign: 'right', color: C.text, fontFamily: 'monospace' }}>{fmt(r.monthly)}</span>
              <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{fmt(r.months * r.monthly)}</span>
            </div>
          ))}
          {leavePayout > 0 && (
            <div style={{
              display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
              padding: '5px 10px', fontSize: '12px', borderTop: `1px solid ${C.warmBorder}`, background: C.warmMuted,
            }}>
              <span style={{ color: C.warm, fontWeight: 600 }}>+ Leave Payout</span><span /><span />
              <span style={{ textAlign: 'right', color: C.warm, fontFamily: 'monospace', fontWeight: 600 }}>+{fmt(leavePayout)}</span>
            </div>
          )}
          <div style={{
            display: 'grid', gridTemplateColumns: '2.2fr 0.6fr 1fr 1fr',
            padding: '6px 10px', fontSize: '12px', background: C.elevated,
            borderTop: `1px solid ${C.border}`, fontWeight: 600,
          }}>
            <span style={{ color: C.text }}>Total</span>
            <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{ben.ams_window_months}</span>
            <span />
            <span style={{ textAlign: 'right', color: C.accent, fontFamily: 'monospace' }}>
              {fmt(rows.reduce((s, r) => s + r.months * r.monthly, 0) + leavePayout)}
            </span>
          </div>
        </div>
      )}

      {(() => {
        const amsEntry = ben.audit_trail?.find(e => e.rule_id === 'RULE-AMS-001')
        const field = <Field label={`\u00F7 ${ben.ams_window_months} months`} value={fmt(ben.ams)} highlight />
        return amsEntry ? <WhyPopover entry={amsEntry}>{field}</WhyPopover> : field
      })()}

      {/* Leave payout impact */}
      {leavePayout > 0 && (
        <div style={{
          marginTop: '6px', padding: '8px 10px', background: C.warmMuted,
          borderRadius: '6px', border: `1px solid ${C.warmBorder}`,
        }}>
          <div style={{ color: C.warm, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
            Leave Payout Impact
          </div>
          <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
            {fmt(leavePayout)} added to final month. Without: {fmt(AMS_NO_LEAVE[memberId])} {'\u2192'} With: {fmt(ben.ams)} (+{fmt(ben.ams - (AMS_NO_LEAVE[memberId] ?? ben.ams))}/mo)
          </div>
        </div>
      )}

      {/* Benefit formula hero */}
      <div style={{
        padding: '12px', background: C.accentMuted, borderRadius: '7px',
        border: `1px solid ${C.accentSolid}`, textAlign: 'center' as const, margin: '10px 0',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px',
        }}>{(ben.multiplier * 100).toFixed(1)}% {'\u00D7'} HAS {'\u00D7'} Service</div>
        <div style={{
          color: C.accent, fontSize: '26px', fontWeight: 700, fontFamily: 'monospace',
          marginTop: '4px', textShadow: `0 0 25px ${C.accentGlow}`,
        }}>{fmt(ben.net_monthly_benefit)}/mo</div>
        <div style={{ color: C.textSecondary, fontSize: '10.5px', marginTop: '3px', fontFamily: 'monospace' }}>
          {ben.formula_display}
        </div>
        {reductionPct > 0 && (
          <div style={{ color: C.danger, fontSize: '9.5px', marginTop: '3px', fontWeight: 600 }}>
            After {reductionPct}% early retirement reduction
          </div>
        )}
      </div>

      {(() => {
        const multEntry = ben.audit_trail?.find(e => e.rule_id.startsWith('RULE-MULT'))
        const field = <Field label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}% (${tc.label})`} sub="C.R.S. \u00A724-51-101" />
        return multEntry ? <WhyPopover entry={multEntry}>{field}</WhyPopover> : field
      })()}
      <Field label="HAS" value={fmt(ben.ams)} />
      <Field label="Service (for benefit)" value={`${ben.service_years_for_benefit}y`} />
      {(() => {
        const calcEntry = ben.audit_trail?.find(e => e.rule_id === 'RULE-CALC-001')
        const field = <Field label="Gross Monthly" value={fmt(ben.gross_monthly_benefit)} />
        return calcEntry ? <WhyPopover entry={calcEntry}>{field}</WhyPopover> : field
      })()}
      {reductionPct > 0 && (
        <Field label="Reduction" value={`\u00D7 ${ben.reduction_factor.toFixed(2)} (\u2212${reductionPct}%)`}
          badge={{ text: `\u2212${fmt(ben.gross_monthly_benefit - ben.net_monthly_benefit)}/mo`, bg: C.dangerMuted, color: C.danger }} />
      )}
      <Field label="Annual Benefit" value={fmt(ben.net_monthly_benefit * 12)} />

      {reductionPct === 0 && (
        <div style={{
          marginTop: '6px', padding: '8px 10px', background: C.successMuted,
          borderRadius: '6px', border: `1px solid ${C.successBorder}`,
        }}>
          <div style={{ color: C.success, fontSize: '10.5px', fontWeight: 600 }}>
            No Reduction \u2014 {ruleType} met. 100% of calculated benefit.
          </div>
        </div>
      )}
    </div>
  )
}
