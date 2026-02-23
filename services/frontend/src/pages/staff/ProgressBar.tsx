/**
 * Progress bar — extracted from GuidedWorkspace, enhanced with confidence signal dots
 * and a Guided/Expert mode toggle pill.
 * Consumed by: GuidedWorkspace
 * Depends on: guided-help.ts (StageHelp), guided-signals.ts (StageSignal), theme (C)
 */
import { C } from '@/theme'
import type { StageHelp } from './guided-help'
import type { StageSignal } from './guided-signals'

const SIGNAL_COLORS: Record<string, string> = {
  green: C.success,
  amber: '#F59E0B',
  red: C.danger,
}

export interface ProgressBarProps {
  stages: StageHelp[]
  currentIndex: number
  confirmed: Set<string>
  signals: Record<string, StageSignal>
  allConfirmed: boolean
  onGoTo: (index: number) => void
}

export function ProgressBar({
  stages, currentIndex, confirmed, signals, allConfirmed,
  onGoTo,
}: ProgressBarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 14px', background: C.surface,
      borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
    }}>
      <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
        {stages.map((s, i) => {
          const signal = signals[s.id]
          const canClick = confirmed.has(s.id) || i <= currentIndex
          return (
            <div key={s.id}
              onClick={() => canClick && onGoTo(i)}
              title={signal?.reason ?? ''}
              style={{ flex: 1, position: 'relative' as const }}
            >
              {/* Progress segment */}
              <div style={{
                height: '4px', borderRadius: '2px',
                background: confirmed.has(s.id)
                  ? C.success
                  : i === currentIndex
                    ? C.accent
                    : C.border,
                transition: 'background 0.3s',
                boxShadow: i === currentIndex ? `0 0 6px ${C.accentGlow}` : 'none',
                cursor: canClick ? 'pointer' : 'default',
              }} />
              {/* Confidence signal dot */}
              {signal && (
                <div style={{
                  position: 'absolute' as const, top: '-3px', right: '0px',
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: SIGNAL_COLORS[signal.level] ?? C.textDim,
                  border: `1px solid ${C.surface}`,
                }} />
              )}
            </div>
          )
        })}
      </div>
      <span style={{
        color: allConfirmed ? C.success : C.textMuted,
        fontSize: '10px', fontWeight: 600, flexShrink: 0,
      }}>
        Stage {currentIndex + 1} of {stages.length}
      </span>
    </div>
  )
}
