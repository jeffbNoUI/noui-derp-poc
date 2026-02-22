/**
 * Expert mode — all stages visible as collapsible cards in a single scrollable view.
 * Each card shows a header row (icon, title, signal dot, confirmed badge) and
 * expands to reveal the stage component with an inline mini-checklist and confirm button.
 * Consumed by: GuidedWorkspace (conditional render when viewMode === 'expert')
 * Depends on: guided-help.ts (StageHelp), guided-signals.ts (StageSignal),
 *   guided-types.ts (LayerState), theme (C), Badge, stage components
 */
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import type { StageHelp } from './guided-help'
import type { StageSignal } from './guided-signals'
import type { StageProps } from './stages/StageProps'

const SIGNAL_COLORS: Record<string, string> = {
  green: C.success,
  amber: '#F59E0B',
  red: C.danger,
}

export interface ExpertModeProps {
  stages: StageHelp[]
  stageComponents: Record<string, React.ComponentType<StageProps>>
  stageProps: StageProps
  signals: Record<string, StageSignal>
  confirmed: Set<string>
  expandedStages: Set<string>
  checkedItems: Record<string, Set<number>>
  layers: { checklist: boolean }
  onToggleExpand: (stageId: string) => void
  onConfirm: (stageId: string) => void
  onUnconfirm: (stageId: string) => void
  onToggleCheck: (stageId: string, index: number) => void
}

export function ExpertMode({
  stages, stageComponents, stageProps, signals, confirmed, expandedStages,
  checkedItems, layers, onToggleExpand, onConfirm, onUnconfirm, onToggleCheck,
}: ExpertModeProps) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px 80px' }}>
      {stages.map(stage => {
        const isExpanded = expandedStages.has(stage.id)
        const isConfirmed = confirmed.has(stage.id)
        const signal = signals[stage.id]
        const StageComponent = stageComponents[stage.id]
        const checked = checkedItems[stage.id] ?? new Set<number>()
        const checkTotal = stage.checklist.length
        const checklistComplete = checked.size >= checkTotal
        const canConfirm = (layers.checklist ? checklistComplete : true) && !isConfirmed

        return (
          <div key={stage.id} style={{
            marginBottom: '4px', borderRadius: '6px',
            border: `1px solid ${isExpanded ? C.accent : isConfirmed ? C.successBorder : C.border}`,
            background: isExpanded ? C.elevated : C.surface,
            transition: 'all 0.15s',
          }}>
            {/* Collapsed header row */}
            <div
              onClick={() => onToggleExpand(stage.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', cursor: 'pointer',
                borderRadius: isExpanded ? '6px 6px 0 0' : '6px',
              }}
            >
              <span style={{ fontSize: '13px', flexShrink: 0 }}>{stage.icon}</span>
              <span style={{
                color: isConfirmed ? C.success : C.text,
                fontWeight: 600, fontSize: '12px', flex: 1,
              }}>{stage.title}</span>

              {/* Signal dot + reason */}
              {signal && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: SIGNAL_COLORS[signal.level] ?? C.textDim,
                  }} />
                  <span style={{
                    color: C.textMuted, fontSize: '9px', maxWidth: '140px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
                  }}>{signal.reason}</span>
                </div>
              )}

              {/* Confirmed badge */}
              {isConfirmed && (
                <Badge text="Confirmed" bg={C.successMuted} color={C.success} />
              )}

              {/* Expand/collapse chevron */}
              <span style={{
                color: C.textDim, fontSize: '11px', flexShrink: 0,
                transition: 'transform 0.2s',
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}>{'\u25BC'}</span>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{
                borderTop: `1px solid ${C.borderSubtle}`,
                display: 'flex',
              }}>
                {/* Stage component */}
                <div style={{ flex: 1, padding: '12px', overflow: 'auto' }}>
                  {StageComponent && <StageComponent {...stageProps} />}
                </div>

                {/* Mini-checklist sidebar + confirm button */}
                <div style={{
                  width: '180px', borderLeft: `1px solid ${C.borderSubtle}`,
                  padding: '10px', flexShrink: 0, display: 'flex', flexDirection: 'column' as const,
                }}>
                  {layers.checklist && (
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
                        letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
                      }}>Verify</div>
                      {stage.checklist.map((item, i) => (
                        <div key={i}
                          onClick={() => !isConfirmed && onToggleCheck(stage.id, i)}
                          style={{
                            display: 'flex', alignItems: 'flex-start', gap: '4px', padding: '2px 0',
                            cursor: isConfirmed ? 'default' : 'pointer',
                          }}>
                          <span style={{
                            color: checked.has(i) ? C.success : C.textDim,
                            fontSize: '11px', flexShrink: 0, lineHeight: '1.3',
                          }}>
                            {checked.has(i) ? '\u2611' : '\u2610'}
                          </span>
                          <span style={{
                            color: checked.has(i) ? C.text : C.textSecondary,
                            fontSize: '9.5px', lineHeight: '1.4',
                          }}>{item}</span>
                        </div>
                      ))}
                      <div style={{
                        marginTop: '4px', fontSize: '9px', fontWeight: 600, textAlign: 'center' as const,
                        color: checklistComplete ? C.success : C.textMuted,
                      }}>
                        {checked.size}/{checkTotal}
                      </div>
                    </div>
                  )}

                  {/* Confirm / Unconfirm button */}
                  <div style={{ marginTop: '8px' }}>
                    {!isConfirmed ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); canConfirm && onConfirm(stage.id) }}
                        disabled={!canConfirm}
                        style={{
                          width: '100%', padding: '6px 0', borderRadius: '5px', border: 'none',
                          background: canConfirm
                            ? `linear-gradient(135deg,${C.accent},#06B6D4)`
                            : C.border,
                          color: canConfirm ? C.bg : C.textDim,
                          fontWeight: 700, fontSize: '10px',
                          cursor: canConfirm ? 'pointer' : 'default',
                          transition: 'all 0.2s',
                        }}
                      >
                        {canConfirm ? stage.confirmLabel : `${checked.size}/${checkTotal}`}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUnconfirm(stage.id) }}
                        style={{
                          width: '100%', padding: '6px 0', borderRadius: '5px',
                          border: `1px solid ${C.border}`, background: 'transparent',
                          color: C.textMuted, cursor: 'pointer', fontSize: '10px',
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
