/**
 * Read-only display field (pre-populated values shown but not editable).
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme }

export function FormDisplay({ field, value, T }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>{field.label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary, padding: '8px 12px', background: T.surface.cardAlt, borderRadius: 6, border: `1px solid ${T.border.subtle}` }}>
        {(value as string) || '\u2014'}
      </div>
    </div>
  )
}
