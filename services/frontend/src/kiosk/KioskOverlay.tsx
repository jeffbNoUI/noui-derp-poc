/**
 * Kiosk visual overlay — progress rail (top) and caption bar (bottom).
 * Renders as a fixed overlay with pointerEvents: none so the app remains
 * interactive underneath. Captions cross-fade on text change.
 * Consumed by: KioskOrchestrator
 * Depends on: KioskState type
 */
import { useState, useEffect, useRef } from 'react'
import type { KioskState } from './kiosk-types'

interface KioskOverlayProps {
  state: KioskState
}

export function KioskOverlay({ state }: KioskOverlayProps) {
  const { currentStep, totalSteps, caption, paused, done } = state
  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0

  // Cross-fade caption text
  const [displayCaption, setDisplayCaption] = useState<string>(caption)
  const [opacity, setOpacity] = useState<number>(1)
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (caption === displayCaption) return
    // Fade out
    setOpacity(0)
    fadeTimer.current = setTimeout(() => {
      setDisplayCaption(caption)
      setOpacity(1)
    }, 250)
    return () => clearTimeout(fadeTimer.current)
  }, [caption, displayCaption])

  if (done) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      pointerEvents: 'none',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Top: progress rail */}
      <div style={{
        height: 3,
        background: 'rgba(255,255,255,0.08)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #14B8A6, #0D9488)',
          transition: 'width 0.6s ease-out',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Bottom: caption bar */}
      {displayCaption && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: '0 24px 20px',
        }}>
          <div style={{
            background: 'rgba(0, 54, 58, 0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 12,
            padding: '12px 24px',
            maxWidth: 720,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(20, 184, 166, 0.2)',
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: 14,
              fontWeight: 500,
              lineHeight: 1.5,
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              opacity,
              transition: 'opacity 0.25s ease',
            }}>
              {displayCaption}
            </span>
            <span style={{
              color: 'rgba(20, 184, 166, 0.7)',
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}>
              {currentStep + 1}/{totalSteps}
              {paused && ' \u23F8'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
