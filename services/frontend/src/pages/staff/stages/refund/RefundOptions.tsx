/**
 * RefundOptions stage — displays distribution election options with tax impact.
 * Shows the RULE-REFUND-TAX determination: direct payment vs rollover comparison.
 *
 * Consumed by: RefundWorkspace (parent page component)
 * Depends on: types/Refund.ts (TaxWithholdingResult), theme.ts (C, fmt)
 */
import type { TaxWithholdingResult } from '@/types/Refund'
import { C, fmt } from '@/theme'

interface Props {
  taxOptions: TaxWithholdingResult[]
}

const ELECTION_LABELS: Record<string, string> = {
  direct_payment: 'Direct Payment',
  direct_rollover: 'Direct Rollover (IRA/401k)',
  partial_rollover: 'Partial Rollover',
}

const ELECTION_DESCRIPTIONS: Record<string, string> = {
  direct_payment: 'Lump-sum check to the member. Subject to mandatory 20% federal withholding.',
  direct_rollover: 'Full amount transferred directly to a qualified retirement account. No withholding.',
  partial_rollover: 'Split between direct payment and rollover. Withholding applies only to the direct portion.',
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

function OptionCard({ option }: { option: TaxWithholdingResult }) {
  const label = ELECTION_LABELS[option.election_type] || option.election_type
  const desc = ELECTION_DESCRIPTIONS[option.election_type] || ''
  const isRollover = option.election_type === 'direct_rollover'

  return (
    <div style={{
      padding: '10px 12px', borderRadius: '6px', marginBottom: '6px',
      background: C.elevated, border: `1px solid ${C.borderSubtle}`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color: C.text, fontSize: '12px', fontWeight: 600 }}>{label}</span>
        {isRollover && (
          <Badge text="No Tax" color={C.success} bg={C.successMuted} />
        )}
        {option.election_type === 'direct_payment' && (
          <Badge text="20% Withholding" color={C.danger} bg={C.dangerMuted} />
        )}
        {option.election_type === 'partial_rollover' && (
          <Badge text="Split" color={C.accent} bg={C.accentMuted} />
        )}
      </div>

      {/* Description */}
      <div style={{ color: C.textSecondary, fontSize: '10px', marginBottom: '8px', lineHeight: '1.4' }}>
        {desc}
      </div>

      {/* Breakdown */}
      <div style={{ borderTop: `1px solid ${C.borderSubtle}`, paddingTop: '6px' }}>
        <Row label="Gross Refund" value={fmt(option.gross_refund)} />
        {option.withholding_amount > 0 && (
          <Row
            label={`Federal Withholding (${(option.withholding_rate * 100).toFixed(0)}%)`}
            value={`-${fmt(option.withholding_amount)}`}
            color={C.danger}
          />
        )}
        {option.rollover_amount !== undefined && option.rollover_amount > 0 && (
          <Row label="Rollover Amount" value={fmt(option.rollover_amount)} color={C.accent} />
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '5px 0', borderTop: `1px solid ${C.border}`, marginTop: '2px',
        }}>
          <span style={{ color: C.text, fontSize: '12px', fontWeight: 700 }}>Net to Member</span>
          <span style={{
            color: C.accent, fontFamily: 'monospace', fontSize: '14px', fontWeight: 700,
            textShadow: `0 0 14px ${C.accentGlow}`,
          }}>
            {fmt(option.net_payment)}
          </span>
        </div>
      </div>

      {/* Formula */}
      <div style={{
        padding: '4px 8px', marginTop: '6px', borderRadius: '4px',
        background: C.bg, fontFamily: 'monospace', fontSize: '9px', color: C.textMuted,
      }}>
        {option.formula}
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '3px 0',
    }}>
      <span style={{ color: C.textSecondary, fontSize: '11px' }}>{label}</span>
      <span style={{
        color: color || C.text, fontFamily: 'monospace', fontSize: '11px', fontWeight: 600,
      }}>{value}</span>
    </div>
  )
}

export function RefundOptions({ taxOptions }: Props) {
  return (
    <div>
      {/* Section header */}
      <div style={{
        color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
        letterSpacing: '1.5px', marginBottom: '8px',
      }}>
        Distribution Election Options
      </div>

      {/* Option cards */}
      {taxOptions.map((opt, i) => (
        <OptionCard key={i} option={opt} />
      ))}

      {/* Tax callout */}
      <div style={{
        padding: '8px 10px', marginTop: '6px', borderRadius: '6px',
        background: C.accentMuted, border: `1px solid ${C.accentSolid}`,
      }}>
        <div style={{ color: C.accent, fontSize: '10.5px', fontWeight: 600, marginBottom: '2px' }}>
          Federal Tax Withholding — IRC &sect;402(f)
        </div>
        <div style={{ color: C.text, fontSize: '11px', lineHeight: '1.45' }}>
          Direct payments are subject to mandatory 20% federal income tax withholding.
          Direct rollovers to a qualified plan or IRA are not subject to withholding.
          The member may owe additional tax or receive a refund when filing their annual return.
        </div>
      </div>
    </div>
  )
}
