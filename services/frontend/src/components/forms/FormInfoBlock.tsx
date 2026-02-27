/**
 * Informational callout block — non-input, displays guidance text.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; T: PortalTheme }

export function FormInfoBlock({ field, T }: Props) {
  return (
    <div style={{
      marginBottom: 12, padding: '12px 14px', borderRadius: 8,
      background: T.status.infoBg, borderLeft: `3px solid ${T.status.info}`,
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.status.info, marginBottom: 2 }}>{field.label}</div>
      <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5 }}>{field.infoText || field.helpText || ''}</div>
    </div>
  )
}
