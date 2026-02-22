/**
 * Guided mode workspace — sequential stage-by-stage retirement application processing.
 * Learning Module with three toggleable layers (onboarding, rules, checklist), interactive
 * verification checklists that gate stage confirmation, and a static benefit display in
 * the member banner. Supports guided (sequential) and expert (all-stages) view modes.
 * Consumed by: StaffCaseView (via /staff/case/:memberId/guided route)
 * Depends on: all data hooks, demo data, theme (C, tierMeta, fmt), Badge,
 *   guided-types.ts, guided-signals.ts, guided-help.ts, guided-composition.ts,
 *   LearningModule, ProgressBar, CaseStatusBar, ExpertMode, stage components
 */
import { useState, useCallback, useEffect, useReducer } from 'react'
import { useMember, useServiceCredit, useDROs, useApplicationIntake } from '@/hooks/useMember'
import {
  useEligibility, useBenefitCalculation, usePaymentOptions,
  useDROCalculation, useSaveElection,
} from '@/hooks/useCalculations'
import { C, tierMeta, fmt } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DEFAULT_RETIREMENT_DATES } from '@/lib/constants'
import { composeStages } from './guided-composition'
import { computeAllSignals } from './guided-signals'
import { computeStageDepth } from './guided-depth'
import { reducer, initialState } from './guided-types'
import type { StageProps } from './stages/StageProps'
import { LearningModule } from './LearningModule'
import { ProgressBar } from './ProgressBar'
import { CaseStatusBar } from './CaseStatusBar'
import { ExpertMode } from './ExpertMode'
import { StageSummary } from './StageSummary'
import {
  Stage0ApplicationIntake, Stage1MemberVerify, Stage2ServiceCredit, Stage3Eligibility,
  Stage4BenefitCalc, Stage5PaymentOptions, Stage6Supplemental,
  Stage7DRO, Stage8ReviewCertify,
} from './stages'

// ─── Leave payout constant (same as BenefitWorkspace) ────────
const LEAVE_PAYOUTS: Record<string, number> = {
  '10001': 52000, '10002': 0, '10003': 0, '10004': 52000,
}

