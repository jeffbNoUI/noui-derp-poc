/**
 * Stage carousel — horizontal carousel with flat peek cards, full-content active card,
 * chevron arrow buttons, keyboard navigation, and labeled pill navigation.
 * Consumed by: GuidedWorkspace (expert mode main content, ~75% width)
 * Depends on: guided-help.ts (StageHelp), guided-signals.ts (StageSignal),
 *   stages/StageProps, theme (C), Badge
 */
import { useState, useEffect, useCallback } from 'react'
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import type { StageHelp } from './guided-help'
import type { StageSignal } from './guided-signals'
import type { StageProps } from './stages/StageProps'

const SIGNAL_COLORS: Record<string, string> = {
  green: C.success, amber: '#F59E0B', red: C.danger,
}

// Short labels for the pill navigation — derived from stage IDs
const SHORT_LABELS: Record<string, string> = {
  'application-intake': 'Intake',
  'member-verify': 'Member',
  'service-credit': 'Service',
  'eligibility': 'Eligibility',
  'benefit-calc': 'Benefit',
  'payment-options': 'Payment',
  'supplemental': 'Supplemental',
  'dro': 'DRO',
  'review-certify': 'Review',
}

// ─── Peek Card (flat, always readable) ────────────────────────

function PeekCard({ stage, isDone, signal, side, onClick }: {
  stage: StageHelp; isDone: boolean; signal?: StageSignal
  side: 'prev' | 'next'; onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative' as const,
        width: 'clamp(140px, 15%, 200px)', flexShrink: 0,
        alignSelf: 'center' as const, maxHeight: '180px',
        borderRadius: '12px', cursor: 'pointer',
        background: isDone
          ? `linear-gradient(135deg, rgba(46,125,50,0.03), rgba(46,125,50,0.06))`
          : `linear-gradient(180deg, ${C.surface}, ${C.elevated})`,
        border: `1px solid ${isDone ? C.successBorder : hovered ? C.accent : '#6a7070'}`,
        display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', justifyContent: 'center',
        padding: '20px 14px', gap: '8px',
        // Flat depth — scale only, no 3D rotation
        transform: `scale(${hovered ? 1 : 0.95})`,
        zIndex: hovered ? 1 : 0,
        transition: 'all 0.25s ease',
        opacity: hovered ? 1 : 0.85,
        boxShadow: hovered
          ? `0 8px 28px rgba(0,0,0,0.12), 0 0 12px ${C.accentGlow}`
          : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Icon */}
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: isDone
          ? `linear-gradient(135deg, rgba(46,125,50,0.06), rgba(46,125,50,0.12))`
          : `linear-gradient(135deg, ${C.accentMuted}, rgba(0,121,107,0.1))`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
      }}>{isDone ? '\u2713' : stage.icon}</div>

      {/* Title */}
      <div style={{ textAlign: 'center' as const, lineHeight: '1.3' }}>
        <div style={{
          fontSize: '11px', fontWeight: 600,
          color: isDone ? C.success : C.text,
        }}>{stage.title}</div>
        <div style={{
          fontSize: '8.5px', color: C.textMuted, marginTop: '3px',
        }}>{isDone ? 'Confirmed' : 'Pending review'}</div>
      </div>

      {/* Signal dot */}
      {signal && !isDone && (
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: SIGNAL_COLORS[signal.level] ?? C.textDim,
          boxShadow: `0 0 4px ${SIGNAL_COLORS[signal.level] ?? C.textDim}40`,
        }} />
      )}

      {/* Hover arrow hint */}
      <div style={{
        position: 'absolute' as const,
        top: '50%', [side === 'prev' ? 'left' : 'right']: '6px',
        transform: 'translateY(-50%)',
        color: C.accent, fontSize: '14px', fontWeight: 700,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none' as const,
      }}>
        {side === 'prev' ? '\u2039' : '\u203A'}
      </div>
    </div>
  )
}

// ─── Active Card (full stage content, gradient border) ──────────

