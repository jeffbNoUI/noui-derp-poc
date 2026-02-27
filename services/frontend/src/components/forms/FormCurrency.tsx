/**
 * Currency display field with $ prefix.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormCurrency({ field, value, onChange, T, readOnly }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>
        {field.label}{field.required && <span style={{ color: T.status.danger }}> *</span>}
      </label>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text.muted, marginRight: 4 }}>$</span>
        <input
          type="text"
          value={(value as string) || ''}
          onChange={e => onChange(field.key, e.target.value)}
          readOnly={readOnly}
          placeholder="0.00"
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border.base}`,
            fontSize: 13, color: T.text.primary, background: readOnly ? T.surface.cardAlt : T.surface.card,
            outline: 'none', fontFamily: "'JetBrains Mono', monospace",
          }}
        />
      </div>
    </div>
  )
}
