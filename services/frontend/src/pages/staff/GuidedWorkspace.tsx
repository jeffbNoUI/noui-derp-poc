/**
 * Guided mode workspace — sequential stage-by-stage retirement application processing.
 * Contextual help panel, rule citations, verification checklists, and next-action prompts.
 * Analysts cannot skip ahead until the current stage is confirmed.
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

interface GuidedState {
  currentIndex: number
  confirmed: Set<string>
  electedOption: string
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  saveError: string
  savedCaseId: number | null
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
      // Auto-advance to next stage after confirm
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
  const canAdvance = currentStage ? state.confirmed.has(currentStage.id) : false
  const isLastStage = state.currentIndex === stages.length - 1
  const allConfirmed = stages.every(s => state.confirmed.has(s.id))

  const handleConfirm = useCallback(() => {
    if (!currentStage) return
    dispatch({ type: 'CONFIRM', stageId: currentStage.id, stageCount: stages.length })
  }, [currentStage, stages.length])

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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
      {/* Member banner */}
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
      </div>

      {/* Progress bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 14px', background: C.surface,
        borderBottom: `1px solid ${C.borderSubtle}`, flexShrink: 0,
      }}>
        <div style={{ flex: 1, display: 'flex', gap: '3px' }}>
          {stages.map((s, i) => (
            <div key={s.id}
              onClick={() => {
                // Allow clicking to confirmed stages or the next unconfirmed stage
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

      {/* Main content: stage + help panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* STAGE CONTENT (scrollable) */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 80px' }}>
          {StageComponent && <StageComponent {...stageProps} />}
        </div>

        {/* CONTEXTUAL HELP PANEL */}
        {currentStage && (
          <HelpPanel
            stage={currentStage}
            confirmed={state.confirmed}
            stageCount={stages.length}
            currentIndex={state.currentIndex}
            benefit={ben}
            dro={dro}
            electedOption={state.electedOption || (hasDRO ? 'j&s_75' : 'maximum')}
            paymentOptions={opts}
          />
        )}
      </div>

      {/* Bottom navigation */}
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

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Confirm button (when current stage not yet confirmed) */}
          {currentStage && !state.confirmed.has(currentStage.id) && (
            <button
              onClick={handleConfirm}
              style={{
                padding: '7px 22px', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.accent},#06B6D4)`,
                color: C.bg, fontWeight: 700, cursor: 'pointer', fontSize: '11.5px',
                boxShadow: `0 2px 8px ${C.accentGlow}`,
              }}
            >
              Confirm {'\u0026'} Continue {'\u2192'}
            </button>
          )}

          {/* Next button (when already confirmed, not last) */}
          {currentStage && state.confirmed.has(currentStage.id) && !isLastStage && (
            <button
              onClick={() => dispatch({ type: 'NEXT', stageCount: stages.length })}
              style={{
                padding: '7px 22px', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.accent},#06B6D4)`,
                color: C.bg, fontWeight: 700, cursor: 'pointer', fontSize: '11.5px',
                boxShadow: `0 2px 8px ${C.accentGlow}`,
              }}
            >
              Next Stage {'\u2192'}
            </button>
          )}

          {/* Undo confirm */}
          {currentStage && state.confirmed.has(currentStage.id) && (
            <button
              onClick={() => dispatch({ type: 'UNCONFIRM', stageId: currentStage.id })}
              style={{
                padding: '7px 14px', borderRadius: '6px',
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.textMuted, cursor: 'pointer', fontSize: '10.5px',
              }}
            >
              Edit
            </button>
          )}

          {/* Submit button (last stage, all confirmed) */}
          {isLastStage && allConfirmed && state.saveStatus === 'idle' && (
            <button
              onClick={handleSave}
              style={{
                padding: '7px 22px', borderRadius: '6px', border: 'none',
                background: `linear-gradient(135deg,${C.success},#059669)`,
                color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '11.5px',
                boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
              }}
            >
              Save {'\u0026'} Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Help Panel ──────────────────────────────────────────────

function HelpPanel({ stage, confirmed, stageCount, currentIndex, benefit, dro, electedOption, paymentOptions }: {
  stage: StageHelp
  confirmed: Set<string>
  stageCount: number
  currentIndex: number
  benefit?: import('@/types/Member').BenefitResult
  dro?: import('@/types/Member').DROResult
  electedOption: string
  paymentOptions?: import('@/types/Member').PaymentOptionsResult
}) {
  const elOpt = paymentOptions?.options.find(o => o.option_type === electedOption)
  const finalMonthly = elOpt?.monthly_amount ?? benefit?.net_monthly_benefit ?? 0

  return (
    <div style={{
      width: '260px', borderLeft: `1px solid ${C.border}`, flexShrink: 0,
      background: C.surface, display: 'flex', flexDirection: 'column' as const,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          color: C.textDim, fontSize: '9px', textTransform: 'uppercase' as const,
          letterSpacing: '1.5px', fontWeight: 600,
        }}>Contextual Help</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 12px' }}>
        {/* What this stage is about */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
            letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
          }}>What This Stage Is About</div>
          <div style={{ color: C.textSecondary, fontSize: '11px', lineHeight: '1.5' }}>
            {stage.helpText}
          </div>
        </div>

        {/* Key rules */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
            letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
          }}>Key Rules</div>
          {stage.keyRules.map(rule => (
            <div key={rule.ruleId} style={{
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

        {/* Verification checklist */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const,
            letterSpacing: '1px', fontWeight: 600, marginBottom: '4px',
          }}>Verify</div>
          {stage.whatToVerify.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '3px 0' }}>
              <span style={{
                color: confirmed.has(stage.id) ? C.success : C.textDim,
                fontSize: '11px', flexShrink: 0,
              }}>
                {confirmed.has(stage.id) ? '\u2611' : '\u2610'}
              </span>
              <span style={{ color: C.textSecondary, fontSize: '10.5px', lineHeight: '1.4' }}>{item}</span>
            </div>
          ))}
        </div>

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

      {/* Summary footer */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${C.borderSubtle}` }}>
        <div style={{
          textAlign: 'center' as const, padding: '8px', background: C.accentMuted,
          borderRadius: '6px', border: `1px solid ${C.accentSolid}`, marginBottom: '6px',
        }}>
          <div style={{ color: C.textMuted, fontSize: '8px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>
            {dro ? 'Benefit (after DRO)' : 'Benefit'}
          </div>
          <div style={{
            color: benefit ? C.accent : C.textDim, fontSize: '18px', fontWeight: 700,
            fontFamily: 'monospace', marginTop: '2px',
            opacity: benefit ? 1 : 0.5,
          }}>
            {fmt(finalMonthly)}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: C.textMuted, fontSize: '10px' }}>Progress</span>
          <span style={{
            color: confirmed.size === stageCount ? C.success : C.textMuted,
            fontSize: '10px', fontWeight: 600,
          }}>
            {confirmed.size} / {stageCount}
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '2px', background: C.border, overflow: 'hidden', marginTop: '4px' }}>
          <div style={{
            width: `${(confirmed.size / stageCount) * 100}%`,
            height: '100%', borderRadius: '2px',
            background: confirmed.size === stageCount
              ? C.success
              : `linear-gradient(90deg,${C.accent},#06B6D4)`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>
    </div>
  )
}