function ActiveCard({ stage, isDone, signal, stageId, StageComponent, stageProps, contentMaxWidth, onConfirm, onUnconfirm }: {
  stage: StageHelp; isDone: boolean; signal?: StageSignal; stageId: string
  StageComponent: React.ComponentType<StageProps>; stageProps: StageProps
  contentMaxWidth?: string
  onConfirm: () => void; onUnconfirm: () => void
}) {
  return (
    /* Gradient border wrapper — keyed by stageId for transition */
    <div key={stageId} data-discovery="carousel-card" style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' as const,
      position: 'relative' as const, zIndex: 1,
      background: isDone
        ? `linear-gradient(135deg, ${C.success}, #1b5e20, ${C.success})`
        : `linear-gradient(135deg, ${C.accent}, #004d40, #00695c, ${C.accent})`,
      padding: '1.5px', borderRadius: '14px',
      boxShadow: isDone
        ? `0 4px 24px rgba(46,125,50,0.1), 0 0 16px rgba(46,125,50,0.06)`
        : `0 4px 24px rgba(0,0,0,0.06), 0 0 20px ${C.accentGlow}, 0 0 40px rgba(0,121,107,0.03)`,
      transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      transform: 'translateZ(0)',
      animation: 'card-slide-in 0.25s ease-out',
    }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column' as const,
        background: `linear-gradient(180deg, #ffffff 0%, ${C.elevated} 100%)`,
        borderRadius: '13px', overflow: 'hidden',
      }}>
        {/* Stage header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.012)',
          borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: isDone
              ? `linear-gradient(135deg, rgba(46,125,50,0.06), rgba(46,125,50,0.12))`
              : `linear-gradient(135deg, ${C.accentMuted}, rgba(0,121,107,0.1))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0,
          }}>{isDone ? '\u2713' : stage.icon}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '13.5px', fontWeight: 700,
              color: isDone ? C.success : C.text,
            }}>{stage.title}</div>
            <div style={{
              fontSize: '10px', color: C.textMuted, marginTop: '1px',
            }}>{stage.subtitle}</div>
          </div>
          {signal && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: SIGNAL_COLORS[signal.level] ?? C.textDim,
                boxShadow: `0 0 6px ${SIGNAL_COLORS[signal.level] ?? C.textDim}40`,
              }} />
              <span style={{
                color: C.textMuted, fontSize: '9.5px', maxWidth: '180px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>{signal.reason}</span>
            </div>
          )}
          {isDone && <Badge text="Confirmed" bg={C.successMuted} color={C.success} />}
        </div>

        {/* Stage content (scrollable) */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 24px' }}>
          <div style={{ maxWidth: contentMaxWidth ?? '780px', margin: '0 auto' }}>
            <StageComponent {...stageProps} />
          </div>
        </div>

        {/* Action footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 16px',
          borderTop: `1px solid ${C.borderSubtle}`,
          background: 'rgba(0,0,0,0.012)', flexShrink: 0,
        }}>
          {isDone ? (
            <>
              <span style={{ color: C.success, fontSize: '11px', fontWeight: 600 }}>
                {'\u2713'} Confirmed
              </span>
              <button onClick={onUnconfirm} style={{
                padding: '5px 18px', borderRadius: '6px',
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.textSecondary, cursor: 'pointer', fontSize: '10.5px',
                fontWeight: 500, transition: 'all 0.15s',
              }}>Edit</button>
            </>
          ) : (
            <>
              <div />
              <button onClick={onConfirm} style={{
                padding: '6px 22px', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.accent},#00695c)`,
                color: '#ffffff', fontWeight: 700, fontSize: '11px',
                cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: `0 2px 10px ${C.accentGlow}`,
              }}>{stage.confirmLabel}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Labeled Pill Navigation ────────────────────────────────────

function PillNav({ stages, activeIndex, confirmed, onSelect }: {
  stages: StageHelp[]; activeIndex: number; confirmed: Set<string>
  onSelect: (stageId: string) => void
}) {
  const [hoveredPill, setHoveredPill] = useState<number | null>(null)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '4px', padding: '8px 12px 6px', flexWrap: 'wrap' as const,
    }}>
      {stages.map((s, i) => {
        const isDone = confirmed.has(s.id)
        const isActive = i === activeIndex
        const isHovered = hoveredPill === i
        const label = SHORT_LABELS[s.id] || s.title.split(' ')[0]

        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            onMouseEnter={() => setHoveredPill(i)}
            onMouseLeave={() => setHoveredPill(null)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '3px',
              padding: isActive ? '4px 12px' : '3px 9px',
              borderRadius: '14px', cursor: 'pointer',
              background: isActive
                ? `linear-gradient(135deg, ${C.accent}, #00695c)`
                : isDone
                  ? C.successMuted
                  : isHovered ? `${C.accent}08` : 'transparent',
              color: isActive ? '#ffffff' : isDone ? C.success : C.textSecondary,
              border: `1px solid ${
                isActive ? C.accent
                  : isDone ? C.successBorder
                  : isHovered ? C.border : C.borderSubtle
              }`,
              fontSize: isActive ? '10px' : '9px',
              fontWeight: isActive ? 700 : isDone ? 600 : 500,
              lineHeight: '1',
              transition: 'all 0.2s ease',
              boxShadow: isActive ? `0 2px 8px ${C.accentGlow}` : 'none',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {isDone && !isActive && (
              <span style={{ fontSize: '8px' }}>{'\u2713'}</span>
            )}
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Carousel Component ────────────────────────────────────

export interface StageNavProps {
  stages: StageHelp[]
  activeStageId: string
  confirmed: Set<string>
  signals: Record<string, StageSignal>
  stageProps: StageProps
  stageComponents: Record<string, React.ComponentType<StageProps>>
  contentMaxWidth?: string
  onSelect: (stageId: string) => void
  onConfirm: (stageId: string) => void
  onUnconfirm: (stageId: string) => void
}

export function StageNav({
  stages, activeStageId, confirmed, signals, stageProps,
  stageComponents, contentMaxWidth, onSelect, onConfirm, onUnconfirm,
}: StageNavProps) {
  const activeIndex = stages.findIndex(s => s.id === activeStageId)
  const prevStage = activeIndex > 0 ? stages[activeIndex - 1] : null
  const nextStage = activeIndex < stages.length - 1 ? stages[activeIndex + 1] : null
  const activeStage = stages[activeIndex]
  const ActiveComponent = activeStage ? stageComponents[activeStage.id] : null

  // Keyboard navigation: Left/Right arrow keys
  const goPrev = useCallback(() => {
    if (prevStage) onSelect(prevStage.id)
  }, [prevStage, onSelect])
  const goNext = useCallback(() => {
    if (nextStage) onSelect(nextStage.id)
  }, [nextStage, onSelect])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext])

  if (!activeStage || !ActiveComponent) return null

  return (
    <div style={{
      display: 'flex', flexDirection: 'column' as const, height: '100%',
      overflow: 'hidden',
    }}>
      {/* Keyframe for active card slide-in */}
      <style>{`
        @keyframes card-slide-in {
          from { opacity: 0.7; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 16px',
        borderBottom: `1px solid ${C.borderSubtle}`,
        background: C.surface, flexShrink: 0,
      }}>
        <span style={{
          color: C.textSecondary, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1.2px', fontWeight: 600,
        }}>Stage {activeIndex + 1} of {stages.length}</span>
        <span style={{
          color: C.textMuted, fontSize: '9px', fontWeight: 500,
        }}>
          {stages.filter(s => confirmed.has(s.id)).length} confirmed
          {' \u00B7 '}
          <span style={{ color: C.textDim }}>
            {'\u2190\u2192'} arrow keys
          </span>
        </span>
      </div>

      {/* Horizontal carousel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'stretch',
        gap: '6px', padding: '8px 6px 0',
        overflow: 'hidden', minHeight: 0,
      }}>
        {/* Previous peek card */}
        {prevStage ? (
          <PeekCard
            stage={prevStage}
            isDone={confirmed.has(prevStage.id)}
            signal={signals[prevStage.id]}
            side="prev"
            onClick={() => onSelect(prevStage.id)}
          />
        ) : (
          <div style={{ width: '12px', flexShrink: 0 }} />
        )}

        {/* Active card (faces forward, full content) */}
        <ActiveCard
          stage={activeStage}
          stageId={activeStage.id}
          isDone={confirmed.has(activeStage.id)}
          signal={signals[activeStage.id]}
          StageComponent={ActiveComponent}
          stageProps={stageProps}
          contentMaxWidth={contentMaxWidth}
          onConfirm={() => onConfirm(activeStage.id)}
          onUnconfirm={() => onUnconfirm(activeStage.id)}
        />

        {/* Next peek card */}
        {nextStage ? (
          <PeekCard
            stage={nextStage}
            isDone={confirmed.has(nextStage.id)}
            signal={signals[nextStage.id]}
            side="next"
            onClick={() => onSelect(nextStage.id)}
          />
        ) : (
          <div style={{ width: '12px', flexShrink: 0 }} />
        )}

      </div>

      {/* Labeled pill navigation */}
      <div style={{ flexShrink: 0 }}>
        <PillNav
          stages={stages}
          activeIndex={activeIndex}
          confirmed={confirmed}
          onSelect={onSelect}
        />
      </div>
    </div>
  )
}
