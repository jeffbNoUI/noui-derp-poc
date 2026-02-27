/**
 * Repeating group field — add/remove rows of sub-fields.
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme (uses inline sub-field rendering, not recursive FormField)
 */
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormRepeatingGroup({ field, value, onChange, T, readOnly }: Props) {
  const rows = (Array.isArray(value) ? value : []) as Record<string, unknown>[]

  const addRow = () => {
    const empty: Record<string, unknown> = {}
    ;(field.groupFields || []).forEach(gf => { empty[gf.key] = '' })
    onChange(field.key, [...rows, empty])
  }

  const removeRow = (idx: number) => {
    onChange(field.key, rows.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, subKey: string, val: unknown) => {
    const updated = rows.map((row, i) => i === idx ? { ...row, [subKey]: val } : row)
    onChange(field.key, updated)
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>
        {field.label}
      </div>
      {rows.map((row, idx) => (
        <div key={idx} style={{
          padding: 12, marginBottom: 8, borderRadius: 8, border: `1px solid ${T.border.base}`, background: T.surface.cardAlt,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.text.secondary }}>#{idx + 1}</span>
            {!readOnly && (
              <button onClick={() => removeRow(idx)} style={{
                fontSize: 10, color: T.status.danger, background: 'none', border: 'none', cursor: 'pointer',
              }}>Remove</button>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
            {(field.groupFields || []).map(gf => (
              <div key={gf.key} style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 10, color: T.text.muted, marginBottom: 2 }}>{gf.label}</label>
                <input
                  type={gf.type === 'date' ? 'date' : 'text'}
                  value={(row[gf.key] as string) || ''}
                  onChange={e => updateRow(idx, gf.key, e.target.value)}
                  readOnly={readOnly}
                  style={{
                    width: '100%', padding: '6px 8px', borderRadius: 4, border: `1px solid ${T.border.base}`,
                    fontSize: 12, color: T.text.primary, background: T.surface.card, outline: 'none', boxSizing: 'border-box' as const,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
      {!readOnly && (
        <button onClick={addRow} style={{
          fontSize: 11, color: T.accent.primary, background: T.accent.surface,
          border: `1px solid ${T.accent.light}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
        }}>+ Add {field.label}</button>
      )}
    </div>
  )
}
