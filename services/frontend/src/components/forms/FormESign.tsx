/**
 * Electronic signature field — confirmation checkbox + timestamp display.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormESign({ field, value, onChange, T, readOnly }: Props) {
  const signed = !!value
  return (
    <div style={{ marginBottom: 12, padding: '14px', borderRadius: 8, border: `1px solid ${signed ? T.status.success : T.border.base}`, background: signed ? T.status.successBg : T.surface.card }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: readOnly ? 'default' : 'pointer' }}>
        <input type="checkbox" checked={signed}
          onChange={e => {
            if (!readOnly) onChange(field.key, e.target.checked ? new Date().toISOString() : null)
          }}
          style={{ accentColor: T.status.success, marginTop: 2 }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: signed ? T.status.success : T.text.primary }}>{field.label}</div>
          {field.helpText && <div style={{ fontSize: 11, color: T.text.muted, marginTop: 2 }}>{field.helpText}</div>}
          {signed && typeof value === 'string' && (
            <div style={{ fontSize: 10, color: T.status.success, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>
              Signed: {new Date(value).toLocaleString()}
            </div>
          )}
        </div>
      </label>
    </div>
  )
}
