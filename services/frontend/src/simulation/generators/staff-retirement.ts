/**
 * Staff retirement workflow generator — drives GuidedState reducer through 8-9 stages.
 * Supports both guided and expert mode sessions with persona-driven behavior.
 * Consumed by: session-generator.ts
 * Depends on: guided-types.ts (reducer), guided-composition.ts, guided-signals.ts,
 *   guided-autochecks.ts, demo-data fixtures, noise.ts, generator-utils.ts
 */
import { createInitialState, reducer } from '@/pages/staff/guided-types.ts'
import type { GuidedState, GuidedAction } from '@/pages/staff/guided-types.ts'
import { STAGE_HELP } from '@/pages/staff/guided-help.ts'
import { computeAllAutoChecks } from '@/pages/staff/guided-autochecks.ts'
import type { AutoCheckContext } from '@/pages/staff/guided-autochecks.ts'
import { NUDGE_RULES } from '@/nudges/nudge-rules.ts'
import type { TelemetryEvent, PersonaProfile } from '../telemetry-types.ts'
import {
  SessionClock, makeEvent, buildSnapshot, resetEventCounter,
  simulateChecklist,
} from './generator-utils.ts'
import type { EventContext } from './generator-utils.ts'
import { dwellTime, actionDelay, navDelay, chance, shuffle, weightedPick } from '../noise.ts'

// ─── Demo case data (inline to avoid async import of demo-data.ts) ──────────
// We replicate the minimal data needed for signal/autocheck context.
// This avoids pulling in the full demo-data which has Promise-based demoApi.

interface CaseFixture {
  memberId: string
  tier: number
  hireDate: string
  hasPurchasedService: boolean
  hasDRO: boolean
  retirementType: string
  leavePayout: number
  isMarried: boolean
  stageIds: string[]
}

const CASE_FIXTURES: CaseFixture[] = [
  {
    memberId: '10001', tier: 1, hireDate: '1997-06-15',
    hasPurchasedService: false, hasDRO: false, retirementType: 'rule_of_75',
    leavePayout: 52000, isMarried: true,
    stageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'review-certify'],
  },
  {
    memberId: '10002', tier: 2, hireDate: '2008-03-01',
    hasPurchasedService: true, hasDRO: false, retirementType: 'early',
    leavePayout: 0, isMarried: false,
    stageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'review-certify'],
  },
  {
    memberId: '10003', tier: 3, hireDate: '2012-09-01',
    hasPurchasedService: false, hasDRO: false, retirementType: 'early',
    leavePayout: 0, isMarried: true,
    stageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'review-certify'],
  },
  {
    memberId: '10004', tier: 1, hireDate: '1997-06-15',
    hasPurchasedService: false, hasDRO: true, retirementType: 'rule_of_75',
    leavePayout: 52000, isMarried: true,
    stageIds: ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'dro', 'review-certify'],
  },
]

// Checklist item counts per stage (from guided-help.ts STAGE_HELP)
const CHECKLIST_COUNTS: Record<string, number> = {}
for (const s of STAGE_HELP) {
  CHECKLIST_COUNTS[s.id] = s.checklist.length
}

// AutoCheck context builder
function buildAutoCheckCtx(fixture: CaseFixture, electedOption: string): AutoCheckContext {
  return {
    member: {
      member_id: fixture.memberId,
      first_name: 'Sim',
      last_name: 'User',
      date_of_birth: '1963-03-08',
      hire_date: fixture.hireDate,
      tier: fixture.tier,
      status: 'Active',
      department: 'Simulation',
      position: 'Test',
    },
    leavePayout: fixture.leavePayout,
    electedOption,
    retirementDate: '2026-04-01',
  }
}

// ─── Payment option selection ───────────────────────────────────

const PAYMENT_OPTIONS = ['maximum', 'j&s_100', 'j&s_75', 'j&s_50']

function pickPaymentOption(isMarried: boolean, rng: () => number): string {
  if (isMarried) {
    return weightedPick([
      { value: 'j&s_100', weight: 40 },
      { value: 'j&s_75', weight: 25 },
      { value: 'j&s_50', weight: 15 },
      { value: 'maximum', weight: 20 },
    ], rng)
  }
  return weightedPick([
    { value: 'maximum', weight: 70 },
    { value: 'j&s_100', weight: 10 },
    { value: 'j&s_75', weight: 10 },
    { value: 'j&s_50', weight: 10 },
  ], rng)
}

// ─── Main generator ─────────────────────────────────────────────

export interface StaffRetirementOptions {
  sessionId: string
  persona: PersonaProfile
  caseIndex: number
  expertMode: boolean
  rng: () => number
}

