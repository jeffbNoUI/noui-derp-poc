/**
 * Session orchestrator — generates 1000 synthetic workflow sessions per the distribution table.
 * Writes JSONL telemetry and session summaries to output/.
 * Consumed by: run-simulation.ts
 * Depends on: all generators, personas.ts, noise.ts, telemetry-types.ts
 */
import type { TelemetryEvent, SessionSummary, SessionDistribution } from './telemetry-types.ts'
import { STAFF_PERSONAS, MEMBER_PERSONAS, EMPLOYER_PERSONAS, pickPersona } from './personas.ts'
import { createRng } from './noise.ts'
import { generateStaffRetirementSession } from './generators/staff-retirement.ts'
import { generateStaffDeathSession } from './generators/staff-death.ts'
import { generateStaffRefundSession } from './generators/staff-refund.ts'
import { generateMemberWizardSession } from './generators/member-wizard.ts'
import { generateEmployerUploadSession } from './generators/employer-upload.ts'

// ─── Distribution Table ─────────────────────────────────────────

export const SESSION_DISTRIBUTION: SessionDistribution[] = [
  { workflow: 'retirement-guided', count: 300, portal: 'staff' },
  { workflow: 'retirement-expert', count: 100, portal: 'staff' },
  { workflow: 'death', count: 100, portal: 'staff' },
  { workflow: 'refund', count: 100, portal: 'staff' },
  { workflow: 'application', count: 200, portal: 'member' },
  { workflow: 'contribution', count: 100, portal: 'employer' },
  { workflow: 'abandoned', count: 50, portal: 'member' },
  { workflow: 'interrupted-staff', count: 50, portal: 'staff' },
]

// ─── Session Summary Builder ────────────────────────────────────

function buildSummary(sessionId: string, events: TelemetryEvent[]): SessionSummary {
  const first = events[0]
  const last = events[events.length - 1]
  const endEvt = events.find(e => e.event_type === 'session_complete' || e.event_type === 'session_abandon')

  const stagesVisited = new Set<string>()
  const stagesConfirmed = new Set<string>()
  let viewMode: 'guided' | 'expert' = 'guided'

  for (const e of events) {
    if (e.state_snapshot.current_stage) {
      stagesVisited.add(e.state_snapshot.current_stage)
    }
    for (const s of e.state_snapshot.confirmed_stages) {
      stagesConfirmed.add(s)
    }
    if (e.state_snapshot.view_mode) {
      viewMode = e.state_snapshot.view_mode
    }
  }

  return {
    session_id: sessionId,
    portal: first.portal,
    workflow: first.workflow,
    member_id: first.member_id,
    persona_id: first.persona_id,
    experience_level: first.experience_level,
    started_at: first.timestamp,
    ended_at: last.timestamp,
    duration_ms: last.timestamp - first.timestamp,
    event_count: events.length,
    stages_visited: [...stagesVisited],
    stages_confirmed: [...stagesConfirmed],
    completed: endEvt?.event_type === 'session_complete',
    view_mode: viewMode,
    abandoned_at_stage: endEvt?.event_type === 'session_abandon'
      ? (endEvt.payload['step_id'] as string ?? endEvt.state_snapshot.current_stage)
      : null,
  }
}

// ─── Main Generation Function ───────────────────────────────────

export interface GenerationResult {
  events: TelemetryEvent[]
  summaries: SessionSummary[]
  totalSessions: number
  totalEvents: number
}

export function generateAllSessions(seed = 42): GenerationResult {
  const rng = createRng(seed)
  const allEvents: TelemetryEvent[] = []
  const allSummaries: SessionSummary[] = []
  let sessionNum = 0

  for (const dist of SESSION_DISTRIBUTION) {
    for (let i = 0; i < dist.count; i++) {
      sessionNum++
      const sessionId = `S-${sessionNum.toString().padStart(4, '0')}`
      const sessionRng = createRng(Math.floor(rng() * 2147483647))

      let events: TelemetryEvent[]

      switch (dist.workflow) {
        case 'retirement-guided': {
          const persona = pickPersona(STAFF_PERSONAS, sessionRng)
          events = generateStaffRetirementSession({
            sessionId, persona, caseIndex: i % 4, expertMode: false, rng: sessionRng,
          })
          break
        }
        case 'retirement-expert': {
          // Expert mode sessions prefer expert personas
          const expertPersonas = STAFF_PERSONAS.filter(p => p.experience === 'expert')
          const persona = pickPersona(
            expertPersonas.length > 0 ? expertPersonas : STAFF_PERSONAS,
            sessionRng,
          )
          events = generateStaffRetirementSession({
            sessionId, persona, caseIndex: i % 4, expertMode: true, rng: sessionRng,
          })
          break
        }
        case 'death': {
          const persona = pickPersona(STAFF_PERSONAS, sessionRng)
          events = generateStaffDeathSession({
            sessionId, persona, caseIndex: i % 2, rng: sessionRng,
          })
          break
        }
        case 'refund': {
          const persona = pickPersona(STAFF_PERSONAS, sessionRng)
          events = generateStaffRefundSession({
            sessionId, persona, caseIndex: i % 2, rng: sessionRng,
          })
          break
        }
        case 'application': {
          const persona = pickPersona(MEMBER_PERSONAS, sessionRng)
          events = generateMemberWizardSession({
            sessionId, persona, caseIndex: i % 2, forceAbandon: false, rng: sessionRng,
          })
          break
        }
        case 'contribution': {
          const persona = pickPersona(EMPLOYER_PERSONAS, sessionRng)
          events = generateEmployerUploadSession({
            sessionId, persona, fixtureIndex: i % 3, rng: sessionRng,
          })
          break
        }
        case 'abandoned': {
          const persona = pickPersona(MEMBER_PERSONAS, sessionRng)
          events = generateMemberWizardSession({
            sessionId, persona, caseIndex: i % 2, forceAbandon: true, rng: sessionRng,
          })
          break
        }
        case 'interrupted-staff': {
          // Staff sessions that get abandoned mid-way
          const persona = pickPersona(STAFF_PERSONAS, sessionRng)
          const fullEvents = generateStaffRetirementSession({
            sessionId, persona, caseIndex: i % 4, expertMode: false, rng: sessionRng,
          })
          // Truncate at a random point (30-70% through)
          const cutPoint = Math.floor(fullEvents.length * (0.3 + sessionRng() * 0.4))
          events = fullEvents.slice(0, cutPoint)
          // Add abandon event
          const lastEvent = events[events.length - 1]
          events.push({
            ...lastEvent,
            event_id: `E-ABANDON`,
            event_type: 'session_abandon',
            payload: { reason: 'interrupted', progress_pct: cutPoint / fullEvents.length },
          })
          break
        }
        default:
          events = []
      }

      if (events.length > 0) {
        allEvents.push(...events)
        allSummaries.push(buildSummary(sessionId, events))
      }
    }
  }

  return {
    events: allEvents,
    summaries: allSummaries,
    totalSessions: sessionNum,
    totalEvents: allEvents.length,
  }
}