// ─── Stage component registry ────────────────────────────────
const STAGE_COMPONENTS: Record<string, React.ComponentType<StageProps>> = {
  'application-intake': Stage0ApplicationIntake,
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
  const intake = useApplicationIntake(memberId)
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

  // Compute confidence signals for all stages (F-5)
  const signals = computeAllSignals(
    stages.map(s => s.id),
    {
      intake: intake.data,
      serviceCredit: sc,
      eligibility: elig,
      benefit: ben,
      electedOption: state.electedOption || (hasDRO ? 'j&s_75' : 'maximum'),
      leavePayout,
      confirmed: state.confirmed,
      stageCount: stages.length,
    },
  )

  // Compute card depths for all stages (F-1 adaptive depth)
  const depths = Object.fromEntries(
    stages.map(s => {
      // Manually expanded stages always show full
      if (state.manuallyExpanded.has(s.id)) return [s.id, 'full' as const]
      return [s.id, computeStageDepth(s.id, signals[s.id])]
    })
  )
  const currentDepth = currentStage ? depths[currentStage.id] : 'full'

  // Checklist gating: all items must be checked before confirm (when checklist layer is on)
  // Summary-depth stages bypass checklist gating — green signal means pre-verified
  const currentChecked = currentStage ? (state.checkedItems[currentStage.id] ?? new Set<number>()) : new Set<number>()
  const checklistComplete = currentStage
    ? currentChecked.size >= currentStage.checklist.length
    : false
  const isSummaryStage = currentDepth === 'summary'
  const canConfirm = currentStage
    ? (isSummaryStage || (state.layers.checklist ? checklistComplete : true)) && !state.confirmed.has(currentStage.id)
    : false

  const handleConfirm = useCallback(() => {
    if (!currentStage || !canConfirm) return
    dispatch({ type: 'CONFIRM', stageId: currentStage.id, stageCount: stages.length })
  }, [currentStage, canConfirm, stages.length])

  const handleBack = useCallback(() => {
    dispatch({ type: 'BACK' })
  }, [])

  // Confirm handler for expert mode (by stageId)
  const handleConfirmStage = useCallback((stageId: string) => {
    dispatch({ type: 'CONFIRM', stageId, stageCount: stages.length })
  }, [stages.length])

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

  // Case-level status — derived from confirmation progress and save state
  const confirmedCount = stages.filter(s => state.confirmed.has(s.id)).length
  const caseStatus = state.saveStatus === 'saved'
    ? { label: 'Submitted', color: C.success }
    : state.saveStatus === 'error'
      ? { label: 'Error', color: C.danger }
      : allConfirmed
        ? { label: 'Ready', color: '#F59E0B' }
        : confirmedCount > 0
          ? { label: `${confirmedCount}/${stages.length}`, color: C.accent }
          : null

  // Benefit amount for banner — elected option amount, or net benefit, or pending
  const elOpt = opts?.options.find(o => o.option_type === (state.electedOption || (hasDRO ? 'j&s_75' : 'maximum')))
  const bannerBenefit = elOpt?.monthly_amount ?? ben?.net_monthly_benefit ?? 0
  const bannerLabel = dro ? 'After DRO' : 'Monthly Benefit'

  // Build stage props
  const stageProps: StageProps = {
    memberId, member: m, serviceCredit: sc, eligibility: elig,
    benefit: ben, paymentOptions: opts, dros: dros.data,
    droCalc: dro, applicationIntake: intake.data,
    retirementDate, onRetirementDateChange: setRetirementDate,
    electedOption: state.electedOption || (hasDRO ? 'j&s_75' : 'maximum'),
    onElectOption: (opt: string) => dispatch({ type: 'ELECT_OPTION', option: opt }),
    leavePayout,
    analystInputs: state.analystInputs,
    onUpdateAnalystInput: (field, value) =>
      dispatch({ type: 'UPDATE_ANALYST_INPUT', field, value }),
  }

  // Render the current stage component
  const StageComponent = currentStage ? STAGE_COMPONENTS[currentStage.id] : null

  // Focused stage for expert mode LearningModule sync
  const focusedStageId = state.viewMode === 'expert'
    ? Array.from(state.expandedStages).pop() ?? stages[0]?.id
    : currentStage?.id
  const focusedStage = stages.find(s => s.id === focusedStageId) ?? currentStage

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
              ...(caseStatus ? [{ l: 'Case', v: caseStatus.label, c: caseStatus.color }] : []),
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

      {/* Case status bar (F-7) */}
      <CaseStatusBar intake={intake.data} />

      {/* Progress bar with confidence signals and mode toggle */}
      <ProgressBar
        stages={stages}
        currentIndex={state.currentIndex}
        confirmed={state.confirmed}
        signals={signals}
        allConfirmed={allConfirmed}
        mode={state.viewMode}
        onGoTo={(i) => dispatch({ type: 'GO_TO', index: i })}
        onToggleMode={() => dispatch({ type: 'TOGGLE_VIEW_MODE' })}
      />

      {/* Stage title bar — guided mode only */}
      {state.viewMode === 'guided' && currentStage && (
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

        {state.viewMode === 'guided' ? (
          /* GUIDED MODE — single stage content, summary or full based on depth (F-1) */
          <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 80px' }}>
            {currentStage && currentDepth === 'summary' && currentStage.summaryFields ? (
              <StageSummary
                summaryFields={currentStage.summaryFields}
                signal={signals[currentStage.id]}
                stageProps={stageProps}
                onExpand={() => dispatch({ type: 'EXPAND_STAGE', stageId: currentStage.id })}
              />
            ) : (
              StageComponent && <StageComponent {...stageProps} />
            )}
          </div>
        ) : (
          /* EXPERT MODE — all stages as collapsible cards */
          <ExpertMode
            stages={stages}
            stageComponents={STAGE_COMPONENTS}
            stageProps={stageProps}
            signals={signals}
            depths={depths}
            confirmed={state.confirmed}
            expandedStages={state.expandedStages}
            checkedItems={state.checkedItems}
            layers={state.layers}
            onToggleExpand={(id) => dispatch({ type: 'TOGGLE_EXPAND', stageId: id })}
            onExpandStage={(id) => dispatch({ type: 'EXPAND_STAGE', stageId: id })}
            onConfirm={handleConfirmStage}
            onUnconfirm={(id) => dispatch({ type: 'UNCONFIRM', stageId: id })}
            onToggleCheck={(stageId, index) => dispatch({ type: 'TOGGLE_CHECK', stageId, index })}
          />
        )}

        {/* LEARNING MODULE — syncs to current/focused stage */}
        {focusedStage && (
          <LearningModule
            stage={focusedStage}
            confirmed={state.confirmed}
            checkedItems={state.checkedItems[focusedStage.id] ?? new Set<number>()}
            layers={state.layers}
            canConfirm={
              state.viewMode === 'guided'
                ? canConfirm
                : (depths[focusedStage.id] === 'summary'
                    || (state.layers.checklist
                      ? (state.checkedItems[focusedStage.id]?.size ?? 0) >= focusedStage.checklist.length
                      : true)) && !state.confirmed.has(focusedStage.id)
            }
            isLastStage={state.viewMode === 'guided' ? isLastStage : focusedStage.id === stages[stages.length - 1]?.id}
            allConfirmed={allConfirmed}
            saveStatus={state.saveStatus}
            onToggleCheck={(index) =>
              dispatch({ type: 'TOGGLE_CHECK', stageId: focusedStage.id, index })}
            onToggleLayer={(layer) =>
              dispatch({ type: 'TOGGLE_LAYER', layer })}
            onConfirm={state.viewMode === 'guided'
              ? handleConfirm
              : () => handleConfirmStage(focusedStage.id)}
            onNext={() => dispatch({ type: 'NEXT', stageCount: stages.length })}
            onUnconfirm={() => dispatch({ type: 'UNCONFIRM', stageId: focusedStage.id })}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Bottom navigation — guided mode only */}
      {state.viewMode === 'guided' && (
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
      )}
    </div>
  )
}
