/**
 * Wizard state machine tests — validates draft reducer transitions and
 * canContinue validation logic for the 7-step application wizard.
 * These tests verify state management independent of React rendering.
 */
import { describe, it, expect } from 'vitest'
import { INITIAL_DRAFT, type ApplicationDraft } from '@/types/Portal'

// ─── Replicate reducer logic from ApplicationWizard for unit testing ─────
// (Extracted here to test independently of React component)

type DraftAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'UPDATE'; payload: Partial<ApplicationDraft> }

function draftReducer(state: ApplicationDraft, action: DraftAction): ApplicationDraft {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step }
    case 'UPDATE': return { ...state, ...action.payload }
    default: return state
  }
}

/** Per-step validation — mirrors canContinue() in ApplicationWizard */
function canContinue(draft: ApplicationDraft): boolean {
  const step = draft.step
  if (step === 0) return draft.personal_confirmed
  if (step === 3) return draft.payment_option !== ''
  if (step === 4) return draft.death_benefit_election !== ''
  if (step === 6) return draft.ack_irrevocable && draft.ack_notarize && draft.ack_reemployment
  return true // Steps 1, 2, 5 have no gate
}

describe('Wizard Draft Reducer', () => {
  it('initializes with INITIAL_DRAFT defaults', () => {
    expect(INITIAL_DRAFT.step).toBe(0)
    expect(INITIAL_DRAFT.personal_confirmed).toBe(false)
    expect(INITIAL_DRAFT.payment_option).toBe('')
    expect(INITIAL_DRAFT.death_benefit_election).toBe('')
    expect(INITIAL_DRAFT.ack_irrevocable).toBe(false)
    expect(INITIAL_DRAFT.ack_notarize).toBe(false)
    expect(INITIAL_DRAFT.ack_reemployment).toBe(false)
  })

  it('SET_STEP advances to the specified step', () => {
    const state = draftReducer(INITIAL_DRAFT, { type: 'SET_STEP', step: 3 })
    expect(state.step).toBe(3)
  })

  it('SET_STEP preserves other draft fields', () => {
    const modified = { ...INITIAL_DRAFT, personal_confirmed: true, payment_option: 'maximum' as const }
    const state = draftReducer(modified, { type: 'SET_STEP', step: 5 })
    expect(state.step).toBe(5)
    expect(state.personal_confirmed).toBe(true)
    expect(state.payment_option).toBe('maximum')
  })

  it('UPDATE merges partial payload', () => {
    const state = draftReducer(INITIAL_DRAFT, { type: 'UPDATE', payload: { personal_confirmed: true } })
    expect(state.personal_confirmed).toBe(true)
    expect(state.step).toBe(0) // unchanged
  })

  it('UPDATE can set multiple fields at once', () => {
    const state = draftReducer(INITIAL_DRAFT, {
      type: 'UPDATE',
      payload: { payment_option: 'j&s_75', death_benefit_election: 'DRAW_50' },
    })
    expect(state.payment_option).toBe('j&s_75')
    expect(state.death_benefit_election).toBe('DRAW_50')
  })
})

describe('Wizard canContinue Validation', () => {
  describe('Step 0 — Personal Info', () => {
    it('blocks when personal_confirmed is false', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 0 })).toBe(false)
    })

    it('allows when personal_confirmed is true', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 0, personal_confirmed: true })).toBe(true)
    })
  })

  describe('Steps 1, 2 — no gate (always continue)', () => {
    it('step 1 always allows continue', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 1 })).toBe(true)
    })

    it('step 2 always allows continue', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 2 })).toBe(true)
    })
  })

  describe('Step 3 — Payment Option', () => {
    it('blocks when no payment option selected', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 3 })).toBe(false)
    })

    it('allows when payment option is selected', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 3, payment_option: 'maximum' })).toBe(true)
    })
  })

  describe('Step 4 — Death Benefit', () => {
    it('blocks when no death benefit election', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 4 })).toBe(false)
    })

    it('allows with DRAW_50 election', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 4, death_benefit_election: 'DRAW_50' })).toBe(true)
    })

    it('allows with DRAW_100 election', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 4, death_benefit_election: 'DRAW_100' })).toBe(true)
    })

    it('allows with NO_DRAW election', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 4, death_benefit_election: 'NO_DRAW' })).toBe(true)
    })
  })

  describe('Step 5 — Insurance (no gate)', () => {
    it('always allows continue', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 5 })).toBe(true)
    })
  })

  describe('Step 6 — Review & Submit', () => {
    it('blocks when no acknowledgments checked', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 6 })).toBe(false)
    })

    it('blocks with only partial acknowledgments', () => {
      expect(canContinue({ ...INITIAL_DRAFT, step: 6, ack_irrevocable: true, ack_notarize: true })).toBe(false)
      expect(canContinue({ ...INITIAL_DRAFT, step: 6, ack_irrevocable: true, ack_reemployment: true })).toBe(false)
    })

    it('allows when all 3 acknowledgments checked', () => {
      expect(canContinue({
        ...INITIAL_DRAFT, step: 6,
        ack_irrevocable: true, ack_notarize: true, ack_reemployment: true,
      })).toBe(true)
    })
  })
})
