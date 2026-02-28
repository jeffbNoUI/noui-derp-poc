/**
 * Member portal wizard generator — drives ApplicationDraft through 7 steps.
 * Simulates completion funnel with abandonment at each step.
 * Consumed by: session-generator.ts
 * Depends on: Portal.ts (INITIAL_DRAFT, ApplicationDraft), telemetry-types.ts, noise.ts
 */
import type { ApplicationDraft } from '@/types/Portal.ts'
import { INITIAL_DRAFT } from '@/types/Portal.ts'
import type { TelemetryEvent, PersonaProfile } from '../telemetry-types.ts'
import {
  SessionClock, makeEvent, buildSnapshot, resetEventCounter,
} from './generator-utils.ts'
import type { EventContext } from './generator-utils.ts'
import { dwellTime, actionDelay, navDelay, chance, weightedPick } from '../noise.ts'

const WIZARD_STEPS = [
  'personal-info',
  'retirement-date',
  'benefit-estimate',
  'payment-option',
  'death-benefit',
  'insurance-tax',
  'review-submit',
]

// Abandonment probabilities by step (higher at complex steps)
const ABANDON_RATES: Record<string, number> = {
  'personal-info': 0.02,
  'retirement-date': 0.03,
  'benefit-estimate': 0.05,
  'payment-option': 0.08,
  'death-benefit': 0.04,
  'insurance-tax': 0.06,
  'review-submit': 0.02,
}

interface WizardCaseFixture {
  memberId: string
  tier: number
  retirementDate: string
}

const WIZARD_CASES: WizardCaseFixture[] = [
  { memberId: '10001', tier: 1, retirementDate: '2026-04-01' },
  { memberId: '10003', tier: 3, retirementDate: '2026-04-01' },
]

export interface MemberWizardOptions {
  sessionId: string
  persona: PersonaProfile
  caseIndex: number
  forceAbandon: boolean
  rng: () => number
}

