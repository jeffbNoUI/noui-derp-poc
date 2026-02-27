/**
 * SSN field — always masked display (XXX-XX-1234). Never shows raw SSN.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme }

export function FormSSN({ field, value, T }: Props) {
  const raw = (value as string) || ''
  const masked = raw.length >= 4 ? `XXX-XX-${raw.slice(-4)}` : 'XXX-XX-XXXX'
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>{field.label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, padding: '8px 12px', background: T.surface.cardAlt, borderRadius: 6, border: `1px solid ${T.border.subtle}`, fontFamily: "'JetBrains Mono', monospace" }}>
        {masked}
      </div>
    </div>
  )
}
