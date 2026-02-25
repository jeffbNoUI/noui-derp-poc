/**
 * Death processing Stage 5 — Death Benefit Continuation.
 * Shows the death benefit installment election (50 or 100 monthly installments),
 * how many have been paid, how many remain, and the remaining total.
 * Only applicable for retired members who elected installment payments.
 * Consumed by: future DeathWorkspace (stage renderer)
 * Depends on: DeathStageProps, theme (C, fmt), Field
 */
import type { DeathStageProps } from './DeathStageProps.ts'
import { C, fmt } from '@/theme.ts'
import { Field } from '@/components/shared/Field.tsx'
// Badge colors are passed as props to Field component's badge parameter

export function DeathBenefitContinuation({ deathBenefitElection: dbe, installments, processingSummary: ps }: DeathStageProps) {
  // Active member deaths don't have installment elections
  if (!dbe && !installments) {
    return (
      <div>
        <div style={{
          padding: '8px 10px', borderRadius: '6px',
          background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
        }}>
          <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
            Not Applicable
          </div>
          <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
            Death benefit installments apply only to retired members who elected
            installment payments at retirement. This section is informational.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Election details */}
      {dbe && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Death Benefit Installment Election
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <Field label="Lump Sum Amount" value={fmt(dbe.lump_sum_amount)}
              sub="Total death benefit elected at retirement" />
            <Field label="Installments Elected" value={String(dbe.num_installments)}
              badge={{ text: `${dbe.num_installments} months`, bg: C.accentMuted, color: C.accent }} />
            <Field label="Per Installment" value={fmt(dbe.installment_amount)}
              sub={`${fmt(dbe.lump_sum_amount)} / ${dbe.num_installments}`} />
            <Field label="Effective Date" value={dbe.effective_date} />
            <Field label="Status" value={dbe.status}
              badge={{
                text: dbe.status,
                bg: dbe.status === 'TRANSFERRED' ? C.successMuted : C.warmMuted,
                color: dbe.status === 'TRANSFERRED' ? C.success : C.warm,
              }} />
            {dbe.beneficiary_first_name && (
              <Field label="Beneficiary" value={`${dbe.beneficiary_first_name} ${dbe.beneficiary_last_name}`}
                sub={dbe.beneficiary_relationship ? `Relationship: ${dbe.beneficiary_relationship}` : undefined} />
            )}
          </div>
        </>
      )}

      {/* Installment calculation */}
      {installments && (
        <>
          <div style={{
            padding: '6px 8px', background: C.elevated, borderRadius: '6px 6px 0 0',
            border: `1px solid ${C.borderSubtle}`, borderBottom: 'none',
            fontSize: '9px', fontWeight: 600, color: C.textMuted,
            textTransform: 'uppercase' as const, letterSpacing: '1px',
          }}>
            Remaining Installments
          </div>
          <div style={{
            padding: '8px 10px', borderRadius: '0 0 6px 6px',
            border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <Field label="Paid" value={String(installments.installments_paid)}
              badge={{ text: 'Complete', bg: C.successMuted, color: C.success }} />
            <Field label="Remaining" value={String(installments.installments_remaining)}
              badge={installments.installments_remaining > 0
                ? { text: 'Pending', bg: C.warmMuted, color: C.warm }
                : { text: 'All Paid', bg: C.successMuted, color: C.success }} />
            <Field label="Remaining Amount" value={fmt(installments.remaining_total)} highlight
              sub="Total to be paid to designated beneficiary" />
          </div>

          {/* Progress bar visualization */}
          <div style={{
            padding: '8px 10px', borderRadius: '6px',
            background: C.elevated, border: `1px solid ${C.borderSubtle}`, marginBottom: '10px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: C.textMuted, fontSize: '10px' }}>Payment Progress</span>
              <span style={{ color: C.textSecondary, fontSize: '10px', fontFamily: "'SF Mono',monospace" }}>
                {installments.installments_paid}/{installments.installments_paid + installments.installments_remaining}
              </span>
            </div>
            <div style={{
              height: '6px', borderRadius: '3px', background: C.borderSubtle, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '3px', background: C.accent,
                width: `${(installments.installments_paid / (installments.installments_paid + installments.installments_remaining)) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Formula transparency */}
          <div style={{
            padding: '8px 10px', borderRadius: '6px',
            background: C.elevated, border: `1px solid ${C.borderSubtle}`,
          }}>
            <div style={{ color: C.textMuted, fontSize: '9px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px' }}>
              Calculation Formula
            </div>
            <div style={{
              color: C.accent, fontSize: '11px', fontFamily: "'SF Mono',monospace",
              lineHeight: '1.6',
            }}>
              {installments.formula}
            </div>
            <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '4px' }}>
              Source: RMC {'\u00A7'}18-411(d)
            </div>
          </div>
        </>
      )}

      {/* Trace steps */}
      {ps?.calculation_trace?.filter(t => t.rule_id === 'RULE-DEATH-INSTALLMENTS').map(s => (
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
