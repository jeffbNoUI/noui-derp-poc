/**
 * File upload field — visual-only UI for POC (no actual upload).
 * Consumed by: FormField dispatcher
 * Depends on: FormFieldDef, PortalTheme
 */
import { useState } from 'react'
import type { FormFieldDef } from '@/types/FormDefinition'
import type { PortalTheme } from '@/theme'

interface Props { field: FormFieldDef; value: unknown; onChange: (key: string, val: unknown) => void; T: PortalTheme; readOnly?: boolean }

export function FormFileUpload({ field, value, onChange, T, readOnly }: Props) {
  const [fileName, setFileName] = useState<string>((value as string) || '')
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>
        {field.label}{field.required && <span style={{ color: T.status.danger }}> *</span>}
      </div>
      <div style={{
        padding: '16px', borderRadius: 8, border: `2px dashed ${T.border.base}`,
        background: T.surface.cardAlt, textAlign: 'center' as const,
      }}>
        {fileName ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.status.success, fontWeight: 600 }}>{fileName}</span>
            {!readOnly && (
              <button onClick={() => { setFileName(''); onChange(field.key, '') }} style={{
                fontSize: 10, color: T.status.danger, background: 'none', border: 'none', cursor: 'pointer',
              }}>Remove</button>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: T.text.secondary, marginBottom: 4 }}>
              Drag file here or click to browse
            </div>
            <button onClick={() => {
              if (!readOnly) { const name = 'document.pdf'; setFileName(name); onChange(field.key, name) }
            }} style={{
              fontSize: 11, color: T.accent.primary, background: T.accent.surface,
              border: `1px solid ${T.accent.light}`, borderRadius: 4, padding: '4px 12px', cursor: 'pointer',
            }}>Choose File</button>
          </>
        )}
      </div>
      {field.helpText && <div style={{ fontSize: 10, color: T.text.muted, marginTop: 4 }}>{field.helpText}</div>}
    </div>
  )
}
