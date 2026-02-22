/**
 * Guided mode workspace — sequential stage-by-stage retirement application processing.
 * Learning Module with three toggleable layers (onboarding, rules, checklist), interactive
 * verification checklists that gate stage confirmation, and a static benefit display in
 * the member banner.
 * Consumed by: StaffCaseView (via /staff/case/:memberId/guided route)
 * Depends on: all data hooks, demo data, theme (C, tierMeta, fmt), Badge,
 *   guided-help.ts, guided-composition.ts, stage components
 */
import { useState, useCallback, useEffect, useReducer } from 'react'
import { useMember, useServiceCredit, useDROs } from '@/hooks/useMember'
import {
  useEligibility, useBenefitCalculation, usePaymentOptions,
  useDROCalculation, useSaveElection,
} from '@/hooks/useCalculations'
import { C, tierMeta, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DEFAULT_RETIREMENT_DATES } from '@/lib/constants'
import { composeStages } from './guided-composition'
import type { StageHelp } from './guided-help'
import {
  Stage1MemberVerify, Stage2ServiceCredit, Stage3Eligibility,
  Stage4BenefitCalc, Stage5PaymentOptions, Stage6Supplemental,
  Stage7DRO, Stage8ReviewCertify,
} from './stages'
import type { StageProps } from './stages/StageProps'

// ─── State management ────────────────────────────────────────

interface LayerState {
  onboarding: boolean
  rules: boolean
  checklist: boolean
}

interface GuidedState {
  currentIndex: number
  confirmed: Set<string>
  electedOption: string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  saveError: string
  savedCaseId: number | null
  /** Per-stage checked checklist items: stageId → set of checked indices */
  checkedItems: Record<string, Set<number>>
  /** Learning module layer visibility */
  layers: LayerState
}

type GuidedAction =
  | { type: 'NEXT'; stageCount: number }
  | { type: 'BACK' }
  | { type: 'GO_TO'; index: number }
  | { type: 'CONFIRM'; stageId: string; stageCount: number }
  | { type: 'UNCONFIRM'; stageId: string }
  | { type: 'ELECT_OPTION'; option: string }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; caseId: number }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'TOGGLE_CHECK'; stageId: string; index: number }
  | { type: 'TOGGLE_LAYER'; layer: keyof LayerState }
  | { type: 'RESET' }

function reducer(state: GuidedState, action: GuidedAction): GuidedState {
  switch (action.type) {
    case 'NEXT':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, action.stageCount - 1),
      }
    case 'BACK':
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) }
    case 'GO_TO':
      return { ...state, currentIndex: action.index }
    case 'CONFIRM': {
      const next = new Set(state.confirmed)
      next.add(action.stageId)
      return {
        ...state,
        confirmed: next,
        currentIndex: Math.min(state.currentIndex + 1, action.stageCount - 1),
      }
    }
    case 'UNCONFIRM': {
      const next = new Set(state.confirmed)
      next.delete(action.stageId)
      return { ...state, confirmed: next }
    }
    case 'ELECT_OPTION':
      return { ...state, electedOption: action.option }
    case 'SAVE_START':
      return { ...state, saveStatus: 'saving', saveError: '' }
    case 'SAVE_SUCCESS':
      return { ...state, saveStatus: 'saved', savedCaseId: action.caseId }
    case 'SAVE_ERROR':
      return { ...state, saveStatus: 'error', saveError: action.error }
    case 'TOGGLE_CHECK': {
      const prev = state.checkedItems[action.stageId] ?? new Set<number>()
      const next = new Set(prev)
      if (next.has(action.index)) next.delete(action.index)
      else next.add(action.index)
      return { ...state, checkedItems: { ...state.checkedItems, [action.stageId]: next } }
    }
    case 'TOGGLE_LAYER':
      return { ...state, layers: { ...state.layers, [action.layer]: !state.layers[action.layer] } }
    case 'RESET':
      return initialState
  }
}

const initialState: GuidedState = {
  currentIndex: 0,
  confirmed: new Set(),
  electedOption: '',
  saveStatus: 'idle',
  saveError: '',
  savedCaseId: null,
  checkedItems: {},
  layers: { onboarding: true, rules: false, checklist: true },
}

