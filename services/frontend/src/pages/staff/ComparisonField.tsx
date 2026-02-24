/**
 * Comparison row — shows label, left value, right value, and color-coded delta.
 * Consumed by: ComparisonView.tsx
 * Depends on: theme (C)
 */
import { C } from '@/theme'

export function ComparisonField({
  label, left, right, deltaType,
}: {
  label: string
  left: string
  right: string
  deltaType?: 'higher' | 'lower' | 'same' | 'text'
}) {
  const deltaColor = deltaType === 'higher' ? C.success
    : deltaType === 'lower' ? C.danger
    : deltaType === 'same' ? C.textDim
    : C.text
  const deltaIcon = deltaType === 'higher' ? '\u25B2'
    : deltaType === 'lower' ? '\u25BC'
    : deltaType === 'same' ? '='
    : ''

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '35% 1fr 24px 1fr',
      alignItems: 'center', gap: '6px',
      padding: '6px 0', borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <span style={{ color: C.textSecondary, fontSize: '11.5px' }}>{label}</span>
      <span style={{
        color: C.text, fontWeight: 600, fontSize: '12px',
        fontFamily: "'SF Mono', monospace",
      }}>{left}</span>
      <span style={{
        color: deltaColor, fontSize: '8px', textAlign: 'center' as const,
        fontWeight: 700,
      }}>{deltaIcon}</span>
      <span style={{
        color: C.text, fontWeight: 600, fontSize: '12px',
        fontFamily: "'SF Mono', monospace",
      }}>{right}</span>
    </div>
  )
}
