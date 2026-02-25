/**
 * Purchase cost calculation display — shows actuarial cost factor, formula, and total.
 * Renders the step-by-step cost breakdown and three payment option columns.
 *
 * Consumed by: PurchaseExplorer.tsx
 * Depends on: Member.ts (ServicePurchaseQuote), theme.ts (C, fmt)
 */
import type { ServicePurchaseQuote } from '@/types/Member'
import { C, fmt } from '@/theme'

// ─── Shared Field and Badge (same pattern as BenefitWorkspace) ───────────

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const,
      lineHeight: '14px', whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  )
}

function Field({ label, value, highlight, badge, sub }: {
  label: string; value: string; highlight?: boolean
  badge?: { text: string; bg: string; color: string } | null; sub?: string | null
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
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {badge && <Badge {...badge} />}
        <span style={{
          color: highlight ? C.accent : C.text, fontWeight: 600,
          fontFamily: "'SF Mono',monospace", fontSize: '12px',
          textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
        }}>{value}</span>
      </span>
    </div>
  )
}

export function PurchaseCostSection({ quote }: { quote: ServicePurchaseQuote }) {
  const pd = quote.payment_options.payroll_deduction

  return (
    <div>
      {/* Cost Factor Formula */}
      <div style={{
        padding: '12px', background: C.accentMuted, borderRadius: '7px',
        border: `1px solid ${C.accentSolid}`, textAlign: 'center' as const, marginBottom: '10px',
      }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px',
        }}>RULE-PURCHASE-COST-FACTOR -- RMC &sect;18-415(c)</div>
        <div style={{
          color: C.accent, fontSize: '22px', fontWeight: 700, fontFamily: 'monospace',
          marginTop: '4px', textShadow: `0 0 25px ${C.accentGlow}`,
        }}>{fmt(quote.total_cost)}</div>
        <div style={{ color: C.textSecondary, fontSize: '10.5px', marginTop: '3px', fontFamily: 'monospace' }}>
          {quote.cost_factor.toFixed(4)} x {fmt(quote.current_annual_salary)} x {quote.years_requested.toFixed(1)} years
        </div>
      </div>

      {/* Cost Breakdown */}
      <Field label="Cost Factor" value={quote.cost_factor.toFixed(4)}
        sub={`Tier ${quote.tier}, age ${quote.member_age} -- actuarial table`}
        badge={{ text: 'RMC §18-415(c)', bg: C.accentMuted, color: C.accent }} />
      <Field label="Current Annual Salary" value={fmt(quote.current_annual_salary)} />
      <Field label="Years Purchased" value={`${quote.years_requested.toFixed(1)} years`} />
      <Field label="Cost Per Year" value={fmt(quote.cost_per_year)}
        sub={`${quote.cost_factor.toFixed(4)} x ${fmt(quote.current_annual_salary)}`} />
      <Field label="Total Cost" value={fmt(quote.total_cost)} highlight />

      {/* Payment Options Comparison */}
      <div style={{ marginTop: '12px' }}>
        <div style={{
          color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1px', fontWeight: 600, marginBottom: '6px',
        }}>Payment Options -- RMC &sect;18-415(d)</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
          {/* Lump Sum */}
          <div style={{
            padding: '10px', background: C.elevated, borderRadius: '6px',
            border: `1px solid ${C.accent}`, textAlign: 'center' as const,
          }}>
            <div style={{ color: C.accent, fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>Lump Sum</div>
            <div style={{ color: C.accent, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
              {fmt(quote.payment_options.lump_sum.total)}
            </div>
            <div style={{ color: C.textMuted, fontSize: '9px', marginTop: '2px' }}>One-time payment</div>
            <div style={{ color: C.success, fontSize: '9px', marginTop: '2px' }}>No interest</div>
          </div>

          {/* Payroll Deduction */}
          <div style={{
            padding: '10px', background: C.elevated, borderRadius: '6px',
            border: `1px solid ${C.border}`, textAlign: 'center' as const,
          }}>
            <div style={{ color: C.warm, fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>Payroll Deduction</div>
            <div style={{ color: C.text, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
              {fmt(pd.monthly_payment)}/mo
            </div>
            <div style={{ color: C.textMuted, fontSize: '9px', marginTop: '2px' }}>
              {pd.number_of_payments} months @ {(pd.annual_interest_rate * 100).toFixed(0)}%
            </div>
            <div style={{ color: C.warm, fontSize: '9px', marginTop: '2px' }}>
              +{fmt(pd.interest_cost)} interest
            </div>
            <div style={{ color: C.textSecondary, fontSize: '9px', marginTop: '1px' }}>
              Total: {fmt(pd.total_paid)}
            </div>
          </div>

          {/* Rollover */}
          <div style={{
            padding: '10px', background: C.elevated, borderRadius: '6px',
            border: `1px solid ${C.border}`, textAlign: 'center' as const,
          }}>
            <div style={{ color: C.success, fontSize: '10px', fontWeight: 600, marginBottom: '4px' }}>Rollover</div>
            <div style={{ color: C.text, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace' }}>
              {fmt(quote.payment_options.rollover.amount)}
            </div>
            <div style={{ color: C.textMuted, fontSize: '9px', marginTop: '2px' }}>From qualified plan</div>
            <div style={{ color: C.success, fontSize: '9px', marginTop: '2px' }}>No tax impact</div>
          </div>
        </div>
      </div>
    </div>
  )
}
