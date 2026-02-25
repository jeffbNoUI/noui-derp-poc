/**
 * RefundReview stage — final summary with all amounts, audit trail, and confirmation.
 * Shows the complete RULE-REFUND-* chain result for staff verification.
 *
 * Consumed by: RefundWorkspace (parent page component)
 * Depends on: types/Refund.ts (RefundCalculation), types/Member.ts (AuditEntry), theme.ts (C, fmt)
 */
import type { RefundCalculation } from '@/types/Refund'
import type { AuditEntry } from '@/types/Member'
import { C, fmt } from '@/theme'

interface Props {
  calculation: RefundCalculation
  memberName: string
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

function SummaryRow({ label, value, color, bold, sub }: {
  label: string; value: string; color?: string; bold?: boolean; sub?: string
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '5px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <div>
        <span style={{ color: C.textSecondary, fontSize: '12px' }}>{label}</span>
        {sub && <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>{sub}</div>}
      </div>
      <span style={{
        color: color || C.text, fontFamily: 'monospace', fontSize: bold ? '14px' : '12px',
        fontWeight: bold ? 700 : 600,
        textShadow: bold ? `0 0 14px ${C.accentGlow}` : 'none',
      }}>{value}</span>
    </div>
  )
}

function AuditTrail({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) return null

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
        letterSpacing: '0.8px', marginBottom: '4px',
      }}>
        Complete Audit Trail
      </div>
      <div style={{ borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
        {entries.map((entry, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '140px 1fr auto',
            gap: '6px', padding: '4px 8px', fontSize: '10px',
            borderTop: i > 0 ? `1px solid ${C.borderSubtle}` : 'none',
            background: i % 2 === 0 ? 'transparent' : C.elevated,
          }}>
            <span style={{ color: C.textMuted, fontFamily: 'monospace', flexShrink: 0 }}>
              {entry.rule_id}
            </span>
            <span style={{ color: C.textSecondary }}>
              {entry.description}
            </span>
            <span style={{ color: C.text, fontWeight: 600, textAlign: 'right' as const }}>
              {entry.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RefundReview({ calculation, memberName }: Props) {
  const calc = calculation
  const elig = calc.eligibility

  return (
    <div>
      {/* Status banner */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px', marginBottom: '8px',
        background: elig.eligible ? C.successMuted : C.dangerMuted,
        border: `1px solid ${elig.eligible ? C.successBorder : C.dangerBorder}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Badge
          text={elig.eligible ? 'Eligible' : 'Not Eligible'}
          color={elig.eligible ? C.success : C.danger}
          bg={elig.eligible ? C.successMuted : C.dangerMuted}
        />
        {elig.vested && (
          <Badge text="Vested — Forfeiture" color={C.danger} bg={C.dangerMuted} />
        )}
        <span style={{ color: C.text, fontSize: '11px', flex: 1 }}>{memberName}</span>
      </div>

      {/* Gross refund hero */}
      <div style={{
        padding: '12px', background: C.accentMuted, borderRadius: '7px',
        border: `1px solid ${C.accentSolid}`, textAlign: 'center' as const, marginBottom: '8px',
      }}>
        <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px' }}>
          Gross Refund Amount
        </div>
        <div style={{
          color: C.accent, fontSize: '28px', fontWeight: 700, fontFamily: 'monospace',
          marginTop: '4px', textShadow: `0 0 30px ${C.accentGlow}`,
        }}>
          {fmt(calc.gross_refund)}
        </div>
      </div>

      {/* Calculation breakdown */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px',
        background: C.elevated, border: `1px solid ${C.borderSubtle}`, marginBottom: '8px',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '0.8px', marginBottom: '6px',
        }}>
          Calculation Summary
        </div>

        <SummaryRow
          label="Employee Contributions"
          value={fmt(calc.contributions.total_contributions)}
          sub={`${calc.contributions.month_count} months at 8.45%`}
        />
        <SummaryRow
          label="Accrued Interest"
          value={`+${fmt(calc.interest.total_interest)}`}
          color={C.accent}
          sub={`${(calc.interest.interest_rate * 100).toFixed(1)}% annual, ${calc.interest.credits.length} compounding periods`}
        />
        <SummaryRow
          label="Gross Refund"
          value={fmt(calc.gross_refund)}
          color={C.accent}
          bold
        />
      </div>

      {/* Distribution options summary */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px',
        background: C.elevated, border: `1px solid ${C.borderSubtle}`, marginBottom: '8px',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '0.8px', marginBottom: '6px',
        }}>
          Distribution Options
        </div>
        {calc.tax_options.map((opt, i) => {
          const label = opt.election_type === 'direct_payment' ? 'Direct Payment'
            : opt.election_type === 'direct_rollover' ? 'Direct Rollover'
            : 'Partial Rollover'
          return (
            <SummaryRow
              key={i}
              label={label}
              value={fmt(opt.net_payment)}
              sub={opt.withholding_amount > 0
                ? `${fmt(opt.withholding_amount)} withholding (${(opt.withholding_rate * 100).toFixed(0)}%)`
                : 'No withholding'}
            />
          )
        })}
      </div>

      {/* Deferred comparison summary (vested only) */}
      {calc.deferred_comparison && (
        <div style={{
          padding: '10px 12px', borderRadius: '6px',
          background: C.dangerMuted, border: `1px solid ${C.dangerBorder}`, marginBottom: '8px',
        }}>
          <div style={{
            color: C.danger, fontSize: '9px', textTransform: 'uppercase' as const,
            letterSpacing: '0.8px', marginBottom: '6px', fontWeight: 600,
          }}>
            Deferred Pension Alternative
          </div>
          <SummaryRow
            label="Monthly at 65"
            value={fmt(calc.deferred_comparison.deferred_monthly_at_65)}
            color={C.accent}
          />
          <SummaryRow
            label="Annual at 65"
            value={fmt(calc.deferred_comparison.deferred_annual_at_65)}
          />
          <SummaryRow
            label="Breakeven"
            value={`~${calc.deferred_comparison.breakeven_years_after_65.toFixed(1)} years after 65`}
          />
          <SummaryRow
            label="Lifetime Value (to 85)"
            value={fmt(calc.deferred_comparison.lifetime_value_at_85)}
            color={C.accent}
            bold
          />
        </div>
      )}

      {/* Eligibility details */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px',
        background: C.elevated, border: `1px solid ${C.borderSubtle}`, marginBottom: '8px',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '0.8px', marginBottom: '6px',
        }}>
          Eligibility Details
        </div>
        <SummaryRow label="Service Years" value={`${elig.service_years.toFixed(2)} years`} />
        <SummaryRow
          label="Vested"
          value={elig.vested ? 'Yes' : 'No'}
          sub={elig.vested ? 'Service >= 5 years' : 'Service < 5 years'}
        />
        <SummaryRow
          label="Waiting Period"
          value={elig.waiting_period_met ? 'Met' : 'Not Met'}
          sub={`${elig.days_since_termination} days since termination (90 required)`}
        />
        <SummaryRow
          label="Earliest Application"
          value={elig.earliest_application_date}
        />
      </div>

      {/* Audit trail */}
      <AuditTrail entries={calc.audit_trail} />
    </div>
  )
}
