/**
 * Shared Badge component — small colored pill for status labels, tier indicators, etc.
 * Consumed by: Field, death stage components, future stage components
 * Depends on: Nothing (pure presentational)
 */

export function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const,
      lineHeight: '14px', whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  )
}
