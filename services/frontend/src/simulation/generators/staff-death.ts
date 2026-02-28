/**
 * Staff death benefit workflow generator — 5 stages for survivor determination.
 * Covers death notification, survivor verification, benefit calculation, payment, and close.
 * Consumed by: session-generator.ts
 * Depends on: telemetry-types.ts, generator-utils.ts, noise.ts
 */
import type { TelemetryEvent, PersonaProfile } from '../telemetry-types.ts'
import {
  SessionClock, makeEvent, buildSnapshot, resetEventCounter,
} from './generator-utils.ts'
import type { EventContext } from './generator-utils.ts'
import { dwellTime, actionDelay, navDelay, chance } from '../noise.ts'

const DEATH_STAGES = [
  'death-notification',
  'survivor-verification',
  'benefit-determination',
  'payment-setup',
  'case-close',
]

const DEATH_CHECKLIST_COUNTS: Record<string, number> = {
  'death-notification': 3,
  'survivor-verification': 4,
  'benefit-determination': 3,
  'payment-setup': 3,
  'case-close': 2,
}

interface DeathCaseFixture {
  memberId: string
  tier: number
  hasSurvivorBenefit: boolean
  deathBenefitAmount: number
}

const DEATH_CASES: DeathCaseFixture[] = [
  { memberId: '10009', tier: 1, hasSurvivorBenefit: true, deathBenefitAmount: 5000 },
  { memberId: '10010', tier: 2, hasSurvivorBenefit: false, deathBenefitAmount: 5000 },
]

export interface StaffDeathOptions {
  sessionId: string
  persona: PersonaProfile
  caseIndex: number
  rng: () => number
}

export function generateStaffDeathSession(opts: StaffDeathOptions): TelemetryEvent[] {
  const { sessionId, persona, caseIndex, rng } = opts
  const fixture = DEATH_CASES[caseIndex % DEATH_CASES.length]
  const events: TelemetryEvent[] = []

  resetEventCounter()

  const clock = new SessionClock(Date.now() - Math.floor(rng() * 30 * 24 * 60 * 60 * 1000))
  const ctx: EventContext = {
    session_id: sessionId,
    portal: 'staff',
    workflow: 'death',
    member_id: fixture.memberId,
    persona,
    clock,
  }

  const visited = new Set<string>()
  const confirmed = new Set<string>()

  // Session start
  events.push(makeEvent(ctx, 'session_start', {
    case_id: fixture.memberId,
    workflow: 'death',
    tier: fixture.tier,
    has_survivor: fixture.hasSurvivorBenefit,
  }, buildSnapshot(null, confirmed, visited, clock, 'guided')))

  // Process each stage sequentially (death cases are always linear)
  for (const stageId of DEATH_STAGES) {
    clock.resetStageTimer()
    visited.add(stageId)

    clock.advance(navDelay(rng))
    events.push(makeEvent(ctx, 'stage_enter', {
      stage_id: stageId,
    }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))

    // Data load
    clock.advance(actionDelay(rng))
    events.push(makeEvent(ctx, 'data_load', {
      stage_id: stageId,
    }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))

    // Survivor verification is the branching point
    if (stageId === 'survivor-verification') {
      clock.advance(dwellTime(persona.speed_factor * 1.3, rng))
      events.push(makeEvent(ctx, 'data_inspect', {
        stage_id: stageId,
        detail: fixture.hasSurvivorBenefit ? 'survivor_identified' : 'no_survivor',
      }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))
    }

    // Checklist
    const checkCount = DEATH_CHECKLIST_COUNTS[stageId] ?? 0
    for (let i = 0; i < checkCount; i++) {
      if (chance(persona.thoroughness, rng)) {
        clock.advance(actionDelay(rng))
        events.push(makeEvent(ctx, 'checklist_check', {
          stage_id: stageId, item_index: i, auto: false,
        }, buildSnapshot(stageId, confirmed, visited, clock, 'guided')))
      }
    }

    // Dwell
    clock.advance(dwellTime(persona.speed_factor, rng))

    // Confirm
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

  // Session complete
  events.push(makeEvent(ctx, 'session_complete', {
    total_stages: DEATH_STAGES.length,
    confirmed_stages: confirmed.size,
    duration_ms: clock.elapsed(),
  }, buildSnapshot(null, confirmed, visited, clock, 'guided')))

  return events
}
