/**
 * Nudge toast — fixed bottom-right notification with slide-in animation.
 * Auto-dismisses after 8 seconds. Warm accent color.
 * Consumed by: GuidedWorkspace.tsx
 * Depends on: nudge-types (ActiveNudge via useNudges), theme (C)
 */
import { useEffect, useRef } from 'react'
import { C } from '@/theme'
import type { ActiveNudge } from './useNudges'

export function NudgeToast({
  nudge, onDismiss,
}: {
  nudge: ActiveNudge; onDismiss: () => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 8000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [nudge.id, onDismiss])

  return (
    <>
      <style>{`
        @keyframes nudge-slide-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: '20px', right: '16px',
        width: '300px', zIndex: 7000,
        background: C.surface, borderRadius: '10px',
        border: `1px solid ${C.warm}`,
        boxShadow: `0 6px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(230,81,0,0.1)`,
        padding: '12px 14px',
        animation: 'nudge-slide-in 0.3s ease-out',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: '6px',
        }}>
          <span style={{
            color: C.warm, fontSize: '11.5px', fontWeight: 700,
          }}>{'\uD83D\uDCA1'} {nudge.message}</span>
          <button
            onClick={onDismiss}
            style={{
              background: 'none', border: 'none', color: C.textDim,
              cursor: 'pointer', fontSize: '12px', padding: '0 2px',
              lineHeight: 1, flexShrink: 0, marginLeft: '6px',
            }}
          >{'\u2715'}</button>
        </div>
        <div style={{
          color: C.textSecondary, fontSize: '10.5px', lineHeight: '1.5',
        }}>{nudge.hint}</div>
      </div>
    </>
  )
}
