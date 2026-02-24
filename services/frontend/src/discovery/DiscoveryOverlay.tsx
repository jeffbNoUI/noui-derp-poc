/**
 * Discovery spotlight overlay — SVG even-odd cutout with positioned tooltip.
 * Highlights UI affordances once per analyst, then never again (localStorage).
 * Consumed by: StaffLayout.tsx (rendered after Outlet)
 * Depends on: useDiscovery.ts, discovery-types.ts, theme (C)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { C } from '@/theme'
import { useDiscovery } from './useDiscovery'
import type { DiscoveryHint } from './discovery-types'

// ─── SVG spotlight with even-odd cutout ─────────────────────

function SpotlightSVG({ targetRect }: { targetRect: DOMRect }) {
  const [vw, setVw] = useState(window.innerWidth)
  const [vh, setVh] = useState(window.innerHeight)

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pad = 6
  const r = 8
  const x = targetRect.left - pad
  const y = targetRect.top - pad
  const w = targetRect.width + pad * 2
  const h = targetRect.height + pad * 2

  return (
    <svg
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: 10000,
      }}
      viewBox={`0 0 ${vw} ${vh}`}
    >
      <path
        fillRule="evenodd"
        d={[
          // Outer rect (full viewport)
          `M0,0 H${vw} V${vh} H0 Z`,
          // Inner rounded rect (cutout) — drawn counter-clockwise
          `M${x + r},${y}`,
          `H${x + w - r}`,
          `Q${x + w},${y} ${x + w},${y + r}`,
          `V${y + h - r}`,
          `Q${x + w},${y + h} ${x + w - r},${y + h}`,
          `H${x + r}`,
          `Q${x},${y + h} ${x},${y + h - r}`,
          `V${y + r}`,
          `Q${x},${y} ${x + r},${y}`,
          'Z',
        ].join(' ')}
        fill="rgba(0,0,0,0.55)"
      />
    </svg>
  )
}

// ─── Tooltip card ───────────────────────────────────────────

function DiscoveryTooltip({
  hint, targetRect, onDismiss, stepLabel,
}: {
  hint: DiscoveryHint; targetRect: DOMRect
  onDismiss: () => void; stepLabel: string
}) {
  const pad = 12
  const tooltipW = 280

  // Compute position based on placement
  let top = 0; let left = 0
  switch (hint.placement) {
    case 'bottom':
      top = targetRect.bottom + pad
      left = targetRect.left + targetRect.width / 2 - tooltipW / 2
      break
    case 'top':
      top = targetRect.top - pad - 140 // approx tooltip height
      left = targetRect.left + targetRect.width / 2 - tooltipW / 2
      break
    case 'left':
      top = targetRect.top + targetRect.height / 2 - 60
      left = targetRect.left - tooltipW - pad
      break
    case 'right':
      top = targetRect.top + targetRect.height / 2 - 60
      left = targetRect.right + pad
      break
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8))
  top = Math.max(8, top)

  return (
    <div style={{
      position: 'fixed', top, left, width: tooltipW, zIndex: 10001,
      background: C.surface, borderRadius: '10px',
      border: `1px solid ${C.accentSolid}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px ${C.accentGlow}`,
      padding: '14px 16px',
      animation: 'discovery-fade-in 0.3s ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <span style={{
          color: C.accent, fontSize: '12.5px', fontWeight: 700,
        }}>{hint.headline}</span>
        <span style={{
          color: C.textDim, fontSize: '9px', fontWeight: 500,
        }}>{stepLabel}</span>
      </div>
      <div style={{
        color: C.textSecondary, fontSize: '11.5px', lineHeight: '1.5',
        marginBottom: '10px',
      }}>{hint.body}</div>
      <button
        onClick={onDismiss}
        style={{
          padding: '5px 16px', borderRadius: '5px', border: 'none',
          background: `linear-gradient(135deg,${C.accent},#00695c)`,
          color: '#ffffff', fontWeight: 600, fontSize: '10.5px',
          cursor: 'pointer', boxShadow: `0 2px 8px ${C.accentGlow}`,
        }}
      >Got it</button>
    </div>
  )
}

// ─── Main overlay orchestrator ──────────────────────────────

export function DiscoveryOverlay() {
  const { currentHint, dismiss, currentIndex, totalHints } = useDiscovery()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const retryRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Find target element with RAF retry loop
  const findTarget = useCallback((selector: string) => {
    const el = document.querySelector(selector)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
      retryRef.current = 0
      return
    }
    if (retryRef.current < 3) {
      retryRef.current++
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(() => findTarget(selector), 500)
      })
    } else {
      // Element not found after retries — skip this hint
      setTargetRect(null)
      retryRef.current = 0
      dismiss()
    }
  }, [dismiss])

  useEffect(() => {
    if (!currentHint) { setTargetRect(null); return }
    retryRef.current = 0
    findTarget(currentHint.selector)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [currentHint?.id, findTarget])

  // Recalculate on resize
  useEffect(() => {
    if (!currentHint) return
    const onResize = () => {
      const el = document.querySelector(currentHint.selector)
      if (el) setTargetRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [currentHint?.id])

  if (!currentHint || !targetRect) return null

  const stepLabel = totalHints > 1 ? `${currentIndex} of ${totalHints}` : ''

  return (
    <>
      {/* Inject keyframes for fade-in animation */}
      <style>{`
        @keyframes discovery-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Click-to-dismiss backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          cursor: 'pointer',
        }}
      />

      <SpotlightSVG targetRect={targetRect} />
      <DiscoveryTooltip
        hint={currentHint}
        targetRect={targetRect}
        onDismiss={dismiss}
        stepLabel={stepLabel}
      />
    </>
  )
}
