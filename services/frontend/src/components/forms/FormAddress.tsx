/**
 * Address input — single textarea for POC simplification.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormAddress({ field, value, onChange, T, readOnly }: Props) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>
        {field.label}{field.required && <span style={{ color: T.status.danger }}> *</span>}
      </label>
      <textarea
        value={(value as string) || ''}
        onChange={e => onChange(field.key, e.target.value)}
        readOnly={readOnly}
        placeholder={field.helpText || 'Street, City, State ZIP'}
        rows={2}
        style={{
          width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${T.border.base}`,
          fontSize: 13, color: T.text.primary, background: readOnly ? T.surface.cardAlt : T.surface.card,
          outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const,
        }}
      />
    </div>
  )
}
