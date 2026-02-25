/**
 * Death processing Stage 6 — Final Review & Record Transition.
 * Displays the complete death processing summary: notification, overpayment,
 * survivor benefit, installments, record transitions, and full calculation trace.
 * This is the final review stage before the case is closed.
 * Consumed by: future DeathWorkspace (stage renderer)
 * Depends on: DeathStageProps, theme (C, fmt), Field, Badge
 */
import type { DeathStageProps } from './DeathStageProps.ts'
import { C, fmt } from '@/theme.ts'
import { Field } from '@/components/shared/Field.tsx'
import { Badge } from '@/components/shared/Badge.tsx'

export function DeathProcessingReview({ member: m, processingSummary: ps }: DeathStageProps) {
  if (!ps) {
    return <div style={{ color: C.textMuted, fontSize: '11px', padding: '8px 0' }}>Processing summary not available.</div>
  }

  return (
    <div>
      {/* Summary header */}
      <div style={{
        padding: '10px 12px', marginBottom: '10px', borderRadius: '6px',
        background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
      }}>
        <div style={{ color: C.accent, fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
          Death Processing Summary
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.5' }}>
          Review all death processing actions for {m.first_name} {m.last_name} (ID: {ps.member_id}).
          Verify each section before closing the case.
        </div>
      </div>

      {/* Notification summary */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Notification
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        <Field label="Status Transition" value={ps.notification.status_transition} />
        <Field label="Benefit Suspended" value={ps.notification.benefit_suspended ? 'Yes' : 'No'}
          badge={ps.notification.benefit_suspended
            ? { text: 'Suspended', bg: C.dangerMuted, color: C.danger }
            : undefined} />
        <Field label="Certificate Required" value={ps.notification.certificate_required ? 'Yes' : 'No'} />
        {ps.notification.note && (
          <div style={{ color: C.textSecondary, fontSize: '10.5px', padding: '4px 0', lineHeight: '1.4' }}>
            {ps.notification.note}
          </div>
        )}
      </div>

      {/* Overpayment summary */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Overpayment
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        <Field label="Overpayments" value={String(ps.overpayment.overpayment_count)}
          badge={ps.overpayment.overpayment_count === 0
            ? { text: 'Clear', bg: C.successMuted, color: C.success }
            : { text: fmt(ps.overpayment.overpayment_total), bg: C.dangerMuted, color: C.danger }} />
        <Field label="Valid Payments" value={String(ps.overpayment.valid_payments)} />
      </div>

      {/* Survivor benefit summary */}
      {ps.survivor_benefit && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Survivor Benefit
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <Field label="Survivor" value={ps.survivor_benefit.survivor_name} />
            <Field label="Monthly Amount" value={fmt(ps.survivor_benefit.survivor_monthly_benefit)} highlight />
            <Field label="J&S %" value={`${Math.round(ps.survivor_benefit.js_percentage * 100)}%`} />
            <Field label="Effective" value={ps.survivor_benefit.effective_date} />
          </div>
        </>
      )}

      {/* Active member death summary */}
      {ps.active_member_death && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Active Member Death Benefit
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <Field label="Benefit Type" value={ps.active_member_death.vested ? 'Survivor Annuity' : 'Contribution Refund'} />
            {ps.active_member_death.refund_amount != null && (
              <Field label="Refund Amount" value={fmt(ps.active_member_death.refund_amount)} highlight />
            )}
            <Field label="Vested" value={ps.active_member_death.vested ? 'Yes' : 'No'}
              badge={ps.active_member_death.vested
                ? { text: 'Vested', bg: C.successMuted, color: C.success }
                : { text: 'Non-Vested', bg: C.warmMuted, color: C.warm }} />
          </div>
        </>
      )}

      {/* Installments summary */}
      {ps.death_benefit_installments && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Death Benefit Installments
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <Field label="Paid / Remaining" value={`${ps.death_benefit_installments.installments_paid} / ${ps.death_benefit_installments.installments_remaining}`} />
            <Field label="Remaining Amount" value={fmt(ps.death_benefit_installments.remaining_total)} highlight />
          </div>
        </>
      )}

      {/* Record transition */}
      <div style={{
        padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
        border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
        fontSize: '9px', fontWeight: 600, color: C.textMuted,
        textTransform: 'uppercase' as const, letterSpacing: '1px',
      }}>
        Record Transition
      </div>
      <div style={{
        padding: '8px 10px', borderRadius: '0 0 6px 6px',
        border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 0',
        }}>
          {ps.record_transition.status_sequence.map((status, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {i > 0 && <span style={{ color: C.textDim, fontSize: '10px' }}>{'\u2192'}</span>}
              <Badge
                text={status}
                bg={status === 'DECEASED' ? C.dangerMuted : status === 'SUSPENDED' ? C.warmMuted : C.accentMuted}
                color={status === 'DECEASED' ? C.danger : status === 'SUSPENDED' ? C.warm : C.accent}
              />
            </span>
          ))}
        </div>
        <Field label="Survivor Record Created" value={ps.record_transition.survivor_record_created ? 'Yes' : 'No'}
          badge={ps.record_transition.survivor_record_created
            ? { text: 'Created', bg: C.successMuted, color: C.success }
            : { text: 'N/A', bg: C.borderSubtle, color: C.textDim }} />
        <Field label="Benefit Terminated" value={ps.record_transition.benefit_terminated ? 'Yes' : 'No'} />
      </div>

      {/* Full calculation trace */}
      {ps.calculation_trace.length > 0 && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Complete Calculation Trace
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`,
          }}>
            {ps.calculation_trace.map(s => (
              <div key={s.step} style={{
                padding: '6px 0',
                borderBottom: s.step < ps.calculation_trace.length ? `1px solid ${C.borderSubtle}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    color: C.accent, fontSize: '10px', fontWeight: 700,
                    fontFamily: "'SF Mono',monospace", minWidth: '20px',
                  }}>{s.step}</span>
                  <span style={{ color: C.text, fontSize: '11px', fontWeight: 600 }}>{s.rule_name}</span>
                  <Badge text={s.rule_id} bg={C.elevated} color={C.textMuted} />
                </div>
                <div style={{ color: C.textSecondary, fontSize: '10.5px', marginTop: '2px', marginLeft: '26px' }}>
                  {s.description}
                </div>
                <div style={{
                  color: C.textMuted, fontSize: '9.5px', fontFamily: "'SF Mono',monospace",
                  marginTop: '2px', marginLeft: '26px',
                }}>
                  {s.inputs} {'\u2192'} {s.result}
                </div>
                <div style={{ color: C.textDim, fontSize: '9px', marginTop: '1px', marginLeft: '26px' }}>
                  {s.source_reference}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
