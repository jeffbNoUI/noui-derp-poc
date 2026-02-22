/**
 * Learning Module — three-layer sidebar (onboarding, rules, checklist) with confirm/next actions.
 * Extracted from GuidedWorkspace.tsx for file size compliance (~200 line limit).
 * Consumed by: GuidedWorkspace, ExpertMode (inline mini-checklist)
 * Depends on: guided-types.ts (LayerState), guided-help.ts (StageHelp), theme (C), Badge
 */
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import type { StageHelp } from './guided-help'
import type { LayerState } from './guided-types'

export interface LearningModuleProps {
  stage: StageHelp
  confirmed: Set<string>
  checkedItems: Set<number>
  layers: LayerState
  canConfirm: boolean
  isLastStage: boolean
  allConfirmed: boolean
  saveStatus: string
  onToggleCheck: (index: number) => void
  onToggleLayer: (layer: keyof LayerState) => void
  onConfirm: () => void
  onNext: () => void
  onUnconfirm: () => void
  onSave: () => void
}

export function LearningModule({
  stage, confirmed, checkedItems, layers, canConfirm,
  isLastStage, allConfirmed, saveStatus,
  onToggleCheck, onToggleLayer, onConfirm, onNext, onUnconfirm, onSave,
}: LearningModuleProps) {
  const isConfirmed = confirmed.has(stage.id)
  const checkCount = checkedItems.size
  const checkTotal = stage.checklist.length

  return (
    <div style={{
      width: '280px', borderLeft: `1px solid ${C.border}`, flexShrink: 0,
      background: C.surface, display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden',
    }}>
      {/* Header with layer toggles */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          color: C.textDim, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1.5px', fontWeight: 600, marginBottom: '8px',
        }}>Learning Module</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
          {([
            { key: 'onboarding' as const, label: 'Onboard' },
            { key: 'rules' as const, label: 'Rules' },
            { key: 'checklist' as const, label: 'Checklist' },
          ]).map(({ key, label }) => (
            <button key={key}
              onClick={() => onToggleLayer(key)}
              style={{
                padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                border: `1px solid ${layers[key] ? C.accentSolid : C.border}`,
                background: layers[key] ? C.accentMuted : 'transparent',
                color: layers[key] ? C.accent : C.textMuted,
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Scrollable content layers */}
      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>

        {/* Onboarding layer */}
        {layers.onboarding && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
              letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
            }}>Why This Matters</div>
            <div style={{ color: C.textSecondary, fontSize: '11px', lineHeight: '1.55' }}>
              {stage.onboarding}
            </div>
          </div>
        )}

        {/* Rules reference layer */}
        {layers.rules && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
              letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
            }}>Rules Reference</div>
            {stage.rules.map((rule, i) => (
              <div key={i} style={{
                padding: '4px 0', borderBottom: `1px solid ${C.borderSubtle}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Badge text={rule.citation} bg={C.accentMuted} color={C.accent} />
                </div>
                <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
                  {rule.desc}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Verification checklist layer */}
        {layers.checklist && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{
              color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
              letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
            }}>Verify</div>
            {stage.checklist.map((item, i) => (
              <div key={i}
                onClick={() => !isConfirmed && onToggleCheck(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '4px 0',
                  cursor: isConfirmed ? 'default' : 'pointer',
                  borderRadius: '3px',
                }}>
                <span style={{
                  color: checkedItems.has(i) ? C.success : C.textDim,
                  fontSize: '12px', flexShrink: 0, lineHeight: '1.3',
                }}>
                  {checkedItems.has(i) ? '\u2611' : '\u2610'}
                </span>
                <span style={{
                  color: checkedItems.has(i) ? C.text : C.textSecondary,
                  fontSize: '10.5px', lineHeight: '1.4',
                }}>{item}</span>
              </div>
            ))}

            {/* Checklist completion counter */}
            <div style={{
              marginTop: '6px', padding: '4px 0',
              borderTop: `1px solid ${C.borderSubtle}`,
              textAlign: 'center' as const,
            }}>
              <span style={{
                color: checkCount >= checkTotal ? C.success : C.textMuted,
                fontSize: '10px', fontWeight: 600,
              }}>
                {checkCount} of {checkTotal} verified
              </span>
            </div>
          </div>
        )}

        {/* Next action */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
            letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
          }}>Next</div>
          <div style={{ color: C.accent, fontSize: '10.5px', fontStyle: 'italic' }}>
            {stage.nextAction}
          </div>
        </div>
      </div>

      {/* Action footer — confirm, next, edit, submit */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.borderSubtle}` }}>
        {/* Confirm button (when current stage not yet confirmed) */}
        {!isConfirmed && (
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            style={{
              width: '100%', padding: '8px 0', borderRadius: '6px', border: 'none',
              background: canConfirm
                ? `linear-gradient(135deg,${C.accent},#06B6D4)`
                : C.border,
              color: canConfirm ? C.bg : C.textDim,
              fontWeight: 700, fontSize: '11.5px',
              cursor: canConfirm ? 'pointer' : 'default',
              boxShadow: canConfirm ? `0 2px 8px ${C.accentGlow}` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {canConfirm
              ? `${stage.confirmLabel} \u2192`
              : `Complete checklist to continue (${checkCount}/${checkTotal})`}
          </button>
        )}

        {/* Next + Edit buttons (when confirmed, not last) */}
        {isConfirmed && !isLastStage && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onNext}
              style={{
                flex: 1, padding: '8px 0', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.accent},#06B6D4)`,
                color: C.bg, fontWeight: 700, cursor: 'pointer', fontSize: '11.5px',
                boxShadow: `0 2px 8px ${C.accentGlow}`,
              }}
            >
              Next Stage {'\u2192'}
            </button>
            <button
              onClick={onUnconfirm}
              style={{
                padding: '8px 12px', borderRadius: '6px',
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.textMuted, cursor: 'pointer', fontSize: '10.5px',
              }}
            >
              Edit
            </button>
          </div>
        )}

        {/* Edit only (last stage, confirmed but not all confirmed yet) */}
        {isConfirmed && isLastStage && !allConfirmed && (
          <button
            onClick={onUnconfirm}
            style={{
              width: '100%', padding: '8px 0', borderRadius: '6px',
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.textMuted, cursor: 'pointer', fontSize: '10.5px',
            }}
          >
            Edit
          </button>
        )}

        {/* Submit button (last stage, all confirmed) */}
        {isLastStage && allConfirmed && saveStatus === 'idle' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={onSave}
              style={{
                flex: 1, padding: '8px 0', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.success},#059669)`,
                color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '11.5px',
                boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
              }}
            >
              Save & Submit
            </button>
            <button
              onClick={onUnconfirm}
              style={{
                padding: '8px 12px', borderRadius: '6px',
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.textMuted, cursor: 'pointer', fontSize: '10.5px',
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
