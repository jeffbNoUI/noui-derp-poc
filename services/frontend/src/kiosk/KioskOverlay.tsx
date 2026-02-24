/**
 * Kiosk visual overlay — progress rail (top) and adaptive caption/narrator panel.
 * Dual-mode: SimpleCaptionBar for backward-compat steps, NarratorPanel with
 * headline + scrolling teleprompter for narrator steps. Position presets keep
 * the overlay from blocking action buttons.
 * Consumed by: KioskOrchestrator
 * Depends on: KioskState, NarratorCaption, CaptionPosition types
 */
import { useState, useEffect, useRef, useCallback, type CSSProperties } from 'react'
import type { KioskState, CaptionPosition, NarratorCaption } from './kiosk-types'
import { TIMING } from './kiosk-types'

// ─── Shared style tokens ────────────────────────────────────

const FONT_SANS = "'Plus Jakarta Sans', 'Inter', sans-serif"
const FONT_MONO = "'SF Mono', 'Fira Code', monospace"
const BG = 'rgba(0, 54, 58, 0.92)'
const BORDER = '1px solid rgba(20, 184, 166, 0.2)'
const SHADOW = '0 8px 32px rgba(0,0,0,0.4)'
const TEAL = 'rgba(20, 184, 166, 0.7)'
const NARRATOR_BODY_HEIGHT = 120

// ─── Position mapping ────────────────────────────────────────

function positionStyles(pos: CaptionPosition): CSSProperties {
  switch (pos) {
    case 'bottom-center':
      return {
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 520,
        width: '90vw',
      }
    case 'bottom-right':
      return {
        position: 'fixed',
        bottom: 20,
        right: 24,
        maxWidth: 380,
        width: '30vw',
      }
    case 'top-right':
      return {
        position: 'fixed',
        top: 20,
        right: 24,
        maxWidth: 380,
        width: '30vw',
      }
    case 'left-panel':
      return {
        position: 'fixed',
        top: 20,
        left: 24,
        bottom: 80,
        maxWidth: 340,
        width: '25vw',
      }
  }
}

// ─── Scrolling body (teleprompter) ───────────────────────────

interface ScrollingBodyProps {
  text: string
  paused: boolean
  /** Total dwell time for this step (ms) — scroll fills remaining time after initial pause */
  dwell: number
}

function ScrollingBody({ text, paused, dwell }: ScrollingBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState(0)
  const [scrolling, setScrolling] = useState(false)

  // Measure overflow on mount / text change
  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return
    const diff = inner.scrollHeight - container.clientHeight
    setOverflow(diff > 4 ? diff : 0)
    setScrolling(false)
  }, [text])

  // Start scroll after initial delay
  useEffect(() => {
    if (overflow <= 0 || paused) return
    const timer = setTimeout(() => setScrolling(true), TIMING.NARRATOR_SCROLL_DELAY)
    return () => clearTimeout(timer)
  }, [overflow, paused])

  // Scroll duration = total dwell minus the initial pause, capped at minimum 2s
  const scrollDuration = Math.max(2, (dwell - TIMING.NARRATOR_SCROLL_DELAY) / 1000)

  return (
    <div
      ref={containerRef}
      style={{
        maxHeight: NARRATOR_BODY_HEIGHT,
        overflow: 'hidden',
        position: 'relative',
        // Bottom fade mask when there's overflow
        ...(overflow > 0 && !scrolling ? {
          maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
        } : {}),
      }}
    >
      <div
        ref={innerRef}
        style={{
          transform: scrolling ? `translateY(-${overflow}px)` : 'translateY(0)',
          transition: scrolling && !paused
            ? `transform ${scrollDuration}s linear`
            : 'none',
          color: 'rgba(255,255,255,0.82)',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: FONT_SANS,
        }}
      >
        {text.split('\n\n').map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0' }}>{para}</p>
        ))}
      </div>
    </div>
  )
}

// ─── Narrator panel ──────────────────────────────────────────

