/**
 * ContributionSummary stage — displays contribution history with running totals.
 * Shows the RULE-REFUND-CONTRIB accumulation: 8.45% of monthly pensionable salary.
 *
 * Consumed by: RefundWorkspace (parent page component)
 * Depends on: types/Refund.ts (ContributionAccumulation), theme.ts (C, fmt)
 */
import type { ContributionAccumulation } from '@/types/Refund'
import { C, fmt } from '@/theme'

interface Props {
  contributions: ContributionAccumulation
}

export function ContributionSummary({ contributions }: Props) {
  const c = contributions

  // Group monthly detail by year for display
  const byYear: Record<number, { months: number; totalPay: number; totalContrib: number }> = {}
  for (const d of c.monthly_detail) {
    if (!byYear[d.year]) byYear[d.year] = { months: 0, totalPay: 0, totalContrib: 0 }
    byYear[d.year].months++
    byYear[d.year].totalPay += d.pensionable_pay
    byYear[d.year].totalContrib += d.contribution
  }
  const years = Object.keys(byYear).map(Number).sort()

  return (
    <div>
      {/* Summary header */}
      <div style={{
        padding: '10px 12px', background: C.accentMuted, borderRadius: '7px',
        border: `1px solid ${C.accentSolid}`, textAlign: 'center' as const, marginBottom: '8px',
      }}>
        <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px' }}>
          Total Employee Contributions
        </div>
        <div style={{
          color: C.accent, fontSize: '24px', fontWeight: 700, fontFamily: 'monospace',
          marginTop: '4px', textShadow: `0 0 25px ${C.accentGlow}`,
        }}>
          {fmt(c.total_contributions)}
        </div>
        <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
          {c.month_count} months at 8.45% of pensionable salary
        </div>
      </div>

      {/* Formula display */}
      <div style={{
        padding: '6px 10px', background: C.elevated, borderRadius: '5px',
        border: `1px solid ${C.borderSubtle}`, fontFamily: 'monospace',
        fontSize: '10px', color: C.textSecondary, marginBottom: '8px',
      }}>
        {c.formula}
      </div>

      {/* Annual summary table */}
      <div style={{ borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 1fr 1fr',
          padding: '5px 8px', background: C.elevated, fontSize: '9px',
          textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: C.textMuted, fontWeight: 600,
        }}>
          <span>Year</span>
          <span style={{ textAlign: 'right' }}>Mo</span>
          <span style={{ textAlign: 'right' }}>Avg Monthly</span>
          <span style={{ textAlign: 'right' }}>Contributions</span>
        </div>
        {years.map((year) => {
          const row = byYear[year]
          const avgMonthly = row.totalPay / row.months
          return (
            <div key={year} style={{
              display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 1fr 1fr',
              padding: '4px 8px', fontSize: '10.5px', borderTop: `1px solid ${C.borderSubtle}`,
            }}>
              <span style={{ color: C.text }}>{year}</span>
              <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{row.months}</span>
              <span style={{ textAlign: 'right', color: C.text, fontFamily: 'monospace' }}>{fmt(avgMonthly)}</span>
              <span style={{ textAlign: 'right', color: C.accent, fontFamily: 'monospace', fontWeight: 600 }}>
                {fmt(row.totalContrib)}
              </span>
            </div>
          )
        })}
        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 0.5fr 1fr 1fr',
          padding: '5px 8px', background: C.elevated, borderTop: `1px solid ${C.border}`,
          fontWeight: 600, fontSize: '10.5px',
        }}>
          <span style={{ color: C.text }}>Total</span>
          <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>{c.month_count}</span>
          <span />
          <span style={{ textAlign: 'right', color: C.accent, fontFamily: 'monospace' }}>{fmt(c.total_contributions)}</span>
        </div>
      </div>

      {/* Rate callout */}
      <div style={{
        padding: '8px 10px', marginTop: '6px', borderRadius: '6px',
        background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
      }}>
        <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Employee Contribution Rate: 8.45%
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          Only employee payroll deductions are refundable. Employer contributions (17.95%)
          remain in the fund. Purchased service payments are not refundable. RMC §18-403(b).
        </div>
      </div>
    </div>
  )
}
