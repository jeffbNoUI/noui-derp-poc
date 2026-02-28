/**
 * Smart nudge types — rule definitions for contextual toast hints.
 * Consumed by: nudge-rules.ts, useNudges.ts
 * Depends on: Nothing (pure types)
 */

export type NudgeTrigger =
  | { type: 'idle'; stageId: string; delayMs: number }
  | { type: 'out-of-order'; confirmedBefore: string; notVisited: string }

export interface NudgeRule {
  id: string
  trigger: NudgeTrigger
  message: string
  hint: string
  maxCases?: number  // Only fire if analyst has completed <= this many cases
}

export interface NudgeContext {
  currentStageId: string
  confirmed: Set<string>
  visitedStages: Set<string>
  casesCompleted?: number  // From proficiency data
}
