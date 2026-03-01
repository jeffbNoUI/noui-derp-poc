/**
 * Purchase benefit impact analysis — before/after comparison, breakeven, and
 * the CRITICAL eligibility exclusion callout.
 *
 * Consumed by: PurchaseExplorer.tsx
 * Depends on: Member.ts (ServicePurchaseQuote), theme.ts (C, fmt)
 */
import type { ServicePurchaseQuote } from '@/types/Member'
import { C, hasTableMeta, fmt } from '@/theme'

export function PurchaseImpactSection({ quote }: { quote: ServicePurchaseQuote }) {
  const bi = quote.benefit_impact
  const ex = quote.eligibility_exclusion
  const ht = hasTableMeta[quote.has_table] || hasTableMeta[1]
  const ruleThreshold = ht.ruleOfN
  const ruleLabel = `Rule of ${ruleThreshold}`

  return (
    <div>
      {/* Before/After Comparison */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px',
        alignItems: 'center', marginBottom: '12px',
      }}>
        {/* Before */}
        <div style={{
          padding: '12px', background: C.elevated, borderRadius: '7px',
          border: `1px solid ${C.border}`, textAlign: 'center' as const,
        }}>
          <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
            Without Purchase
          </div>
          <div style={{
            color: C.textSecondary, fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px',
          }}>{fmt(bi.current_monthly)}</div>
          <div style={{ color: C.textMuted, fontSize: '9px', marginTop: '2px' }}>
            {/* Multiplier x HAS x Service — C.R.S. §24-51-604 */}
            Multiplier x {fmt(quote.current_annual_salary / 12)} x Service
          </div>
        </div>

        {/* Arrow */}
        <div style={{
          color: C.success, fontSize: '20px', fontWeight: 700,
          textShadow: `0 0 10px ${C.successMuted}`,
        }}>&#8594;</div>

        {/* After */}
        <div style={{
          padding: '12px', background: C.successMuted, borderRadius: '7px',
          border: `1px solid ${C.successBorder}`, textAlign: 'center' as const,
        }}>
          <div style={{ color: C.success, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
            With Purchase
          </div>
          <div style={{
            color: C.success, fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px',
            textShadow: `0 0 14px ${C.successMuted}`,
          }}>{fmt(bi.projected_monthly)}</div>
          <div style={{ color: C.textMuted, fontSize: '9px', marginTop: '2px' }}>
            +{fmt(bi.monthly_increase)}/mo
          </div>
        </div>
      </div>

      {/* Monthly & Annual Increase */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px',
      }}>
        {[
          { label: 'Monthly Increase', value: fmt(bi.monthly_increase), color: C.success },
          { label: 'Annual Increase', value: fmt(bi.annual_increase), color: C.success },
          { label: 'Breakeven', value: `${bi.breakeven_months} mo (${bi.breakeven_years}y)`, color: C.accent },
        ].map(item => (
          <div key={item.label} style={{
            padding: '8px', background: C.elevated, borderRadius: '6px',
            border: `1px solid ${C.borderSubtle}`, textAlign: 'center' as const,
          }}>
            <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Breakeven Explanation */}
      <div style={{
        padding: '8px 10px', background: C.accentMuted, borderRadius: '6px',
        border: `1px solid ${C.accentSolid}`, marginBottom: '12px',
      }}>
        <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Breakeven Analysis
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45', fontFamily: 'monospace' }}>
          {fmt(quote.total_cost)} / {fmt(bi.monthly_increase)} = {bi.breakeven_months} months ({bi.breakeven_years} years)
        </div>
        <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
          After {bi.breakeven_months} months of retirement, the purchase cost is recovered through higher monthly benefit.
        </div>
      </div>

      {/* ═══ ELIGIBILITY EXCLUSION — CRITICAL CALLOUT ═══ */}
      <div style={{
        padding: '12px', background: C.dangerMuted, borderRadius: '7px',
        border: `2px solid ${C.dangerBorder}`, marginBottom: '8px',
      }}>
        <div style={{
          color: C.danger, fontSize: '11px', fontWeight: 700, marginBottom: '6px',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <span style={{ fontSize: '14px' }}>&#9888;</span>
          PURCHASED SERVICE EXCLUSION -- C.R.S. &sect;24-51-505
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.5' }}>
          Purchased service credit of <strong>{quote.years_requested.toFixed(1)} years</strong>{' '}
          counts toward the <span style={{ color: C.success, fontWeight: 600 }}>benefit calculation</span>{' '}
          (increases monthly benefit) but is{' '}
          <span style={{ color: C.danger, fontWeight: 600 }}>EXCLUDED</span>{' '}
          from {ruleLabel} eligibility calculation.
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px',
        }}>
          <div style={{
            padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px',
            textAlign: 'center' as const,
          }}>
            <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const }}>{ruleLabel} Sum</div>
            <div style={{ color: C.danger, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
              {ex.rule_of_n_sum_without.toFixed(2)}
            </div>
            <div style={{ color: C.textMuted, fontSize: '9px', marginTop: '1px' }}>
              Age {quote.member_age} + {(ex.rule_of_n_sum_without - quote.member_age).toFixed(2)} earned
            </div>
          </div>
          <div style={{
            padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '5px',
            textAlign: 'center' as const,
          }}>
            <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const }}>After Purchase</div>
            <div style={{ color: C.danger, fontSize: '16px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px' }}>
              {ex.rule_of_n_sum_with.toFixed(2)}
            </div>
            <div style={{ color: C.danger, fontSize: '9px', marginTop: '1px', fontWeight: 600 }}>
              UNCHANGED -- purchased excluded
            </div>
          </div>
        </div>

        <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '6px', fontStyle: 'italic' }}>
          The purchase increases the member's benefit amount but does NOT change eligibility status.
          {ruleLabel} sum remains {ex.rule_of_n_sum_with.toFixed(2)} &lt; {ruleThreshold}.
        </div>
      </div>
    </div>
  )
}
