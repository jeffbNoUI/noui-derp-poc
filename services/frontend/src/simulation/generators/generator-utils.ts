/**
 * Shared utilities for all workflow generators: event factory, timing, snapshots.
 * Every generator builds TelemetryEvent arrays using these helpers.
 * Consumed by: staff-retirement.ts, staff-death.ts, staff-refund.ts, member-wizard.ts, employer-upload.ts
 * Depends on: telemetry-types.ts, noise.ts
 */
import type {
  TelemetryEvent, EventType, StateSnapshot, PersonaProfile,
} from '../telemetry-types.ts'

// ─── Session Clock ──────────────────────────────────────────────

export class SessionClock {
  private current: number
  private stageStart: number
  readonly sessionStart: number

  constructor(startTime: number) {
    this.current = startTime
    this.stageStart = startTime
    this.sessionStart = startTime
  }

  advance(ms: number): void {
    this.current += Math.round(ms)
  }

  now(): number {
    return this.current
  }

  elapsed(): number {
    return this.current - this.sessionStart
  }

  stageElapsed(): number {
    return this.current - this.stageStart
  }

  resetStageTimer(): void {
    this.stageStart = this.current
  }
}

// ─── Event Factory ──────────────────────────────────────────────

let eventCounter = 0

export function resetEventCounter(): void {
  eventCounter = 0
}

export interface EventContext {
  session_id: string
  portal: 'staff' | 'member' | 'employer'
  workflow: 'retirement' | 'death' | 'refund' | 'application' | 'contribution'
  member_id: string
  persona: PersonaProfile
  clock: SessionClock
}

export function makeEvent(
  ctx: EventContext,
  event_type: EventType,
  payload: Record<string, unknown>,
  snapshot: StateSnapshot,
): TelemetryEvent {
  eventCounter++
  return {
    session_id: ctx.session_id,
    event_id: `E-${eventCounter.toString().padStart(6, '0')}`,
    timestamp: ctx.clock.now(),
    portal: ctx.portal,
    workflow: ctx.workflow,
    member_id: ctx.member_id,
    persona_id: ctx.persona.id,
    experience_level: ctx.persona.experience,
    event_type,
    payload,
    state_snapshot: snapshot,
  }
}

// ─── Snapshot Builder ───────────────────────────────────────────

export function buildSnapshot(
  currentStage: string | null,
  confirmed: Set<string>,
  visited: Set<string>,
  clock: SessionClock,
  viewMode?: 'guided' | 'expert',
): StateSnapshot {
  return {
    current_stage: currentStage,
    confirmed_stages: [...confirmed],
    visited_stages: [...visited],
    view_mode: viewMode,
    elapsed_ms: clock.elapsed(),
    stage_elapsed_ms: clock.stageElapsed(),
  }
}

// ─── Checklist simulation ───────────────────────────────────────

/** Simulate checking items in a checklist based on thoroughness and auto-checks */
export function simulateChecklist(
  ctx: EventContext,
  stageId: string,
  totalItems: number,
  autoChecked: Set<number>,
  confirmed: Set<string>,
  visited: Set<string>,
  rng: () => number,
  actionDelayFn: (rng: () => number) => number,
): TelemetryEvent[] {
  const events: TelemetryEvent[] = []
  const thoroughness = ctx.persona.thoroughness

  for (let i = 0; i < totalItems; i++) {
    // Auto-checked items are already done, but thorough users still review them
    if (autoChecked.has(i)) {
      if (rng() < thoroughness * 0.3) {
        // Thorough user glances at auto-checked item
        ctx.clock.advance(actionDelayFn(rng) * 0.3)
      }
      continue
    }

    // Manually check based on thoroughness
    if (rng() < thoroughness) {
      ctx.clock.advance(actionDelayFn(rng))
      events.push(makeEvent(ctx, 'checklist_check', {
        stage_id: stageId, item_index: i, auto: false,
      }, buildSnapshot(stageId, confirmed, visited, ctx.clock)))
    }
  }

  return events
}
