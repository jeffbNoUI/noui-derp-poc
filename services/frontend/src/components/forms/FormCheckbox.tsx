/**
 * Single checkbox field with label.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormCheckbox({ field, value, onChange, T, readOnly }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8,
        background: T.accent.surface, cursor: readOnly ? 'default' : 'pointer',
      }}>
        <input type="checkbox" checked={!!value}
          onChange={e => !readOnly && onChange(field.key, e.target.checked)}
          style={{ accentColor: T.accent.primary, marginTop: 2 }}
        />
        <div>
          <div style={{ fontSize: 12, color: T.accent.primary, fontWeight: 600 }}>{field.label}</div>
          {field.helpText && <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{field.helpText}</div>}
        </div>
      </label>
    </div>
  )
}
