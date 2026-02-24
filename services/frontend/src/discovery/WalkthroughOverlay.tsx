/**
 * Walkthrough overlay — spotlight with enhanced tooltip supporting Back/Next/Skip All,
 * step counter, and keyboard navigation (Left/Right/Escape).
 * Reuses the SpotlightSVG pattern from DiscoveryOverlay.
 * Consumed by: StaffLayout.tsx
 * Depends on: useWalkthrough.ts, theme (C)
 */
import { useEffect, useState } from 'react'
import { C } from '@/theme'
import type { WalkthroughStep } from './walkthrough-types'

// ─── SVG spotlight (same pattern as DiscoveryOverlay) ───────

function SpotlightSVG({ targetRect }: { targetRect: DOMRect }) {
  const [vw, setVw] = useState(window.innerWidth)
  const [vh, setVh] = useState(window.innerHeight)

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const pad = 8; const r = 10
  const x = targetRect.left - pad
  const y = targetRect.top - pad
  const w = targetRect.width + pad * 2
  const h = targetRect.height + pad * 2

  return (
    <svg style={{
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      pointerEvents: 'none', zIndex: 10000,
    }} viewBox={`0 0 ${vw} ${vh}`}>
      <path fillRule="evenodd" d={[
        `M0,0 H${vw} V${vh} H0 Z`,
        `M${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r}`,
        `V${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h}`,
        `H${x + r} Q${x},${y + h} ${x},${y + h - r}`,
        `V${y + r} Q${x},${y} ${x + r},${y} Z`,
      ].join(' ')} fill="rgba(0,0,0,0.55)" />
    </svg>
  )
}

// ─── Walkthrough tooltip ─────────────────────────────────────

function WalkthroughTooltip({
  step, stepIndex, totalSteps, targetRect,
  onBack, onNext, onSkipAll,
}: {
  step: WalkthroughStep; stepIndex: number; totalSteps: number
  targetRect: DOMRect | null
  onBack: () => void; onNext: () => void; onSkipAll: () => void
}) {
  const tooltipW = 320
  const pad = 14
  const isLast = stepIndex === totalSteps - 1

  let top = 200; let left = window.innerWidth / 2 - tooltipW / 2
  if (targetRect) {
    switch (step.placement) {
      case 'bottom':
        top = targetRect.bottom + pad
        left = targetRect.left + targetRect.width / 2 - tooltipW / 2
        break
      case 'top':
        top = targetRect.top - pad - 160
        left = targetRect.left + targetRect.width / 2 - tooltipW / 2
        break
      case 'left':
        top = targetRect.top + targetRect.height / 2 - 80
        left = targetRect.left - tooltipW - pad
        break
      case 'right':
        top = targetRect.top + targetRect.height / 2 - 80
        left = targetRect.right + pad
        break
    }
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipW - 8))
    top = Math.max(8, top)
  }

  return (
    <div style={{
      position: 'fixed', top, left, width: tooltipW, zIndex: 10001,
      background: C.surface, borderRadius: '12px',
      border: `1px solid ${C.accentSolid}`,
      boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px ${C.accentGlow}`,
      padding: '16px 18px',
      animation: 'wt-fade-in 0.25s ease-out',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <span style={{ color: C.accent, fontSize: '13px', fontWeight: 700 }}>{step.headline}</span>
        <span style={{ color: C.textDim, fontSize: '9px' }}>
          {stepIndex + 1} / {totalSteps}
        </span>
      </div>
      <div style={{
        color: C.textSecondary, fontSize: '11.5px', lineHeight: '1.55',
        marginBottom: '12px',
      }}>{step.body}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {stepIndex > 0 && (
          <button onClick={onBack} style={{
            padding: '5px 12px', borderRadius: '5px',
            border: `1px solid ${C.border}`, background: 'transparent',
            color: C.textSecondary, fontSize: '10.5px', cursor: 'pointer',
          }}>{'\u2190'} Back</button>
        )}
        <button onClick={onNext} style={{
          padding: '5px 16px', borderRadius: '5px', border: 'none',
          background: `linear-gradient(135deg,${C.accent},#00695c)`,
          color: '#fff', fontWeight: 600, fontSize: '10.5px', cursor: 'pointer',
          boxShadow: `0 2px 8px ${C.accentGlow}`,
        }}>{isLast ? 'Finish' : 'Next \u2192'}</button>
        <div style={{ flex: 1 }} />
        <button onClick={onSkipAll} style={{
          padding: '4px 8px', borderRadius: '4px', border: 'none',
          background: 'transparent', color: C.textDim, fontSize: '9px',
          cursor: 'pointer', textDecoration: 'underline',
        }}>Skip tour</button>
      </div>
    </div>
  )
}

// ─── Main overlay ─────────────────────────────────────────────

export function WalkthroughOverlay({
  active, currentStep, stepIndex, totalSteps, targetRect,
  onBack, onNext, onSkipAll,
}: {
  active: boolean
  currentStep: WalkthroughStep | null
  stepIndex: number
  totalSteps: number
  targetRect: DOMRect | null
  onBack: () => void
  onNext: () => void
  onSkipAll: () => void
}) {
  // Keyboard navigation
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); onNext() }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onBack() }
      if (e.key === 'Escape') { e.preventDefault(); onSkipAll() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onNext, onBack, onSkipAll])

  if (!active || !currentStep) return null

  return (
    <>
      <style>{`
        @keyframes wt-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Click-to-advance backdrop */}
      <div
        onClick={onNext}
        style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: 'pointer' }}
      />

      {targetRect && <SpotlightSVG targetRect={targetRect} />}

      <WalkthroughTooltip
        step={currentStep}
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        targetRect={targetRect}
        onBack={onBack}
        onNext={onNext}
        onSkipAll={onSkipAll}
      />
    </>
  )
}
