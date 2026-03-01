/**
 * RefundEligibility stage — displays refund eligibility status, vesting, and waiting period.
 * Shows the RULE-REFUND-ELIG and RULE-REFUND-WAIT determinations with full audit trail.
 *
 * Consumed by: RefundWorkspace (parent page component)
 * Depends on: types/Refund.ts (RefundEligibility), theme.ts (C, fmt)
 */
import type { RefundEligibility as RefundEligibilityType } from '@/types/Refund'
import { C } from '@/theme'

interface Props {
  eligibility: RefundEligibilityType
  memberName: string
  terminationDate: string
}

function Field({ label, value, highlight, sub }: {
  label: string; value: string; highlight?: boolean; sub?: string | null
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
      <span style={{
        color: highlight ? C.accent : C.text, fontWeight: 600,
        fontFamily: "'SF Mono',monospace", fontSize: '12px',
        textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
      }}>{value}</span>
    </div>
  )
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const, lineHeight: '14px',
    }}>{text}</span>
  )
}

export function RefundEligibility({ eligibility, memberName, terminationDate }: Props) {
  const e = eligibility

  return (
    <div>
      {/* Status banner */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px', marginBottom: '8px',
        background: e.eligible ? C.successMuted : C.dangerMuted,
        border: `1px solid ${e.eligible ? C.successBorder : C.dangerBorder}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Badge
          text={e.eligible ? 'Eligible' : 'Not Eligible'}
          color={e.eligible ? C.success : C.danger}
          bg={e.eligible ? C.successMuted : C.dangerMuted}
        />
        <span style={{ color: C.text, fontSize: '11px' }}>{e.reason}</span>
      </div>

      <Field label="Member" value={memberName} />
      <Field label="Termination Date" value={terminationDate} />
      <Field label="Service Years" value={`${e.service_years.toFixed(2)} years`} />
      <Field
        label="Vested"
        value={e.vested ? 'Yes' : 'No'}
        sub={e.vested ? 'Service >= 5 years — C.R.S. §24-51-101' : 'Service < 5 years — not vested'}
      />

      {/* Waiting period */}
      <Field
        label="Waiting Period (90 days)"
        value={e.waiting_period_met ? 'Met' : 'Not Met'}
        highlight={e.waiting_period_met}
        sub={`${e.days_since_termination} days since termination`}
      />
      <Field
        label="Earliest Application"
        value={e.earliest_application_date}
        sub="Termination + 90 calendar days — C.R.S. §24-51-401"
      />

      {/* Forfeiture warning for vested members */}
      {e.vested && (
        <div style={{
          padding: '8px 10px', marginTop: '8px', borderRadius: '6px',
          background: C.dangerMuted, border: `1px solid ${C.dangerBorder}`,
        }}>
          <div style={{ color: C.danger, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
            Forfeiture Required — C.R.S. §24-51-401
          </div>
          <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
            As a vested member, taking a refund permanently forfeits all pension rights.
            This decision is irrevocable. Review the deferred pension comparison before proceeding.
          </div>
        </div>
      )}

      {/* Audit trail */}
      {e.audit_trail.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.8px', marginBottom: '4px' }}>
            Audit Trail
          </div>
          {e.audit_trail.map((entry, i) => (
            <div key={i} style={{
              display: 'flex', gap: '6px', padding: '3px 0', fontSize: '10px',
              borderBottom: `1px solid ${C.borderSubtle}`,
            }}>
              <span style={{ color: C.textMuted, fontFamily: 'monospace', flexShrink: 0, width: '140px' }}>{entry.rule_id}</span>
              <span style={{ color: C.textSecondary, flex: 1 }}>{entry.description}</span>
              <span style={{ color: C.text, fontWeight: 600, flexShrink: 0 }}>{entry.result}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
