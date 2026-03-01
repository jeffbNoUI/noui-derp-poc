/**
 * Purchase Explorer sidebar — summary panel showing cost, benefit comparison,
 * and eligibility exclusion reminder.
 *
 * Consumed by: PurchaseExplorer.tsx
 * Depends on: Member.ts (ServicePurchaseQuote, EligibilityResult, ServiceCreditSummary),
 *   theme.ts (C, hasTableMeta, fmt)
 */
import type { ServicePurchaseQuote, EligibilityResult, ServiceCreditSummary } from '@/types/Member'
import { C, hasTableMeta, fmt } from '@/theme'

interface PurchaseSidebarProps {
  quote: ServicePurchaseQuote
  sc: ServiceCreditSummary | undefined
  elig: EligibilityResult | undefined
  hasTable: number
}

export function PurchaseSidebar({ quote, sc, elig, hasTable }: PurchaseSidebarProps) {
  const ht = hasTableMeta[hasTable] || hasTableMeta[1]
  const ruleLabel = elig?.rule_of_n_label ?? `Rule of ${ht.ruleOfN}`

  return (
    <div style={{
      width: '220px', borderLeft: `1px solid ${C.border}`, flexShrink: 0,
      background: C.surface, display: 'flex', flexDirection: 'column' as const,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          color: C.textDim, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1.5px', fontWeight: 600,
        }}>Purchase Summary</div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {/* Cost hero */}
        <div style={{
          textAlign: 'center' as const, padding: '14px 8px', background: C.accentMuted,
          borderRadius: '8px', border: `1px solid ${C.accentSolid}`, marginBottom: '10px',
        }}>
          <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
            Total Cost
          </div>
          <div style={{
            color: C.accent, fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', marginTop: '4px',
            textShadow: `0 0 25px ${C.accentGlow}`,
          }}>{fmt(quote.total_cost)}</div>
        </div>

        {/* Line items */}
        <div style={{ fontSize: '11px' }}>
          {[
            { l: ht.name, v: ht.era, c: C.accent },
            { l: 'Earned Service', v: `${sc?.earned_service_years ?? 0}y`, c: C.text },
            { l: 'Purchasing', v: `${quote.years_requested}y`, c: C.warm },
            { l: 'Cost Factor', v: quote.cost_factor.toFixed(4), c: C.text },
            { l: 'Before', v: fmt(quote.benefit_impact.current_monthly), c: C.textSecondary },
            { l: 'After', v: fmt(quote.benefit_impact.projected_monthly), c: C.success },
            { l: 'Increase', v: `+${fmt(quote.benefit_impact.monthly_increase)}`, c: C.success },
            { l: 'Breakeven', v: `${quote.benefit_impact.breakeven_months} mo`, c: C.accent },
          ].map(r => (
            <div key={r.l} style={{
              display: 'flex', justifyContent: 'space-between', padding: '3px 0',
            }}>
              <span style={{ color: C.textSecondary, fontSize: '10.5px' }}>{r.l}</span>
              <span style={{ color: r.c, fontFamily: 'monospace', fontSize: '10.5px', fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Exclusion reminder — CRITICAL */}
        <div style={{
          marginTop: '10px', padding: '8px', background: C.dangerMuted,
          borderRadius: '6px', border: `1px solid ${C.dangerBorder}`,
        }}>
          <div style={{ color: C.danger, fontSize: '9px', fontWeight: 600 }}>
            {ruleLabel}: {elig?.rule_of_n_value?.toFixed(2) ?? quote.eligibility_exclusion.rule_of_n_sum_with.toFixed(2)}
          </div>
          <div style={{ color: C.textSecondary, fontSize: '9px', marginTop: '2px' }}>
            Purchased {quote.years_requested}y EXCLUDED
          </div>
        </div>
      </div>
    </div>
  )
}
