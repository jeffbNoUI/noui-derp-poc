/**
 * Select dropdown field from field.options.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormSelect({ field, value, onChange, T, readOnly }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>
        {field.label}{field.required && <span style={{ color: T.status.danger }}> *</span>}
      </label>
      <select
        value={(value as string) || ''}
        onChange={e => onChange(field.key, e.target.value)}
        disabled={readOnly}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border.base}`,
          fontSize: 13, color: T.text.primary, background: readOnly ? T.surface.cardAlt : T.surface.card,
          outline: 'none', cursor: readOnly ? 'default' : 'pointer',
        }}
      >
        <option value="">Select...</option>
        {(field.options || []).map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