interface NarratorPanelProps {
  narrator: NarratorCaption
  stepCounter: string
  paused: boolean
  dwell: number
}

function NarratorPanel({ narrator, stepCounter, paused, dwell }: NarratorPanelProps) {
  const pos = positionStyles(narrator.position)

  return (
    <div style={{
      ...pos,
      background: BG,
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: '14px 18px',
      boxShadow: SHADOW,
      border: BORDER,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {/* Headline row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.3,
          fontFamily: FONT_SANS,
        }}>
          {narrator.headline}
        </span>
        <span style={{
          color: TEAL,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          fontFamily: FONT_MONO,
          flexShrink: 0,
        }}>
          {stepCounter}
        </span>
      </div>

      {/* Scrolling body */}
      {narrator.body && (
        <ScrollingBody text={narrator.body} paused={paused} dwell={dwell} />
      )}
    </div>
  )
}

// ─── Simple caption bar (backward compat) ────────────────────

interface SimpleCaptionBarProps {
  caption: string
  opacity: number
  stepCounter: string
}

function SimpleCaptionBar({ caption, opacity, stepCounter }: SimpleCaptionBarProps) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      padding: '0 24px 20px',
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <div style={{
        background: BG,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 12,
        padding: '12px 24px',
        maxWidth: 720,
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: SHADOW,
        border: BORDER,
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: 14,
          fontWeight: 500,
          lineHeight: 1.5,
          fontFamily: FONT_SANS,
          opacity,
          transition: 'opacity 0.25s ease',
        }}>
          {caption}
        </span>
        <span style={{
          color: TEAL,
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          fontFamily: FONT_MONO,
        }}>
          {stepCounter}
        </span>
      </div>
    </div>
  )
}

// ─── Main overlay ────────────────────────────────────────────

interface KioskOverlayProps {
  state: KioskState
}

export function KioskOverlay({ state }: KioskOverlayProps) {
  const { currentStep, totalSteps, caption, narrator, paused, done } = state

  const progress = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0
  const stepCounter = `${currentStep + 1}/${totalSteps}${paused ? ' \u23F8' : ''}`

  // Cross-fade for simple caption mode
  const [displayCaption, setDisplayCaption] = useState<string>(caption)
  const [opacity, setOpacity] = useState<number>(1)
  const fadeTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    // Only cross-fade when in simple caption mode (no narrator)
    if (narrator) return
    if (caption === displayCaption) return
    setOpacity(0)
    fadeTimer.current = setTimeout(() => {
      setDisplayCaption(caption)
      setOpacity(1)
    }, 250)
    return () => clearTimeout(fadeTimer.current)
  }, [caption, displayCaption, narrator])

  // Sync displayCaption when narrator clears back to simple mode
  useEffect(() => {
    if (!narrator && caption !== displayCaption) {
      setDisplayCaption(caption)
      setOpacity(1)
    }
  }, [narrator, caption, displayCaption])

  // Compute dwell for the current step (for ScrollingBody duration)
  const currentDwell = useCallback((): number => {
    if (narrator?.body) {
      const charDwell = narrator.body.length * TIMING.NARRATOR_MS_PER_CHAR
      return charDwell + TIMING.NARRATOR_DWELL_PADDING
    }
    return TIMING.CAPTION_READ
  }, [narrator])

  if (done) return null

  return (
    <>
      {/* Top: progress rail — always present */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'rgba(255,255,255,0.08)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #14B8A6, #0D9488)',
          transition: 'width 0.6s ease-out',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      {/* Caption area: narrator panel or simple caption bar */}
      {narrator ? (
        <NarratorPanel
          narrator={narrator}
          stepCounter={stepCounter}
          paused={paused}
          dwell={currentDwell()}
        />
      ) : displayCaption ? (
        <SimpleCaptionBar
          caption={displayCaption}
          opacity={opacity}
          stepCounter={stepCounter}
        />
      ) : null}
    </>
  )
}
