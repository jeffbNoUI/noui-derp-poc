/**
 * Death processing Stage 3 — Survivor Benefit Calculation.
 * For retired members with J&S: shows the survivor monthly benefit formula.
 * For active vested members: shows survivor annuity calculation.
 * For active non-vested members: shows contribution refund calculation.
 * Every calculation displays its formula, inputs, and result (Phase 1 transparency).
 * Consumed by: future DeathWorkspace (stage renderer)
 * Depends on: DeathStageProps, theme (C, fmt), Field
 */
import type { DeathStageProps } from './DeathStageProps.ts'
import { C, fmt } from '@/theme.ts'
import { Field } from '@/components/shared/Field.tsx'

export function SurvivorBenefitCalc({ survivorBenefit, activeMemberDeath, processingSummary: ps }: DeathStageProps) {
  // Active member death — contribution refund or survivor annuity
  if (activeMemberDeath) {
    return (
      <div>
        <div style={{
          padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
          border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
          fontSize: '9px', fontWeight: 600, color: C.textMuted,
          textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>
          {activeMemberDeath.vested ? 'Survivor Annuity Determination' : 'Contribution Refund Calculation'}
        </div>
        <div style={{
          padding: '8px 10px', borderRadius: '0 0 6px 6px',
          border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
        }}>
          <Field label="Benefit Type" value={activeMemberDeath.vested ? 'Survivor Annuity' : 'Contribution Refund'}
            badge={activeMemberDeath.vested
              ? { text: 'Vested', bg: C.successMuted, color: C.success }
              : { text: 'Non-Vested', bg: C.warmMuted, color: C.warm }} />
          <Field label="Vesting Status" value={activeMemberDeath.vested ? 'Yes' : 'No'}
            sub="5 years of service required for vesting" />
          {activeMemberDeath.refund_amount != null && (
            <Field label="Refund Amount" value={fmt(activeMemberDeath.refund_amount)} highlight
              sub="Accumulated contributions plus interest" />
          )}
          <Field label="Survivor Annuity Available" value={activeMemberDeath.survivor_annuity_available ? 'Yes' : 'No'} />
        </div>

        {/* Calculation formula — transparency */}
        <div style={{
          padding: '8px 10px', borderRadius: '6px',
          background: C.elevated, border: `1px solid ${C.borderSubtle}`,
        }}>
          <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px' }}>
            Calculation Formula
          </div>
          <div style={{
            color: C.accent, fontSize: '12px', fontFamily: "'SF Mono',monospace",
            lineHeight: '1.6',
          }}>
            {activeMemberDeath.formula}
          </div>
        </div>

        {/* Trace steps */}
        {renderTraceSteps(ps?.calculation_trace?.filter(t => t.rule_id === 'RULE-ACTIVE-DEATH'))}
      </div>
    )
  }

  // Retired member — J&S survivor benefit
  if (survivorBenefit) {
    return (
      <div>
        <div style={{
          padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
          border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
          fontSize: '9px', fontWeight: 600, color: C.textMuted,
          textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>
          Survivor Benefit Calculation
        </div>
        <div style={{
          padding: '8px 10px', borderRadius: '0 0 6px 6px',
          border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
        }}>
          <Field label="Survivor" value={survivorBenefit.survivor_name} />
          <Field label="J&S Percentage" value={`${Math.round(survivorBenefit.js_percentage * 100)}%`}
            badge={{ text: `${Math.round(survivorBenefit.js_percentage * 100)}% J&S`, bg: C.accentMuted, color: C.accent }} />
          <Field label="Monthly Benefit" value={fmt(survivorBenefit.survivor_monthly_benefit)} highlight
            sub="Survivor receives this amount monthly for their lifetime" />
          <Field label="Effective Date" value={survivorBenefit.effective_date}
            sub="First of month following death certificate verification" />
          <Field label="Duration" value={survivorBenefit.duration} />
        </div>

        {/* Calculation formula — transparency */}
        <div style={{
          padding: '8px 10px', borderRadius: '6px',
          background: C.elevated, border: `1px solid ${C.borderSubtle}`,
        }}>
          <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px' }}>
            Calculation Formula
          </div>
          <div style={{
            color: C.accent, fontSize: '12px', fontFamily: "'SF Mono',monospace",
            lineHeight: '1.6',
          }}>
            {survivorBenefit.formula}
          </div>
          <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '4px' }}>
            Source: RMC {'\u00A7'}18-410(a)(1)
          </div>
        </div>

        {/* Trace steps */}
        {renderTraceSteps(ps?.calculation_trace?.filter(t => t.rule_id === 'RULE-SURVIVOR-JS'))}
      </div>
    )
  }

  return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>No survivor benefit data available.</div>
}

// ─── Trace Step Renderer ────────────────────────────────────────────────

function renderTraceSteps(steps?: Array<{ step: number; rule_id: string; rule_name: string; description: string; inputs: string; result: string; source_reference: string }>) {
  if (!steps || steps.length === 0) return null
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '6px' }}>
        Calculation Trace
      </div>
      {steps.map(s => (
        <div key={s.step} style={{
          padding: '6px 8px', marginBottom: '4px', borderRadius: '4px',
          background: C.surface, border: `1px solid ${C.borderSubtle}`, fontSize: '10.5px',
        }}>
          <div style={{ color: C.accent, fontWeight: 600 }}>{s.rule_name}</div>
          <div style={{ color: C.textSecondary, marginTop: '2px' }}>{s.description}</div>
          <div style={{ color: C.textMuted, fontFamily: "'SF Mono',monospace", fontSize: '9.5px', marginTop: '2px' }}>
            {s.inputs} {'\u2192'} {s.result}
          </div>
          <div style={{ color: C.textDim, fontSize: '9px', marginTop: '1px' }}>{s.source_reference}</div>
        </div>
      ))}
    </div>
  )
}