export function generateMemberWizardSession(opts: MemberWizardOptions): TelemetryEvent[] {
  const { sessionId, persona, caseIndex, forceAbandon, rng } = opts
  const fixture = WIZARD_CASES[caseIndex % WIZARD_CASES.length]
  const events: TelemetryEvent[] = []

  resetEventCounter()

  const clock = new SessionClock(Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000))
  const ctx: EventContext = {
    session_id: sessionId,
    portal: 'member',
    workflow: 'application',
    member_id: fixture.memberId,
    persona,
    clock,
  }

  const visited = new Set<string>()
  const confirmed = new Set<string>()

  // Draft state (simulated — we don't actually import the React reducer)
  let _draft: ApplicationDraft = { ...INITIAL_DRAFT, retirement_date: fixture.retirementDate }

  events.push(makeEvent(ctx, 'session_start', {
    member_id: fixture.memberId,
    tier: fixture.tier,
    workflow: 'application',
  }, buildSnapshot(null, confirmed, visited, clock)))

  // Determine abandon point if forcing abandonment
  const abandonStep = forceAbandon
    ? Math.floor(rng() * (WIZARD_STEPS.length - 1))
    : -1

  for (let stepIdx = 0; stepIdx < WIZARD_STEPS.length; stepIdx++) {
    const stepId = WIZARD_STEPS[stepIdx]
    clock.resetStageTimer()
    visited.add(stepId)

    // Step enter
    clock.advance(navDelay(rng))
    events.push(makeEvent(ctx, 'wizard_step_enter', {
      step: stepIdx,
      step_id: stepId,
    }, buildSnapshot(stepId, confirmed, visited, clock)))

    // Members read content — dwell scales with persona speed
    const readTime = dwellTime(persona.speed_factor, rng)
    clock.advance(readTime)

    // Step-specific interactions
    switch (stepId) {
      case 'personal-info':
        _draft = { ..._draft, personal_confirmed: true }
        clock.advance(actionDelay(rng))
        events.push(makeEvent(ctx, 'analyst_input', {
          step_id: stepId, field: 'personal_confirmed', value: true,
        }, buildSnapshot(stepId, confirmed, visited, clock)))
        break

      case 'retirement-date':
        clock.advance(actionDelay(rng))
        events.push(makeEvent(ctx, 'data_inspect', {
          step_id: stepId, detail: 'date_selection',
        }, buildSnapshot(stepId, confirmed, visited, clock)))
        break

      case 'benefit-estimate':
        // Members spend extra time here understanding the numbers
        clock.advance(dwellTime(persona.speed_factor * 0.5, rng))
        events.push(makeEvent(ctx, 'data_inspect', {
          step_id: stepId, detail: 'benefit_breakdown',
        }, buildSnapshot(stepId, confirmed, visited, clock)))
        break

      case 'payment-option': {
        const option = weightedPick([
          { value: 'maximum' as const, weight: 30 },
          { value: 'j&s_100' as const, weight: 35 },
          { value: 'j&s_75' as const, weight: 20 },
          { value: 'j&s_50' as const, weight: 15 },
        ], rng)
        _draft = { ..._draft, payment_option: option }
        clock.advance(dwellTime(persona.speed_factor * 0.7, rng))
        events.push(makeEvent(ctx, 'option_elect', {
          step_id: stepId, option,
        }, buildSnapshot(stepId, confirmed, visited, clock)))
        break
      }

      case 'death-benefit': {
        const deathElection = weightedPick([
          { value: 'DRAW_50' as const, weight: 40 },
          { value: 'DRAW_100' as const, weight: 30 },
          { value: 'NO_DRAW' as const, weight: 30 },
        ], rng)
        _draft = { ..._draft, death_benefit_election: deathElection }
        clock.advance(actionDelay(rng))
        events.push(makeEvent(ctx, 'analyst_input', {
          step_id: stepId, field: 'death_benefit_election', value: deathElection,
        }, buildSnapshot(stepId, confirmed, visited, clock)))
        break
      }

      case 'insurance-tax':
        _draft = { ..._draft, ack_irrevocable: true, ack_notarize: true, ack_reemployment: true }
        clock.advance(dwellTime(persona.speed_factor * 0.6, rng))
        events.push(makeEvent(ctx, 'analyst_input', {
          step_id: stepId, field: 'acknowledgements', value: true,
        }, buildSnapshot(stepId, confirmed, visited, clock)))
        break

      case 'review-submit':
        clock.advance(dwellTime(persona.speed_factor * 0.8, rng))
        break
    }

    // Check for abandonment
    if (stepIdx === abandonStep) {
      events.push(makeEvent(ctx, 'session_abandon', {
        step: stepIdx,
        step_id: stepId,
        reason: 'timeout',
        duration_ms: clock.elapsed(),
      }, buildSnapshot(stepId, confirmed, visited, clock)))
      return events
    }

    // Natural abandonment probability (persona error_rate amplifies)
    const abandonProb = (ABANDON_RATES[stepId] ?? 0.02) * (1 + persona.error_rate)
    if (!forceAbandon && chance(abandonProb, rng)) {
      events.push(makeEvent(ctx, 'session_abandon', {
        step: stepIdx,
        step_id: stepId,
        reason: 'natural',
        duration_ms: clock.elapsed(),
      }, buildSnapshot(stepId, confirmed, visited, clock)))
      return events
    }

    // Back navigation (impatient members)
    if (stepIdx > 0 && chance(persona.error_rate * 0.5, rng)) {
      clock.advance(navDelay(rng))
      events.push(makeEvent(ctx, 'navigate_back', {
        from_step: stepIdx, to_step: stepIdx - 1,
      }, buildSnapshot(WIZARD_STEPS[stepIdx - 1], confirmed, visited, clock)))

      // Return to current step
      clock.advance(dwellTime(persona.speed_factor * 0.3, rng))
      events.push(makeEvent(ctx, 'navigate_next', {
        from_step: stepIdx - 1, to_step: stepIdx,
      }, buildSnapshot(stepId, confirmed, visited, clock)))
    }

    // Step complete
    confirmed.add(stepId)
    _draft = { ..._draft, step: stepIdx + 1 }
    clock.advance(actionDelay(rng))
    events.push(makeEvent(ctx, 'wizard_step_complete', {
      step: stepIdx,
      step_id: stepId,
      dwell_ms: clock.stageElapsed(),
    }, buildSnapshot(stepId, confirmed, visited, clock)))
  }

  // Submit
  clock.advance(1500 + Math.floor(rng() * 2000))
  events.push(makeEvent(ctx, 'save_complete', {
    member_id: fixture.memberId,
    submission_type: 'digital',
  }, buildSnapshot('review-submit', confirmed, visited, clock)))

  events.push(makeEvent(ctx, 'session_complete', {
    total_steps: WIZARD_STEPS.length,
    completed_steps: confirmed.size,
    duration_ms: clock.elapsed(),
  }, buildSnapshot(null, confirmed, visited, clock)))

  return events
}
