/**
 * InterestCalculation stage — displays interest compounding schedule.
 * Shows the RULE-REFUND-INTEREST determination: 2% annual, compounded June 30.
 *
 * Consumed by: RefundWorkspace (parent page component)
 * Depends on: types/Refund.ts (InterestSchedule), theme.ts (C, fmt)
 */
import type { InterestSchedule } from '@/types/Refund'
import { C, fmt } from '@/theme'

interface Props {
  interest: InterestSchedule
  contributionTotal: number
}

export function InterestCalculation({ interest, contributionTotal }: Props) {
  const grossRefund = contributionTotal + interest.total_interest

  return (
    <div>
      {/* Summary header */}
      <div style={{
        padding: '10px 12px', background: C.accentMuted, borderRadius: '7px',
        border: `1px solid ${C.accentSolid}`, textAlign: 'center' as const, marginBottom: '8px',
      }}>
        <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1.5px' }}>
          Total Accrued Interest
        </div>
        <div style={{
          color: C.accent, fontSize: '24px', fontWeight: 700, fontFamily: 'monospace',
          marginTop: '4px', textShadow: `0 0 25px ${C.accentGlow}`,
        }}>
          {fmt(interest.total_interest)}
        </div>
        <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
          {(interest.interest_rate * 100).toFixed(1)}% annual rate, {interest.credits.length} compounding period{interest.credits.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Formula display */}
      <div style={{
        padding: '6px 10px', background: C.elevated, borderRadius: '5px',
        border: `1px solid ${C.borderSubtle}`, fontFamily: 'monospace',
        fontSize: '10px', color: C.textSecondary, marginBottom: '8px',
      }}>
        {interest.formula}
      </div>

      {/* Compounding schedule table */}
      <div style={{ borderRadius: '6px', overflow: 'hidden', border: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1fr',
          padding: '5px 8px', background: C.elevated, fontSize: '9px',
          textTransform: 'uppercase' as const, letterSpacing: '0.8px', color: C.textMuted, fontWeight: 600,
        }}>
          <span>Date</span>
          <span style={{ textAlign: 'right' }}>Balance</span>
          <span style={{ textAlign: 'right' }}>Interest</span>
          <span style={{ textAlign: 'right' }}>After</span>
        </div>
        {interest.credits.map((entry, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 0.8fr 1fr',
            padding: '4px 8px', fontSize: '10.5px', borderTop: `1px solid ${C.borderSubtle}`,
          }}>
            <span style={{ color: C.text, fontFamily: 'monospace' }}>{entry.date}</span>
            <span style={{ textAlign: 'right', color: C.textSecondary, fontFamily: 'monospace' }}>
              {fmt(entry.balance_before)}
            </span>
            <span style={{ textAlign: 'right', color: C.accent, fontFamily: 'monospace', fontWeight: 600 }}>
              +{fmt(entry.interest_amount)}
            </span>
            <span style={{ textAlign: 'right', color: C.text, fontFamily: 'monospace' }}>
              {fmt(entry.balance_after)}
            </span>
          </div>
        ))}
      </div>

      {/* Gross refund summary */}
      <div style={{
        padding: '10px 12px', marginTop: '8px', borderRadius: '6px',
        background: C.elevated, border: `1px solid ${C.border}`,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 0', borderBottom: `1px solid ${C.borderSubtle}`,
        }}>
          <span style={{ color: C.textSecondary, fontSize: '12px' }}>Employee Contributions</span>
          <span style={{ color: C.text, fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
            {fmt(contributionTotal)}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '4px 0', borderBottom: `1px solid ${C.borderSubtle}`,
        }}>
          <span style={{ color: C.textSecondary, fontSize: '12px' }}>Accrued Interest</span>
          <span style={{ color: C.accent, fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
            +{fmt(interest.total_interest)}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '6px 0',
        }}>
          <span style={{ color: C.text, fontSize: '13px', fontWeight: 700 }}>Gross Refund</span>
          <span style={{
            color: C.accent, fontFamily: 'monospace', fontSize: '16px', fontWeight: 700,
            textShadow: `0 0 20px ${C.accentGlow}`,
          }}>
            {fmt(grossRefund)}
          </span>
        </div>
      </div>

      {/* Rate callout */}
      <div style={{
        padding: '8px 10px', marginTop: '6px', borderRadius: '6px',
        background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
      }}>
        <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Interest Compounding — RMC &sect;18-403(c)
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          Interest accrues at {(interest.interest_rate * 100).toFixed(1)}% per annum, compounded annually on
          June 30. Only complete fiscal years (July 1 through June 30) earn interest.
          Partial-year balances do not accrue interest until the next June 30.
        </div>
      </div>
    </div>
  )
}
