/**
 * Staff refund/withdrawal workflow generator — 5-6 stages for contribution refund.
 * Covers application, vesting check, contribution history, refund calc, payment, close.
 * Consumed by: session-generator.ts
 * Depends on: telemetry-types.ts, generator-utils.ts, noise.ts
 */
import type { TelemetryEvent, PersonaProfile } from '../telemetry-types.ts'
import {
  SessionClock, makeEvent, buildSnapshot, resetEventCounter,
} from './generator-utils.ts'
import type { EventContext } from './generator-utils.ts'
import { dwellTime, actionDelay, navDelay, chance } from '../noise.ts'

const REFUND_STAGES_NONVESTED = [
  'refund-application',
  'vesting-check',
  'contribution-history',
  'refund-calculation',
  'payment-processing',
]

const REFUND_STAGES_VESTED = [
  'refund-application',
  'vesting-check',
  'benefit-comparison',
  'contribution-history',
  'refund-calculation',
  'payment-processing',
]

const REFUND_CHECKLIST_COUNTS: Record<string, number> = {
  'refund-application': 3,
  'vesting-check': 2,
  'benefit-comparison': 3,
  'contribution-history': 3,
  'refund-calculation': 3,
  'payment-processing': 2,
}

interface RefundCaseFixture {
  memberId: string
  tier: number
  isVested: boolean
  serviceYears: number
  totalContributions: number
}

const REFUND_CASES: RefundCaseFixture[] = [
  { memberId: '10007', tier: 2, isVested: false, serviceYears: 3.5, totalContributions: 22500 },
  { memberId: '10008', tier: 3, isVested: true, serviceYears: 7.4, totalContributions: 45000 },
]

export interface StaffRefundOptions {
  sessionId: string
  persona: PersonaProfile
  caseIndex: number
  rng: () => number
}

export function generateStaffRefundSession(opts: StaffRefundOptions): TelemetryEvent[] {
  const { sessionId, persona, caseIndex, rng } = opts
  const fixture = REFUND_CASES[caseIndex % REFUND_CASES.length]
  const stages = fixture.isVested ? REFUND_STAGES_VESTED : REFUND_STAGES_NONVESTED
  const events: TelemetryEvent[] = []

  resetEventCounter()

  const clock = new SessionClock(Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000))
  const ctx: EventContext = {
    session_id: sessionId,
    portal: 'staff',
    workflow: 'refund',
    member_id: fixture.memberId,
    persona,
    clock,
  }

  const visited = new Set<string>()
  const confirmed = new Set<string>()

  events.push(makeEvent(ctx, 'session_start', {
    case_id: fixture.memberId,
    workflow: 'refund',
    tier: fixture.tier,
    is_vested: fixture.isVested,
    service_years: fixture.serviceYears,
  }, buildSnapshot(null, confirmed, visited, clock, 'guided')))

  for (const stageId of stages) {
    clock.resetStageTimer()
    visited.add(stageId)

    clock.advance(navDelay(rng))
    events.push(makeEvent(ctx, 'stage_enter', {
      stage_id: stageId,
    }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))

    clock.advance(actionDelay(rng))
    events.push(makeEvent(ctx, 'data_load', {
      stage_id: stageId,
    }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))

    // Vesting check is the decision point
    if (stageId === 'vesting-check') {
      clock.advance(dwellTime(persona.speed_factor * 1.2, rng))
      events.push(makeEvent(ctx, 'data_inspect', {
        stage_id: stageId,
        vested: fixture.isVested,
        service_years: fixture.serviceYears,
      }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))
    }

    // Benefit comparison (vested only) — longer dwell
    if (stageId === 'benefit-comparison') {
      clock.advance(dwellTime(persona.speed_factor * 1.5, rng))
      events.push(makeEvent(ctx, 'data_inspect', {
        stage_id: stageId,
        detail: 'refund_vs_deferred_benefit',
      }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))
    }

    // Checklist
    const checkCount = REFUND_CHECKLIST_COUNTS[stageId] ?? 0
    for (let i = 0; i < checkCount; i++) {
      if (chance(persona.thoroughness, rng)) {
        clock.advance(actionDelay(rng))
        events.push(makeEvent(ctx, 'checklist_check', {
          stage_id: stageId, item_index: i, auto: false,
        }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))
      }
    }

    clock.advance(dwellTime(persona.speed_factor, rng))

    confirmed.add(stageId)
    clock.advance(actionDelay(rng))
    events.push(makeEvent(ctx, 'stage_confirm', {
      stage_id: stageId,
    }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))

    events.push(makeEvent(ctx, 'stage_exit', {
      stage_id: stageId,
      dwell_ms: clock.stageElapsed(),
    }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))
  }

  events.push(makeEvent(ctx, 'session_complete', {
    total_stages: stages.length,
    confirmed_stages: confirmed.size,
    duration_ms: clock.elapsed(),
  }, buildSnapshot(null, confirmed, visited, clock, 'guided')))

  return events
}
