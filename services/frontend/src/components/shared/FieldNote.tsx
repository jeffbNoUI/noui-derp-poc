/**
 * Field-level annotation — pencil icon that expands to inline textarea for notes.
 * Yellow dot indicator when a note exists. Auto-focus on open.
 * Consumed by: AnnotatedField.tsx
 * Depends on: field-notes.ts, theme (C)
 */
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { C } from '@/theme'
import { getNote, setNote, deleteNote } from '@/lib/field-notes'

export function FieldNote({
  memberId, stageId, fieldLabel,
}: {
  memberId: string; stageId: string; fieldLabel: string
}) {
  const location = useLocation()
  const isKiosk = location.search.includes('kiosk')
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const existing = getNote(memberId, stageId, fieldLabel)
  const hasNote = !!existing

  useEffect(() => {
    if (open) {
      setText(existing ?? '')
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [open])

  if (isKiosk) return null

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '4px' }}>
      {/* Pencil icon */}
      <button
        onClick={() => setOpen(v => !v)}
        title={hasNote ? 'Edit note' : 'Add note'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: hasNote ? '#D97706' : C.textDim, fontSize: '11px',
          padding: '0 2px', position: 'relative', lineHeight: 1,
          opacity: hasNote ? 1 : 0.5,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { if (!hasNote) e.currentTarget.style.opacity = '0.5' }}
      >
        {'\u270E'}
        {hasNote && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-1px',
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#D97706',
          }} />
        )}
      </button>
      {/* Inline textarea */}
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, zIndex: 100,
          width: '220px', padding: '6px',
          background: C.surface, borderRadius: '6px',
          border: `1px solid #D97706`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          marginTop: '4px',
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            style={{
              width: '100%', resize: 'vertical',
              background: C.elevated, color: C.text,
              border: `1px solid ${C.borderSubtle}`, borderRadius: '4px',
              padding: '4px 6px', fontSize: '10.5px',
              fontFamily: 'inherit', outline: 'none',
            }}
            placeholder="Add a note..."
          />
          <div style={{ display: 'flex', gap: '4px', marginTop: '4px', justifyContent: 'flex-end' }}>
            {hasNote && (
              <button
                onClick={() => { deleteNote(memberId, stageId, fieldLabel); setOpen(false) }}
                style={{
                  padding: '2px 8px', borderRadius: '3px', fontSize: '9px',
                  background: 'transparent', border: `1px solid ${C.danger}`,
                  color: C.danger, cursor: 'pointer',
                }}
              >Delete</button>
            )}
            <button
              onClick={() => { setNote(memberId, stageId, fieldLabel, text); setOpen(false) }}
              style={{
                padding: '2px 8px', borderRadius: '3px', fontSize: '9px',
                background: '#D97706', border: 'none',
                color: '#fff', cursor: 'pointer', fontWeight: 600,
              }}
            >Save</button>
          </div>
        </div>
      )}
    </span>
  )
}
