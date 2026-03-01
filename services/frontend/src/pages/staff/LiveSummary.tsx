/**
 * Live calculation summary sidebar — hero Monthly Benefit card with detailed line items.
 * Shows real-time benefit breakdown, confirmation progress, and Save & Submit action.
 * Consumed by: GuidedWorkspace (expert mode sidebar)
 * Depends on: theme (C, fmt), Member types (BenefitResult, etc.)
 */
import { C, fmt } from '@/theme'
import type { BenefitResult, ServiceCreditSummary, DROResult, PaymentOptionsResult } from '@/types/Member'

function SumRow({ label, value, done, color }: {
  label: string; value: string; done: boolean; color?: string
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', padding: '4px 0',
    }}>
      <span style={{ color: C.text, fontSize: '11px' }}>{label}</span>
      <span style={{
        color: color || C.text, fontFamily: 'monospace', fontSize: '11px', fontWeight: 600,
      }}>{value}{done && <span style={{ color: C.success, marginLeft: '4px' }}>{'\u2713'}</span>}</span>
    </div>
  )
}

export function LiveSummary({
  confirmed, panelCount, ben, opts, dro, sc, electedOption,
  leavePayout, tc, ruleType, ruleSum, ruleMet, reductionPct, onSave,
}: {
  confirmed: Set<string>; panelCount: number
  ben?: BenefitResult; opts?: PaymentOptionsResult; dro?: DROResult
  sc?: ServiceCreditSummary; electedOption: string; leavePayout: number
  tc: { color: string; muted: string; label: string; sub: string }
  ruleType: string; ruleSum: number; ruleMet: boolean; reductionPct: number
  onSave: () => void
}) {
  const allDone = confirmed.size >= panelCount
  const elOpt = opts?.options.find(o => o.option_type === electedOption)
  const monthlyBenefit = elOpt?.monthly_amount ?? ben?.net_monthly_benefit ?? 0
  const survivorAmt = elOpt && elOpt.survivor_pct
    ? elOpt.monthly_amount * (elOpt.survivor_pct / 100)
    : 0

  return (
    <div data-discovery="live-summary" style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          color: C.text, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1.5px', fontWeight: 600,
        }}>Live Calculation</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {/* Hero benefit amount */}
        <div style={{
          textAlign: 'center' as const, padding: '14px 8px', background: C.accentMuted,
          borderRadius: '8px', border: `1px solid ${C.accentSolid}`, marginBottom: '10px',
        }}>
          <div style={{ color: C.textSecondary, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
            {dro ? 'Monthly (after DRO)' : 'Monthly Benefit'}
          </div>
          <div style={{
            color: confirmed.has('benefit') ? C.accent : C.text,
            fontSize: '26px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px',
            textShadow: confirmed.has('benefit') ? `0 0 25px ${C.accentGlow}` : 'none',
          }}>
            {fmt(monthlyBenefit)}
          </div>
          {ben && (
            <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
              {ben.formula_display?.split('=')[0]?.trim()}
            </div>
          )}
          {!confirmed.has('benefit') && (
            <div style={{ color: C.warm, fontSize: '9px', marginTop: '4px', fontStyle: 'italic' }}>Pending confirmation</div>
          )}
        </div>

        {/* Line items */}
        <div style={{ fontSize: '11px' }}>
          <SumRow label={tc.label} value={tc.sub} done={confirmed.has('elig')} color={tc.color} />
          <SumRow label={ruleType} value={`${ruleSum.toFixed(2)} ${ruleMet ? '\u2713' : '\u2717'}`}
            done={confirmed.has('confirm')} color={ruleMet ? C.success : C.danger} />
          {reductionPct > 0 && <SumRow label="Reduction" value={`${reductionPct}%`} done={confirmed.has('elig')} color={C.danger} />}
          {ben && <SumRow label="AMS" value={fmt(ben.ams)} done={confirmed.has('salary')} />}
          {leavePayout > 0 && <SumRow label="Salary Spike" value={fmt(leavePayout)} done={confirmed.has('salary')} color={C.warm} />}
          {sc && sc.purchased_service_years > 0 && (
            <SumRow label="Purchased Svc" value={`${sc.purchased_service_years}y`} done={confirmed.has('purch')} color={C.warm} />
          )}
          {ben && <SumRow label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}%`} done={confirmed.has('benefit')} />}
          {ben && <SumRow label="Service" value={`${ben.service_years_for_benefit}y`} done={confirmed.has('benefit')} />}

          {dro && (<>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
            <SumRow label="DRO Split" value={fmt(dro.alternate_payee_amount)} done={confirmed.has('dro')} color="#A855F7" />
            <SumRow label="After DRO" value={fmt(dro.member_net_after_dro)} done={confirmed.has('dro')} />
          </>)}

          <div style={{ borderTop: `1px solid ${C.border}`, margin: '6px 0' }} />
          {elOpt && <SumRow label="Option" value={elOpt.option_name} done={confirmed.has('payment')} />}
          {survivorAmt > 0 && <SumRow label="Survivor" value={`${fmt(survivorAmt)}/mo`} done={confirmed.has('payment')} />}
          {ben?.annual_increase && <SumRow label="Annual Increase" value={`${(ben.annual_increase.rate * 100).toFixed(1)}%`} done={confirmed.has('supplemental')} />}
        </div>
      </div>

      {/* Progress + actions */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.borderSubtle}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ color: C.text, fontSize: '10px', textTransform: 'uppercase' as const, letterSpacing: '0.5px', fontWeight: 600 }}>Progress</span>
          <span style={{ color: allDone ? C.success : C.text, fontSize: '10px', fontWeight: 600 }}>
            {confirmed.size} / {panelCount}
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: C.border, overflow: 'hidden' }}>
          <div style={{
            width: `${(confirmed.size / panelCount) * 100}%`,
            height: '100%', borderRadius: '2px',
            background: allDone ? C.success : `linear-gradient(90deg,${C.accent},#00695c)`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {allDone && (
          <button onClick={onSave} style={{
            width: '100%', marginTop: '8px', padding: '8px', borderRadius: '6px', border: 'none',
            background: `linear-gradient(135deg,${C.success},#1b5e20)`,
            color: 'white', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
          }}>
            Save & Submit
          </button>
        )}
      </div>
    </div>
  )
}