// ─── Leave payout constant (same as BenefitWorkspace) ────────
const LEAVE_PAYOUTS: Record<string, number> = {
  '10001': 52000, '10002': 0, '10003': 0, '10004': 52000,
}

// ─── Stage component registry ────────────────────────────────
const STAGE_COMPONENTS: Record<string, React.ComponentType<StageProps>> = {
  'member-verify': Stage1MemberVerify,
  'service-credit': Stage2ServiceCredit,
  'eligibility': Stage3Eligibility,
  'benefit-calc': Stage4BenefitCalc,
  'payment-options': Stage5PaymentOptions,
  'supplemental': Stage6Supplemental,
  'dro': Stage7DRO,
  'review-certify': Stage8ReviewCertify,
}

// ─── Main Component ──────────────────────────────────────────

export function GuidedWorkspace({ memberId }: { memberId: string }) {
  const [retirementDate, setRetirementDate] = useState(DEFAULT_RETIREMENT_DATES[memberId] || '')
  const [state, dispatch] = useReducer(reducer, initialState)

  // Data hooks (same as BenefitWorkspace)
  const member = useMember(memberId)
  const serviceCredit = useServiceCredit(memberId)
  const dros = useDROs(memberId)
  const eligibility = useEligibility(memberId, retirementDate)
  const benefit = useBenefitCalculation(memberId, retirementDate)
  const paymentOptions = usePaymentOptions(memberId, retirementDate)
  const hasDRO = !!dros.data && dros.data.length > 0
  const droCalc = useDROCalculation(memberId, retirementDate !== '' && hasDRO)
  const saveElection = useSaveElection()

  // Reset when member changes
  useEffect(() => {
    setRetirementDate(DEFAULT_RETIREMENT_DATES[memberId] || '')
    dispatch({ type: 'RESET' })
  }, [memberId])

  // Default elected option
  useEffect(() => {
    if (paymentOptions.data && !state.electedOption) {
      dispatch({ type: 'ELECT_OPTION', option: hasDRO ? 'j&s_75' : 'maximum' })
    }
  }, [paymentOptions.data, state.electedOption, hasDRO])

  const m = member.data
  const sc = serviceCredit.data
  const elig = eligibility.data
  const ben = benefit.data
  const opts = paymentOptions.data
  const dro = hasDRO ? droCalc.data : undefined
  const leavePayout = LEAVE_PAYOUTS[memberId] || 0

  // Compose stages based on member data
  const stages = composeStages(sc, dros.data)
  const currentStage = stages[state.currentIndex]
  const isLastStage = state.currentIndex === stages.length - 1
  const allConfirmed = stages.every(s => state.confirmed.has(s.id))

  // Checklist gating: all items must be checked before confirm (when checklist layer is on)
  const currentChecked = currentStage ? (state.checkedItems[currentStage.id] ?? new Set<number>()) : new Set<number>()
  const checklistComplete = currentStage
    ? currentChecked.size >= currentStage.checklist.length
    : false
  const canConfirm = currentStage
    ? (state.layers.checklist ? checklistComplete : true) && !state.confirmed.has(currentStage.id)
    : false

  const handleConfirm = useCallback(() => {
    if (!currentStage || !canConfirm) return
    dispatch({ type: 'CONFIRM', stageId: currentStage.id, stageCount: stages.length })
  }, [currentStage, canConfirm, stages.length])

  const handleBack = useCallback(() => {
    dispatch({ type: 'BACK' })
  }, [])

  const handleSave = useCallback(() => {
    if (!ben || !elig) return
    dispatch({ type: 'SAVE_START' })
    const elOpt = opts?.options.find(o => o.option_type === (state.electedOption || (hasDRO ? 'j&s_75' : 'maximum')))
    saveElection.mutate({
      member_id: memberId,
      retirement_date: retirementDate,
      payment_option: elOpt?.option_type ?? 'maximum',
      monthly_benefit: elOpt?.monthly_amount ?? ben.net_monthly_benefit,
      gross_benefit: ben.gross_monthly_benefit,
      reduction_factor: elig.reduction_factor,
      dro_deduction: dro?.alternate_payee_amount,
      ipr_amount: ben.ipr?.monthly_amount,
      death_benefit_amount: ben.death_benefit?.amount,
    }, {
      onSuccess: (result) => dispatch({ type: 'SAVE_SUCCESS', caseId: result.case_id }),
      onError: (err) => dispatch({ type: 'SAVE_ERROR', error: err instanceof Error ? err.message : 'Failed to save' }),
    })
  }, [memberId, retirementDate, ben, elig, state.electedOption, hasDRO, opts, dro, saveElection])

  if (!m) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.textMuted, fontSize: '12px' }}>Loading member data...</div>
      </div>
    )
  }

  const tc = tierMeta[m.tier] || tierMeta[1]
  const age = elig?.age_at_retirement ?? 0

  // Benefit amount for banner — elected option amount, or net benefit, or pending
  const elOpt = opts?.options.find(o => o.option_type === (state.electedOption || (hasDRO ? 'j&s_75' : 'maximum')))
  const bannerBenefit = elOpt?.monthly_amount ?? ben?.net_monthly_benefit ?? 0
  const bannerLabel = dro ? 'After DRO' : 'Monthly Benefit'

  // Build stage props
  const stageProps: StageProps = {
    memberId, member: m, serviceCredit: sc, eligibility: elig,
    benefit: ben, paymentOptions: opts, dros: dros.data,
    droCalc: dro, retirementDate, onRetirementDateChange: setRetirementDate,
    electedOption: state.electedOption || (hasDRO ? 'j&s_75' : 'maximum'),
    onElectOption: (opt: string) => dispatch({ type: 'ELECT_OPTION', option: opt }),
    leavePayout,
  }

  // Render the current stage component
  const StageComponent = currentStage ? STAGE_COMPONENTS[currentStage.id] : null

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
      {/* Member banner with benefit amount */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: `linear-gradient(135deg,${C.surface},${C.elevated})`,
        borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' as const, gap: '6px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '7px', background: tc.muted,
            border: `2px solid ${tc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: tc.color, fontSize: '10px',
          }}>T{m.tier}</div>
          <div>
            <div style={{ color: C.text, fontWeight: 700, fontSize: '13.5px' }}>{m.first_name} {m.last_name}</div>
            <div style={{ color: C.textSecondary, fontSize: '10px' }}>
              {m.member_id} {'\u00B7'} Age {age || '\u2014'} {'\u00B7'} {sc?.total_service_years ?? '\u2014'}y {'\u00B7'} {m.department}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' as const }}>
            {[
              { l: 'Retiring', v: retirementDate.slice(5), c: C.accent },
              { l: tc.label, v: tc.sub, c: tc.color },
              ...(hasDRO ? [{ l: 'DRO', v: 'Active', c: '#A855F7' }] : []),
            ].map(t => (
              <div key={t.l} style={{
                padding: '2px 7px', borderRadius: '4px', background: C.surface,
                border: `1px solid ${C.borderSubtle}`, fontSize: '9.5px',
              }}>
                <span style={{ color: C.textMuted }}>{t.l} </span>
                <span style={{ color: t.c, fontWeight: 600 }}>{t.v}</span>
              </div>
            ))}
          </div>
          {/* Static benefit display — single source of truth */}
          <div style={{
            padding: '4px 12px', borderRadius: '6px', background: C.accentMuted,
            border: `1px solid ${C.accentSolid}`, textAlign: 'right' as const,
          }}>
            <div style={{
              color: C.textMuted, fontSize: '8px', textTransform: 'uppercase' as const,
              letterSpacing: '0.8px',
            }}>{bannerLabel}</div>
            <div style={{
              color: ben ? C.accent : C.textDim, fontWeight: 700,
              fontFamily: "'SF Mono',monospace", fontSize: '15px',
              opacity: ben ? 1 : 0.5,
            }}>
              {ben ? fmt(bannerBenefit) : 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar — single instance */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', background: C.surface,
        borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
          {stages.map((s, i) => (
            <div key={s.id}
              onClick={() => {
                if (state.confirmed.has(s.id) || i <= state.currentIndex) {
                  dispatch({ type: 'GO_TO', index: i })
                }
              }}
              style={{
                flex: 1, height: '4px', borderRadius: '2px',
                background: state.confirmed.has(s.id)
                  ? C.success
                  : i === state.currentIndex
                    ? C.accent
                    : C.border,
                transition: 'background 0.3s',
                boxShadow: i === state.currentIndex ? `0 0 6px ${C.accentGlow}` : 'none',
                cursor: (state.confirmed.has(s.id) || i <= state.currentIndex) ? 'pointer' : 'default',
              }} />
          ))}
        </div>
        <span style={{
          color: allConfirmed ? C.success : C.textMuted,
          fontSize: '10px', fontWeight: 600, flexShrink: 0,
        }}>
          Stage {state.currentIndex + 1} of {stages.length}
        </span>
      </div>

      {/* Stage title bar */}
      {currentStage && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', background: C.elevated,
          borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
        }}>
          <span style={{ fontSize: '14px' }}>{currentStage.icon}</span>
          <span style={{ color: C.text, fontWeight: 600, fontSize: '13px' }}>{currentStage.title}</span>
          <span style={{ color: C.textMuted, fontSize: '11px', marginLeft: '4px' }}>
            {'\u2014'} {currentStage.subtitle}
          </span>
          <div style={{ flex: 1 }} />
          {state.confirmed.has(currentStage.id) && (
            <Badge text="Confirmed" bg={C.successMuted} color={C.success} />
          )}
        </div>
      )}

      {/* Save status banner */}
      {state.saveStatus !== 'idle' && (
        <div style={{
          padding: '6px 14px',
          background: state.saveStatus === 'saved' ? C.successMuted : state.saveStatus === 'error' ? C.dangerMuted : C.accentMuted,
          borderBottom: `1px solid ${state.saveStatus === 'saved' ? C.successBorder : state.saveStatus === 'error' ? C.dangerBorder : C.accentSolid}`,
          fontSize: '11px', fontWeight: 600, flexShrink: 0,
          color: state.saveStatus === 'saved' ? C.success : state.saveStatus === 'error' ? C.danger : C.accent,
        }}>
          {state.saveStatus === 'saving' && 'Saving to database...'}
          {state.saveStatus === 'saved' && `\u2713 Saved successfully \u2014 retirement application submitted. Case #${state.savedCaseId ?? ''} created for review.`}
          {state.saveStatus === 'error' && `\u2717 Save failed: ${state.saveError}`}
        </div>
      )}

      {/* Main content: stage + learning module */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* STAGE CONTENT (scrollable) */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 80px' }}>
          {StageComponent && <StageComponent {...stageProps} />}
        </div>

        {/* LEARNING MODULE */}
        {currentStage && (
          <LearningModule
            stage={currentStage}
            confirmed={state.confirmed}
            checkedItems={currentChecked}
            layers={state.layers}
            canConfirm={canConfirm}
            isLastStage={isLastStage}
            allConfirmed={allConfirmed}
            saveStatus={state.saveStatus}
            onToggleCheck={(index) =>
              dispatch({ type: 'TOGGLE_CHECK', stageId: currentStage.id, index })}
            onToggleLayer={(layer) =>
              dispatch({ type: 'TOGGLE_LAYER', layer })}
            onConfirm={handleConfirm}
            onNext={() => dispatch({ type: 'NEXT', stageCount: stages.length })}
            onUnconfirm={() => dispatch({ type: 'UNCONFIRM', stageId: currentStage.id })}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Bottom navigation — Back only; Confirm moved to Learning Module */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderTop: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <button
          onClick={handleBack}
          disabled={state.currentIndex === 0}
          style={{
            padding: '7px 18px', borderRadius: '6px',
            border: `1px solid ${state.currentIndex === 0 ? C.borderSubtle : C.border}`,
            background: 'transparent',
            color: state.currentIndex === 0 ? C.textDim : C.textSecondary,
            cursor: state.currentIndex === 0 ? 'default' : 'pointer',
            fontSize: '11.5px', fontWeight: 500,
          }}
        >
          {'\u2190'} Back
        </button>
        <div style={{ color: C.textDim, fontSize: '10px' }}>
          Use the Learning Module panel to confirm and advance {'\u2192'}
        </div>
      </div>
    </div>
  )
}

// ─── Learning Module ─────────────────────────────────────────

function LearningModule({ stage, confirmed, checkedItems, layers, canConfirm,
  isLastStage, allConfirmed, saveStatus,
  onToggleCheck, onToggleLayer, onConfirm, onNext, onUnconfirm, onSave }: {
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
}) {
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
