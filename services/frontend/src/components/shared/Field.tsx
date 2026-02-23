/**
 * Shared label-value row component for stage cards.
 * Replaces identical inline Field definitions across 6+ stage files.
 * Consumed by: Stage1MemberVerify, Stage2ServiceCredit, Stage3Eligibility,
 *   Stage4BenefitCalc, Stage6Supplemental, Stage7DRO
 * Depends on: theme (C), Badge
 */
import { C } from '@/theme'
import { Badge } from './Badge'

export function Field({ label, value, sub, highlight, badge }: {
  label: string; value: string; sub?: string | null; highlight?: boolean
  badge?: { text: string; bg: string; color: string } | null
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '7px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <div style={{ width: '50%', minWidth: 0 }}>
        <span style={{ color: C.textSecondary, fontSize: '12.5px' }}>{label}</span>
        {sub && <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>{sub}</div>}
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        {badge && <Badge {...badge} />}
        <span style={{
          color: highlight ? C.accent : C.text, fontWeight: 600,
          fontFamily: "'SF Mono',monospace", fontSize: '13px',
          textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
        }}>{value}</span>
      </span>
    </div>
  )
}
