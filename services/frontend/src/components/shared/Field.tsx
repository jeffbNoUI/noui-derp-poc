/**
 * Shared label-value row component for stage cards.
 * Replaces identical inline Field definitions across stage files.
 * Consumed by: death stage components, future stage components
 * Depends on: theme (C), Badge
 */
import { C } from '@/theme.ts'
import { Badge } from './Badge.tsx'

export function Field({ label, value, sub, highlight, badge }: {
  label: string; value: string; sub?: string | null; highlight?: boolean
  badge?: { text: string; bg: string; color: string } | null
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '40% 1fr auto',
      alignItems: 'center', gap: '0 6px',
      padding: '7px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <span style={{ color: C.textSecondary, fontSize: '12.5px' }}>{label}</span>
        {sub && <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>{sub}</div>}
      </div>
      {/* Badge column — always rendered so value position is stable */}
      <div>{badge ? <Badge {...badge} /> : null}</div>
      <span style={{
        color: highlight ? C.accent : C.text, fontWeight: 600,
        fontFamily: "'SF Mono',monospace", fontSize: '13px',
        textAlign: 'right' as const,
        textShadow: highlight ? `0 0 14px ${C.accentGlow}` : 'none',
      }}>{value}</span>
    </div>
  )
}
