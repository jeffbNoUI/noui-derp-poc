/**
 * State types, reducer, and initial state for the guided workspace.
 * Extracted from GuidedWorkspace.tsx to share with LearningModule and ExpertMode.
 * Consumed by: GuidedWorkspace, LearningModule, ExpertMode
 * Depends on: Nothing (pure state logic)
 */

// ─── Layer visibility ─────────────────────────────────────────

export interface LayerState {
  onboarding: boolean
  rules: boolean
  checklist: boolean
}

// ─── Analyst inputs (F-4) ─────────────────────────────────────

export interface AnalystInputs {
  beneficiaryName: string
  deathBenefitInstallments: 50 | 100
  spousalConsentObtained: boolean
}

// ─── Main state ───────────────────────────────────────────────

export interface GuidedState {
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
  /** Analyst-entered fields from the application (F-4) */
  analystInputs: AnalystInputs
  /** View mode: guided (sequential) or expert (all stages visible) (F-6) */
  viewMode: 'guided' | 'expert'
  /** Expanded stage IDs in expert mode */
  expandedStages: Set<string>
  /** Stages manually expanded from summary to full by the user (F-1) */
  manuallyExpanded: Set<string>
}

// ─── Actions ──────────────────────────────────────────────────

export type GuidedAction =
  | { type: 'NEXT'; stageCount: number }
  | { type: 'BACK' }
  | { type: 'GO_TO'; index: number }
  | { type: 'CONFIRM'; stageId: string; stageCount: number; allStageIds?: string[] }
  | { type: 'UNCONFIRM'; stageId: string }
  | { type: 'ELECT_OPTION'; option: string }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; caseId: number }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'TOGGLE_CHECK'; stageId: string; index: number }
  | { type: 'TOGGLE_LAYER'; layer: keyof LayerState }
  | { type: 'UPDATE_ANALYST_INPUT'; field: keyof AnalystInputs; value: string | number | boolean }
  | { type: 'TOGGLE_VIEW_MODE' }
  | { type: 'TOGGLE_EXPAND'; stageId: string }
  | { type: 'EXPAND_STAGE'; stageId: string }
  | { type: 'RESET' }

// ─── Initial state ────────────────────────────────────────────

export const initialState: GuidedState = {
  currentIndex: 0,
  confirmed: new Set(),
  electedOption: '',
  saveStatus: 'idle',
  saveError: '',
  savedCaseId: null,
  checkedItems: {},
  layers: { onboarding: true, rules: false, checklist: true },
  analystInputs: {
    beneficiaryName: '',
    deathBenefitInstallments: 50,
    spousalConsentObtained: false,
  },
  viewMode: 'guided',
  expandedStages: new Set(),
  manuallyExpanded: new Set(),
}

// ─── Reducer ──────────────────────────────────────────────────

export function reducer(state: GuidedState, action: GuidedAction): GuidedState {
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
      // Expert mode: collapse confirmed stage, expand next unconfirmed
      let expandedStages = state.expandedStages
      if (state.viewMode === 'expert' && action.allStageIds) {
        expandedStages = new Set(expandedStages)
        expandedStages.delete(action.stageId)
        const nextUnconfirmed = action.allStageIds.find(id => !next.has(id))
        if (nextUnconfirmed) expandedStages.add(nextUnconfirmed)
      }
      return {
        ...state,
        confirmed: next,
        expandedStages,
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
    case 'UPDATE_ANALYST_INPUT':
      return {
        ...state,
        analystInputs: { ...state.analystInputs, [action.field]: action.value },
      }
    case 'TOGGLE_VIEW_MODE':
      return { ...state, viewMode: state.viewMode === 'guided' ? 'expert' : 'guided' }
    case 'TOGGLE_EXPAND': {
      const next = new Set(state.expandedStages)
      if (next.has(action.stageId)) next.delete(action.stageId)
      else next.add(action.stageId)
      return { ...state, expandedStages: next }
    }
    case 'EXPAND_STAGE': {
      // Mark a summary stage as manually expanded — stays full for the session
      const next = new Set(state.manuallyExpanded)
      next.add(action.stageId)
      return { ...state, manuallyExpanded: next }
    }
    case 'RESET':
      return initialState
  }
}
