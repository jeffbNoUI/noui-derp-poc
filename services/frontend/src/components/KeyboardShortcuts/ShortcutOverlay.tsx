/**
 * Keyboard shortcut overlay — modal showing all shortcuts grouped by context.
 * Opened via Shift+? global listener. Dismissed via Escape or backdrop click.
 * Consumed by: StaffLayout.tsx
 * Depends on: shortcut-data.ts, theme (C)
 */
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { C } from '@/theme'
import { SHORTCUTS } from './shortcut-data'

export function ShortcutOverlay() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const isKiosk = location.search.includes('kiosk')

  useEffect(() => {
    if (isKiosk) return
    const onKey = (e: KeyboardEvent) => {
      // Shift+? (which is Shift+/ on most keyboards, reported as '?')
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Don't trigger inside inputs/textareas
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isKiosk, open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 9000, cursor: 'pointer',
        }}
      />
      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '440px', maxWidth: '90vw', maxHeight: '80vh',
        background: C.surface, borderRadius: '12px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        zIndex: 9001, overflow: 'auto', padding: '20px 24px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '16px',
        }}>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '14px' }}>Keyboard Shortcuts</span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none', border: 'none', color: C.textMuted,
              cursor: 'pointer', fontSize: '16px', padding: '0 2px',
            }}
          >{'\u2715'}</button>
        </div>
        {SHORTCUTS.map(group => (
          <div key={group.context} style={{ marginBottom: '14px' }}>
            <div style={{
              color: C.accent, fontSize: '9px', fontWeight: 600,
              textTransform: 'uppercase' as const, letterSpacing: '1px',
              marginBottom: '6px',
            }}>{group.context}</div>
            {group.shortcuts.map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: `1px solid ${C.borderSubtle}`,
              }}>
                <span style={{ color: C.textSecondary, fontSize: '11.5px' }}>{s.description}</span>
                <span style={{ display: 'flex', gap: '3px' }}>
                  {s.keys.map(k => (
                    <kbd key={k} style={{
                      display: 'inline-block', padding: '1px 6px',
                      borderRadius: '4px', fontSize: '10px', fontWeight: 600,
                      fontFamily: "'SF Mono', monospace",
                      background: C.elevated, color: C.text,
                      border: `1px solid ${C.border}`,
                      boxShadow: `0 1px 2px rgba(0,0,0,0.08)`,
                    }}>{k}</kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  )
}
