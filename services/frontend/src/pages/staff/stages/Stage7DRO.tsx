/**
 * Guided mode Stage 7 — DRO Processing (conditional).
 * Marital fraction, split, alternate payee, sequence note.
 * Only rendered when DROs exist for the member.
 * Consumed by: GuidedWorkspace (stage renderer)
 * Depends on: StageProps, theme (C, fmt), Badge
 */
import type { StageProps } from './StageProps'
import { C, fmt } from '@/theme'
import { Field } from '@/components/shared/Field'

export function Stage7DRO({ member: m, dros, droCalc: dro, paymentOptions: opts }: StageProps) {
  if (!dro || !dros || dros.length === 0) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Loading DRO data...</div>
  }

  const droRecord = dros[0]

  return (
    <div>
      <Field label="Former Spouse" value={dro.alternate_payee_name} />
      <Field label="Case Number" value={droRecord.case_number}
        badge={{ text: droRecord.status, bg: C.warmMuted, color: C.warm }} />
      <Field label="Marriage" value={`${droRecord.marriage_date} \u2014 ${droRecord.divorce_date}`} />
      <Field label="Service During Marriage" value={`${dro.marital_service_years}y`}
        sub={`Out of ${dro.total_service_years}y total`} />

      {/* Marital fraction visualization */}
      <div style={{ margin: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span style={{ color: C.textSecondary, fontSize: '10.5px' }}>Marital Fraction</span>
          <span style={{ color: C.accent, fontSize: '11px', fontFamily: 'monospace', fontWeight: 600 }}>
            {dro.marital_service_years} / {dro.total_service_years} = {(dro.marital_fraction * 100).toFixed(2)}%
          </span>
        </div>
        <div style={{ height: '6px', borderRadius: '3px', background: C.elevated, overflow: 'hidden' }}>
          <div style={{
            width: `${dro.marital_fraction * 100}%`, height: '100%', borderRadius: '3px',
            background: `linear-gradient(90deg,${C.warm},${C.danger})`,
          }} />
        </div>
      </div>

      <Field label="Gross Benefit" value={fmt(dro.member_gross_benefit)} />
      <Field label="Marital Share" value={fmt(dro.marital_share)}
        sub={`${fmt(dro.member_gross_benefit)} \u00D7 ${(dro.marital_fraction * 100).toFixed(2)}%`} />
      <Field label="DRO Award"
        value={`${Math.round((dro.alternate_payee_amount / dro.marital_share) * 100)}% of marital`} />
      <Field label={`${dro.alternate_payee_name.split(' ')[0]}'s Monthly`}
        value={fmt(dro.alternate_payee_amount)} highlight />
      <Field label="Member's Remaining" value={fmt(dro.member_net_after_dro)} highlight />

      {/* Monthly summary table */}
      <div style={{
        marginTop: '8px', borderRadius: '6px', overflow: 'hidden',
        border: `1px solid ${C.borderSubtle}`,
      }}>
        <div style={{
          padding: '6px 10px', background: C.elevated, fontSize: '10px', fontWeight: 600,
          color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        }}>Monthly Summary</div>
        {[
          { w: `${m.first_name} (75% J&S)`, a: opts?.options.find(o => o.option_type === 'j&s_75')?.monthly_amount ?? dro.member_net_after_dro, cl: C.accent },
          { w: `${dro.alternate_payee_name.split(' ')[0]} (DRO)`, a: dro.alternate_payee_amount, cl: C.warm },
        ].map(r => (
          <div key={r.w} style={{
            display: 'flex', justifyContent: 'space-between', padding: '6px 10px',
            borderTop: `1px solid ${C.borderSubtle}`, fontSize: '11px',
          }}>
            <span style={{ color: C.text }}>{r.w}</span>
            <span style={{ color: r.cl, fontFamily: 'monospace', fontWeight: 600 }}>{fmt(r.a)}</span>
          </div>
        ))}
      </div>

      {/* Sequence callout */}
      <div style={{
        marginTop: '8px', padding: '8px 10px', background: C.accentMuted,
        borderRadius: '6px', border: `1px solid ${C.accentSolid}`,
      }}>
        <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Sequence Note
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          DRO split is applied before payment option selection. Payment options are calculated
          on {fmt(dro.member_net_after_dro)}, not {fmt(dro.member_gross_benefit)}. Per C.R.S. {'\u00A7'}24-51-603.
        </div>
      </div>
    </div>
  )
}
