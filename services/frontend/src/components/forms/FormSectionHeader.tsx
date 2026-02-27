/**
 * Non-input section divider for visual grouping within form steps.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; T: PortalTheme }

export function FormSectionHeader({ field, T }: Props) {
  return (
    <div style={{ marginBottom: 8, marginTop: 16, paddingBottom: 6, borderBottom: `1px solid ${T.border.subtle}` }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>{field.label}</div>
    </div>
  )
}
