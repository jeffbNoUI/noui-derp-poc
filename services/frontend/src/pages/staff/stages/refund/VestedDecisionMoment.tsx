/**
 * VestedDecisionMoment stage — refund vs deferred pension comparison for vested members.
 * Shows the RULE-REFUND-DEFERRED and RULE-REFUND-VESTED determinations.
 * Only rendered when the member is vested (service >= 5 years).
 *
 * Consumed by: RefundWorkspace (parent page component)
 * Depends on: types/Refund.ts (DeferredComparison, RefundEligibility), theme.ts (C, fmt)
 */
import type { DeferredComparison } from '@/types/Refund'
import { C, fmt } from '@/theme'

interface Props {
  comparison: DeferredComparison
  serviceYears: number
  memberAge: number
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

function ComparisonRow({ label, refundValue, deferredValue, highlight }: {
  label: string; refundValue: string; deferredValue: string; highlight?: 'refund' | 'deferred'
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr',
      padding: '5px 0', borderBottom: `1px solid ${C.borderSubtle}`,
      fontSize: '11px',
    }}>
      <span style={{ color: C.textSecondary }}>{label}</span>
      <span style={{
        textAlign: 'right', fontFamily: 'monospace', fontWeight: 600,
        color: highlight === 'refund' ? C.accent : C.text,
        textShadow: highlight === 'refund' ? `0 0 14px ${C.accentGlow}` : 'none',
      }}>{refundValue}</span>
      <span style={{
        textAlign: 'right', fontFamily: 'monospace', fontWeight: 600,
        color: highlight === 'deferred' ? C.accent : C.text,
        textShadow: highlight === 'deferred' ? `0 0 14px ${C.accentGlow}` : 'none',
      }}>{deferredValue}</span>
    </div>
  )
}

export function VestedDecisionMoment({ comparison, serviceYears, memberAge }: Props) {
  const c = comparison

  return (
    <div>
      {/* Forfeiture warning banner */}
      <div style={{
        padding: '10px 12px', borderRadius: '6px', marginBottom: '8px',
        background: C.dangerMuted, border: `1px solid ${C.dangerBorder}`,
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <Badge text="Forfeiture Required" color={C.danger} bg={C.dangerMuted} />
        <span style={{ color: C.text, fontSize: '11px' }}>
          Vested member ({serviceYears.toFixed(2)} years) — refund permanently forfeits all pension rights
        </span>
      </div>

      {/* Side-by-side comparison header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr',
        padding: '6px 0', marginBottom: '4px',
        fontSize: '9px', textTransform: 'uppercase' as const,
        letterSpacing: '0.8px', color: C.textMuted, fontWeight: 600,
      }}>
        <span />
        <span style={{ textAlign: 'right' }}>Refund Now</span>
        <span style={{ textAlign: 'right' }}>Deferred Pension</span>
      </div>

      {/* Comparison rows */}
      <ComparisonRow
        label="Immediate Value"
        refundValue={fmt(c.refund_gross)}
        deferredValue="$0"
        highlight="refund"
      />
      <ComparisonRow
        label="Monthly at Age 65"
        refundValue="$0"
        deferredValue={fmt(c.deferred_monthly_at_65)}
        highlight="deferred"
      />
      <ComparisonRow
        label="Annual at Age 65"
        refundValue="$0"
        deferredValue={fmt(c.deferred_annual_at_65)}
        highlight="deferred"
      />
      <ComparisonRow
        label="Years to Age 65"
        refundValue="—"
        deferredValue={`${c.years_to_age_65} years`}
      />
      <ComparisonRow
        label="Breakeven After 65"
        refundValue="—"
        deferredValue={`~${c.breakeven_years_after_65.toFixed(1)} years`}
      />
      <ComparisonRow
        label="Lifetime Value (to 85)"
        refundValue={fmt(c.refund_gross)}
        deferredValue={fmt(c.lifetime_value_at_85)}
        highlight="deferred"
      />

      {/* Formula */}
      <div style={{
        padding: '6px 10px', marginTop: '8px', background: C.elevated, borderRadius: '5px',
        border: `1px solid ${C.borderSubtle}`, fontFamily: 'monospace',
        fontSize: '10px', color: C.textSecondary,
      }}>
        {c.formula}
      </div>

      {/* Analysis callout */}
      <div style={{
        padding: '10px 12px', marginTop: '8px', borderRadius: '6px',
        background: C.elevated, border: `1px solid ${C.border}`,
      }}>
        <div style={{ color: C.text, fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
          Decision Analysis
        </div>
        <div style={{ color: C.textSecondary, fontSize: '11px', lineHeight: '1.5' }}>
          The deferred pension would begin at age 65 (in {c.years_to_age_65} years)
          and pay {fmt(c.deferred_monthly_at_65)}/month. After approximately {c.breakeven_years_after_65.toFixed(1)} years
          of pension payments (age {65 + c.breakeven_years_after_65}), the cumulative pension
          exceeds the refund amount.
          {c.lifetime_value_at_85 > c.refund_gross * 3 && (
            <span style={{ color: C.accent, fontWeight: 600 }}>
              {' '}The lifetime value to age 85 is {(c.lifetime_value_at_85 / c.refund_gross).toFixed(1)}x the refund amount.
            </span>
          )}
        </div>
      </div>

      {/* Legal warning */}
      <div style={{
        padding: '8px 10px', marginTop: '6px', borderRadius: '6px',
        background: C.dangerMuted, border: `1px solid ${C.dangerBorder}`,
      }}>
        <div style={{ color: C.danger, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Irrevocable Decision — C.R.S. &sect;24-51-401
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          Taking a refund permanently forfeits all pension rights. This decision cannot be reversed.
          The member should be advised to consider the long-term financial impact before proceeding.
          Current age: {memberAge}. Service: {serviceYears.toFixed(2)} years.
        </div>
      </div>
    </div>
  )
}