export function generateStaffRetirementSession(opts: StaffRetirementOptions): TelemetryEvent[] {
  const { sessionId, persona, caseIndex, expertMode, rng } = opts
  const fixture = CASE_FIXTURES[caseIndex % CASE_FIXTURES.length]
  const events: TelemetryEvent[] = []

  resetEventCounter()

  const clock = new SessionClock(Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000))
  const viewMode = expertMode ? 'expert' : 'guided'

  const ctx: EventContext = {
    session_id: sessionId,
    portal: 'staff',
    workflow: 'retirement',
    member_id: fixture.memberId,
    persona,
    clock,
  }

  // Initialize state
  let state: GuidedState = createInitialState(viewMode)
  const stageIds = [...fixture.stageIds]
  const visited = new Set<string>()
  const confirmed = new Set<string>()
  let electedOption = ''

  // Session start event
  events.push(makeEvent(ctx, 'session_start', {
    case_id: fixture.memberId,
    view_mode: viewMode,
    tier: fixture.tier,
    retirement_type: fixture.retirementType,
    has_dro: fixture.hasDRO,
    has_purchased_service: fixture.hasPurchasedService,
  }, buildSnapshot(null, confirmed, visited, clock, viewMode)))

  // Determine stage traversal order
  let traversalOrder: string[]
  if (expertMode) {
    // Experts may skip around: shuffle non-first and non-last stages
    const middle = stageIds.slice(1, -1)
    if (chance(1 - persona.linearity, rng)) {
      traversalOrder = [stageIds[0], ...shuffle(middle, rng), stageIds[stageIds.length - 1]]
    } else {
      traversalOrder = [...stageIds]
    }

    // Expert mode switch event
    clock.advance(navDelay(rng))
    events.push(makeEvent(ctx, 'expert_mode_switch', {
      from: 'guided', to: 'expert',
    }, buildSnapshot(null, confirmed, visited, clock, 'expert')))
  } else {
    // Guided mode: mostly linear, occasional out-of-order for intermediates
    if (persona.experience !== 'novice' && chance(1 - persona.linearity, rng)) {
      const middle = stageIds.slice(1, -1)
      // Swap 1-2 adjacent stages
      const swapIdx = Math.floor(rng() * (middle.length - 1))
      const tmp = middle[swapIdx]
      middle[swapIdx] = middle[swapIdx + 1]
      middle[swapIdx + 1] = tmp
      traversalOrder = [stageIds[0], ...middle, stageIds[stageIds.length - 1]]
    } else {
      traversalOrder = [...stageIds]
    }
  }

  // Process each stage
  for (let stageStep = 0; stageStep < traversalOrder.length; stageStep++) {
    const stageId = traversalOrder[stageStep]
    clock.resetStageTimer()

    // Stage enter
    visited.add(stageId)
    const stageIndex = stageIds.indexOf(stageId)
    const action: GuidedAction = { type: 'GO_TO', index: stageIndex }
    state = reducer(state, action)
    state = reducer(state, { type: 'VISIT_STAGE', stageId })

    clock.advance(navDelay(rng))
    events.push(makeEvent(ctx, 'stage_enter', {
      stage_id: stageId,
      stage_index: stageIndex,
      in_order: stageStep === stageIndex,
    }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))

    if (expertMode) {
      // Expand stage in expert mode
      state = reducer(state, { type: 'SELECT_EXPERT_STAGE', stageId })
      clock.advance(actionDelay(rng))
      events.push(makeEvent(ctx, 'expert_stage_expand', {
        stage_id: stageId,
      }, buildSnapshot(stageId, confirmed, visited, clock, 'expert')))
    }

    // Data load event (simulate loading stage-specific data)
    clock.advance(actionDelay(rng))
    events.push(makeEvent(ctx, 'data_load', {
      stage_id: stageId,
    }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))

    // Learning module interactions (novice/intermediate only in guided mode)
    if (!expertMode && chance(persona.learning_module_usage, rng)) {
      // Toggle a layer
      const layers = ['onboarding', 'rules', 'checklist'] as const
      const layerIdx = Math.floor(rng() * layers.length)
      const layer = layers[layerIdx]
      state = reducer(state, { type: 'TOGGLE_LAYER', layer })
      clock.advance(actionDelay(rng))
      events.push(makeEvent(ctx, 'layer_toggle', {
        stage_id: stageId, layer, on: state.layers[layer],
      }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))

      // Dwell on learning content
      if (layer === 'rules') {
        clock.advance(dwellTime(persona.speed_factor * 0.5, rng))
        events.push(makeEvent(ctx, 'rules_view', {
          stage_id: stageId, duration_ms: clock.stageElapsed(),
        }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
      } else if (layer === 'onboarding') {
        clock.advance(dwellTime(persona.speed_factor * 0.7, rng))
        events.push(makeEvent(ctx, 'onboarding_view', {
          stage_id: stageId, duration_ms: clock.stageElapsed(),
        }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
      }
    }

    // Stage-specific interactions
    if (stageId === 'payment-options') {
      // Elect a payment option
      electedOption = pickPaymentOption(fixture.isMarried, rng)
      state = reducer(state, { type: 'ELECT_OPTION', option: electedOption })
      clock.advance(dwellTime(persona.speed_factor * 0.8, rng))
      events.push(makeEvent(ctx, 'option_elect', {
        stage_id: stageId, option: electedOption,
      }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))

      // Inspect other options
      if (chance(persona.thoroughness, rng)) {
        for (const opt of PAYMENT_OPTIONS.filter(o => o !== electedOption).slice(0, 2)) {
          clock.advance(actionDelay(rng))
          events.push(makeEvent(ctx, 'data_inspect', {
            stage_id: stageId, inspected: opt,
          }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
        }
      }
    }

    // Checklist interaction
    const checklistCount = CHECKLIST_COUNTS[stageId] ?? 0
    if (checklistCount > 0 && state.layers.checklist) {
      const autoCheckCtx = buildAutoCheckCtx(fixture, electedOption)
      const autoChecks = computeAllAutoChecks([stageId], autoCheckCtx)
      const stageAutoChecks = autoChecks[stageId] ?? new Set<number>()

      const checkEvents = simulateChecklist(
        ctx, stageId, checklistCount, stageAutoChecks,
        confirmed, visited, rng, actionDelay,
      )
      events.push(...checkEvents)
    }

    // Dwell time for reviewing the stage content
    clock.advance(dwellTime(persona.speed_factor, rng))

    // Nudge check (idle on complex stages)
    for (const rule of NUDGE_RULES) {
      if (rule.trigger.type === 'idle' && rule.trigger.stageId === stageId) {
        if (clock.stageElapsed() > rule.trigger.delayMs) {
          events.push(makeEvent(ctx, 'nudge_fire', {
            nudge_id: rule.id, stage_id: stageId, message: rule.message,
          }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))

          // Persona may act on the nudge
          if (chance(0.4, rng)) {
            clock.advance(actionDelay(rng))
            events.push(makeEvent(ctx, 'nudge_act', {
              nudge_id: rule.id,
            }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
          } else {
            clock.advance(actionDelay(rng))
            events.push(makeEvent(ctx, 'nudge_dismiss', {
              nudge_id: rule.id,
            }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
          }
        }
      }
      // Out-of-order nudge check
      if (rule.trigger.type === 'out-of-order') {
        if (confirmed.has(rule.trigger.confirmedBefore) && !visited.has(rule.trigger.notVisited)) {
          events.push(makeEvent(ctx, 'nudge_fire', {
            nudge_id: rule.id, stage_id: stageId, message: rule.message,
          }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
        }
      }
    }

    // Error/backtrack simulation
    if (stageId !== 'review-certify' && chance(persona.error_rate, rng)) {
      // Unconfirm a previously confirmed stage
      const confirmedArr = [...confirmed]
      if (confirmedArr.length > 0) {
        const unconfirmStage = confirmedArr[Math.floor(rng() * confirmedArr.length)]
        confirmed.delete(unconfirmStage)
        state = reducer(state, { type: 'UNCONFIRM', stageId: unconfirmStage })
        clock.advance(actionDelay(rng))
        events.push(makeEvent(ctx, 'stage_unconfirm', {
          stage_id: unconfirmStage, reason: 'backtrack',
        }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
      }
    }

    // Confirm the stage
    confirmed.add(stageId)
    if (expertMode) {
      state = reducer(state, {
        type: 'CONFIRM_AND_ROUTE',
        stageId,
        stageCount: stageIds.length,
        allStageIds: stageIds,
      })
    } else {
      state = reducer(state, { type: 'CONFIRM', stageId, stageCount: stageIds.length })
    }

    clock.advance(actionDelay(rng))
    events.push(makeEvent(ctx, 'stage_confirm', {
      stage_id: stageId,
      stage_index: stageIndex,
      checklist_completion: persona.thoroughness,
    }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))

    // Stage exit
    events.push(makeEvent(ctx, 'stage_exit', {
      stage_id: stageId,
      dwell_ms: clock.stageElapsed(),
    }, buildSnapshot(stageId, confirmed, visited, clock, viewMode)))
  }

  // Save and complete
  state = reducer(state, { type: 'SAVE_START' })
  clock.advance(actionDelay(rng))
  events.push(makeEvent(ctx, 'save_start', {}, buildSnapshot('review-certify', confirmed, visited, clock, viewMode)))

  state = reducer(state, { type: 'SAVE_SUCCESS', caseId: 99000 + caseIndex })
  clock.advance(1000 + Math.floor(rng() * 2000))
  events.push(makeEvent(ctx, 'save_complete', {
    case_id: 99000 + caseIndex,
  }, buildSnapshot('review-certify', confirmed, visited, clock, viewMode)))

  // Session complete
  events.push(makeEvent(ctx, 'session_complete', {
    total_stages: stageIds.length,
    confirmed_stages: confirmed.size,
    duration_ms: clock.elapsed(),
    view_mode: viewMode,
  }, buildSnapshot(null, confirmed, visited, clock, viewMode)))

  return events
}
