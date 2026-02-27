/**
 * Radio group field from field.options.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormRadio({ field, value, onChange, T, readOnly }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>
        {field.label}{field.required && <span style={{ color: T.status.danger }}> *</span>}
      </div>
      {field.helpText && <div style={{ fontSize: 11, color: T.text.secondary, marginBottom: 8 }}>{field.helpText}</div>}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
        {(field.options || []).map(opt => {
          const checked = value === opt.value
          return (
            <label key={opt.value} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${checked ? T.accent.primary : T.border.base}`,
              background: checked ? T.accent.surface : T.surface.card,
              cursor: readOnly ? 'default' : 'pointer',
            }}>
              <input type="radio" name={field.key} value={opt.value} checked={checked}
                onChange={() => !readOnly && onChange(field.key, opt.value)}
                style={{ accentColor: T.accent.primary }}
              />
              <span style={{ fontSize: 13, color: T.text.primary }}>{opt.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
