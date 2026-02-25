/**
 * Death processing Stage 4 — Overpayment Review.
 * Detects and displays payments deposited AFTER the date of death.
 * Shows each payment individually with its deposit date and validity.
 * Overpayment is strictly post-death: same-day deposits are valid.
 * Consumed by: future DeathWorkspace (stage renderer)
 * Depends on: DeathStageProps, theme (C, fmt), Field, Badge
 */
import type { DeathStageProps } from './DeathStageProps.ts'
import { C, fmt } from '@/theme.ts'
import { Field } from '@/components/shared/Field.tsx'
import { Badge } from '@/components/shared/Badge.tsx'

export function OverpaymentReview({ deathRecord: dr, overpaymentInfo: opi, processingSummary: ps }: DeathStageProps) {
  if (!dr) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>No death record available.</div>
  }

  // Use overpaymentInfo from processing summary if not passed directly
  const info = opi ?? ps?.overpayment

  return (
    <div>
      {/* Detection summary */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Overpayment Detection
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        <Field label="Date of Death" value={dr.death_date} />
        <Field label="Overpayments Detected" value={info ? String(info.overpayment_count) : '0'}
          badge={info && info.overpayment_count === 0
            ? { text: 'None', bg: C.successMuted, color: C.success }
            : info && info.overpayment_count > 0
              ? { text: `${info.overpayment_count} found`, bg: C.dangerMuted, color: C.danger }
              : undefined} />
        {info && info.overpayment_count > 0 && (
          <Field label="Total Overpayment" value={fmt(info.overpayment_total)} highlight
            sub="Amount to be recovered" />
        )}
        {info && (
          <Field label="Valid Payments" value={String(info.valid_payments)}
            sub="Payments deposited on or before date of death" />
        )}
      </div>

      {/* Payment-by-payment detail */}
      {info && info.payment_details.length > 0 && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Payment Detail
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            {info.payment_details.map((pd, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '6px 0', borderBottom: i < info.payment_details.length - 1 ? `1px solid ${C.borderSubtle}` : 'none',
              }}>
                <Badge
                  text={pd.valid ? 'Valid' : 'Overpaid'}
                  bg={pd.valid ? C.successMuted : C.dangerMuted}
                  color={pd.valid ? C.success : C.danger}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ color: C.text, fontSize: '12px', fontWeight: 500 }}>
                    {pd.deposit_date}
                  </div>
                  <div style={{ color: C.textMuted, fontSize: '10px' }}>{pd.reason}</div>
                </div>
                <span style={{
                  color: pd.valid ? C.text : C.danger, fontWeight: 600,
                  fontFamily: "'SF Mono',monospace", fontSize: '12px',
                }}>{fmt(pd.amount)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No-overpayment note */}
      {info && info.overpayment_count === 0 && (
        <div style={{
          padding: '8px 10px', borderRadius: '6px',
          background: C.successMuted, border: `1px solid ${C.successBorder}`,
        }}>
          <div style={{ color: C.success, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
            No Overpayments
          </div>
          <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
            All payments were deposited on or before the date of death.
            No recovery action is required.
          </div>
        </div>
      )}

      {/* Trace steps */}
      {ps?.calculation_trace?.filter(t => t.rule_id === 'RULE-OVERPAY-DETECT').map(s => (
        <div key={s.step} style={{
          padding: '6px 8px', marginTop: '10px', borderRadius: '4px',
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
