/**
 * Pattern extraction from telemetry sessions — stage ordering, bottlenecks,
 * error recovery, expert mode adoption, completion funnel, nudge effectiveness.
 * Consumed by: composition-recommender.ts, report-generator.ts
 * Depends on: telemetry-types.ts
 */
import type { TelemetryEvent, SessionSummary } from '../telemetry-types.ts'

// ─── Pattern Types ──────────────────────────────────────────────

export interface StageOrderPattern {
  order: string[]
  count: number
  percentage: number
  experience_breakdown: Record<string, number>
}

export interface BottleneckStage {
  stage_id: string
  median_dwell_ms: number
  p75_dwell_ms: number
  p90_dwell_ms: number
  is_bottleneck: boolean
  bottleneck_ratio: number
}

export interface ErrorRecoveryPattern {
  stage_id: string
  unconfirm_count: number
  total_visits: number
  unconfirm_rate: number
  correlated_case_types: string[]
}

export interface ExpertModePattern {
  adoption_rate: number
  switch_at_stage: Record<string, number>
  time_savings_pct: number
  by_experience: Record<string, number>
}

export interface CompletionFunnelStep {
  step_id: string
  entered: number
  completed: number
  abandoned: number
  completion_rate: number
  abandonment_rate: number
}

export interface NudgeEffectiveness {
  nudge_id: string
  fire_count: number
  act_count: number
  dismiss_count: number
  effectiveness: number
}

export interface LearningModuleUsage {
  layer: string
  toggle_count: number
  view_count: number
  by_experience: Record<string, number>
  avg_view_duration_ms: number
}

export interface ExtractedPatterns {
  stage_ordering: StageOrderPattern[]
  bottlenecks: BottleneckStage[]
  error_recovery: ErrorRecoveryPattern[]
  expert_mode: ExpertModePattern
  completion_funnel: CompletionFunnelStep[]
  nudge_effectiveness: NudgeEffectiveness[]
  learning_module: LearningModuleUsage[]
  case_complexity: CaseComplexityPattern[]
}

export interface CaseComplexityPattern {
  case_type: string
  avg_duration_ms: number
  avg_events: number
  session_count: number
}

// ─── Extraction Functions ───────────────────────────────────────

function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = Math.ceil(sorted.length * p / 100) - 1
  return sorted[Math.max(0, idx)]
}

/** Group events by session_id */
function groupBySession(events: TelemetryEvent[]): Map<string, TelemetryEvent[]> {
  const groups = new Map<string, TelemetryEvent[]>()
  for (const e of events) {
    const arr = groups.get(e.session_id) ?? []
    arr.push(e)
    groups.set(e.session_id, arr)
  }
  return groups
}

// ─── Stage Ordering ─────────────────────────────────────────────

export function extractStageOrdering(events: TelemetryEvent[], summaries: SessionSummary[]): StageOrderPattern[] {
  const orderCounts = new Map<string, { count: number; experience: Record<string, number> }>()
  const sessions = groupBySession(events)
  const retirementSessions = summaries.filter(s => s.workflow === 'retirement')

  for (const summary of retirementSessions) {
    const sessionEvents = sessions.get(summary.session_id) ?? []
    const stageEnters = sessionEvents
      .filter(e => e.event_type === 'stage_enter')
      .map(e => e.payload['stage_id'] as string)

    // Deduplicate consecutive entries
    const order: string[] = []
    for (const s of stageEnters) {
      if (order[order.length - 1] !== s) order.push(s)
    }

    const key = order.join(' → ')
    const existing = orderCounts.get(key) ?? { count: 0, experience: {} }
    existing.count++
    existing.experience[summary.experience_level] = (existing.experience[summary.experience_level] ?? 0) + 1
    orderCounts.set(key, existing)
  }

  const total = retirementSessions.length || 1
  return [...orderCounts.entries()]
    .map(([key, val]) => ({
      order: key.split(' → '),
      count: val.count,
      percentage: Math.round(val.count / total * 10000) / 100,
      experience_breakdown: val.experience,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

// ─── Bottleneck Detection ───────────────────────────────────────

export function extractBottlenecks(events: TelemetryEvent[]): BottleneckStage[] {
  const stageDwells = new Map<string, number[]>()

  // Extract dwell times from stage_exit events
  for (const e of events) {
    if (e.event_type === 'stage_exit' && e.payload['dwell_ms']) {
      const stageId = e.payload['stage_id'] as string
      const arr = stageDwells.get(stageId) ?? []
      arr.push(e.payload['dwell_ms'] as number)
      stageDwells.set(stageId, arr)
    }
  }

  const allMedians: number[] = []
  const results: BottleneckStage[] = []

  for (const [stageId, dwells] of stageDwells) {
    const med = median(dwells)
    allMedians.push(med)
    results.push({
      stage_id: stageId,
      median_dwell_ms: Math.round(med),
      p75_dwell_ms: Math.round(percentile(dwells, 75)),
      p90_dwell_ms: Math.round(percentile(dwells, 90)),
      is_bottleneck: false,
      bottleneck_ratio: 0,
    })
  }

  // A stage is a bottleneck if its median exceeds 1.5× the overall median
  const overallMedian = median(allMedians) || 1
  for (const r of results) {
    r.bottleneck_ratio = Math.round(r.median_dwell_ms / overallMedian * 100) / 100
    r.is_bottleneck = r.bottleneck_ratio > 1.5
  }

  return results.sort((a, b) => b.bottleneck_ratio - a.bottleneck_ratio)
}

// ─── Error Recovery ─────────────────────────────────────────────

export function extractErrorRecovery(events: TelemetryEvent[]): ErrorRecoveryPattern[] {
  const stageUnconfirms = new Map<string, number>()
  const stageVisits = new Map<string, number>()

  for (const e of events) {
    if (e.event_type === 'stage_unconfirm') {
      const stageId = e.payload['stage_id'] as string
      stageUnconfirms.set(stageId, (stageUnconfirms.get(stageId) ?? 0) + 1)
    }
    if (e.event_type === 'stage_enter') {
      const stageId = e.payload['stage_id'] as string
      stageVisits.set(stageId, (stageVisits.get(stageId) ?? 0) + 1)
    }
  }

  const results: ErrorRecoveryPattern[] = []
  for (const [stageId, count] of stageUnconfirms) {
    const visits = stageVisits.get(stageId) ?? 1
    results.push({
      stage_id: stageId,
      unconfirm_count: count,
      total_visits: visits,
      unconfirm_rate: Math.round(count / visits * 10000) / 10000,
      correlated_case_types: [],
    })
  }

  return results.sort((a, b) => b.unconfirm_rate - a.unconfirm_rate)
}

// ─── Expert Mode Adoption ───────────────────────────────────────

export function extractExpertMode(events: TelemetryEvent[], summaries: SessionSummary[]): ExpertModePattern {
  const staffSessions = summaries.filter(s => s.portal === 'staff')
  const expertSessions = staffSessions.filter(s => s.view_mode === 'expert')

  const switchAtStage: Record<string, number> = {}
  const byExperience: Record<string, number> = {}

  for (const e of events) {
    if (e.event_type === 'expert_mode_switch') {
      const stage = e.state_snapshot.current_stage ?? 'start'
      switchAtStage[stage] = (switchAtStage[stage] ?? 0) + 1
    }
  }

  for (const s of expertSessions) {
    byExperience[s.experience_level] = (byExperience[s.experience_level] ?? 0) + 1
  }

  // Calculate time savings
  const guidedDurations = staffSessions.filter(s => s.view_mode === 'guided' && s.completed).map(s => s.duration_ms)
  const expertDurations = expertSessions.filter(s => s.completed).map(s => s.duration_ms)
  const avgGuided = guidedDurations.length > 0 ? guidedDurations.reduce((a, b) => a + b, 0) / guidedDurations.length : 0
  const avgExpert = expertDurations.length > 0 ? expertDurations.reduce((a, b) => a + b, 0) / expertDurations.length : 0
  const timeSavings = avgGuided > 0 ? Math.round((1 - avgExpert / avgGuided) * 10000) / 100 : 0

  return {
    adoption_rate: staffSessions.length > 0 ? Math.round(expertSessions.length / staffSessions.length * 10000) / 100 : 0,
    switch_at_stage: switchAtStage,
    time_savings_pct: timeSavings,
    by_experience: byExperience,
  }
}

// ─── Completion Funnel ──────────────────────────────────────────

export function extractCompletionFunnel(events: TelemetryEvent[], summaries: SessionSummary[]): CompletionFunnelStep[] {
  const wizardSessions = summaries.filter(s => s.workflow === 'application')
  const sessions = groupBySession(events)

  const steps = [
    'personal-info', 'retirement-date', 'benefit-estimate',
    'payment-option', 'death-benefit', 'insurance-tax', 'review-submit',
  ]

  const stepEntered = new Map<string, number>()
  const stepCompleted = new Map<string, number>()
  const stepAbandoned = new Map<string, number>()

  for (const summary of wizardSessions) {
    const sessionEvents = sessions.get(summary.session_id) ?? []
    const entered = new Set<string>()
    const completed = new Set<string>()

    for (const e of sessionEvents) {
      if (e.event_type === 'wizard_step_enter') {
        entered.add(e.payload['step_id'] as string)
      }
      if (e.event_type === 'wizard_step_complete') {
        completed.add(e.payload['step_id'] as string)
      }
    }

    for (const step of entered) {
      stepEntered.set(step, (stepEntered.get(step) ?? 0) + 1)
    }
    for (const step of completed) {
      stepCompleted.set(step, (stepCompleted.get(step) ?? 0) + 1)
    }

    if (!summary.completed && summary.abandoned_at_stage) {
      stepAbandoned.set(summary.abandoned_at_stage, (stepAbandoned.get(summary.abandoned_at_stage) ?? 0) + 1)
    }
  }

  return steps.map(stepId => {
    const entered = stepEntered.get(stepId) ?? 0
    const completed = stepCompleted.get(stepId) ?? 0
    const abandoned = stepAbandoned.get(stepId) ?? 0
    return {
      step_id: stepId,
      entered,
      completed,
      abandoned,
      completion_rate: entered > 0 ? Math.round(completed / entered * 10000) / 100 : 0,
      abandonment_rate: entered > 0 ? Math.round(abandoned / entered * 10000) / 100 : 0,
    }
  })
}

// ─── Nudge Effectiveness ────────────────────────────────────────

export function extractNudgeEffectiveness(events: TelemetryEvent[]): NudgeEffectiveness[] {
  const nudgeStats = new Map<string, { fire: number; act: number; dismiss: number }>()

  for (const e of events) {
    if (e.event_type === 'nudge_fire') {
      const id = e.payload['nudge_id'] as string
      const stats = nudgeStats.get(id) ?? { fire: 0, act: 0, dismiss: 0 }
      stats.fire++
      nudgeStats.set(id, stats)
    }
    if (e.event_type === 'nudge_act') {
      const id = e.payload['nudge_id'] as string
      const stats = nudgeStats.get(id) ?? { fire: 0, act: 0, dismiss: 0 }
      stats.act++
      nudgeStats.set(id, stats)
    }
    if (e.event_type === 'nudge_dismiss') {
      const id = e.payload['nudge_id'] as string
      const stats = nudgeStats.get(id) ?? { fire: 0, act: 0, dismiss: 0 }
      stats.dismiss++
      nudgeStats.set(id, stats)
    }
  }

  return [...nudgeStats.entries()].map(([id, stats]) => ({
    nudge_id: id,
    fire_count: stats.fire,
    act_count: stats.act,
    dismiss_count: stats.dismiss,
    effectiveness: stats.fire > 0 ? Math.round(stats.act / stats.fire * 10000) / 100 : 0,
  }))
}

// ─── Learning Module Usage ──────────────────────────────────────

export function extractLearningModuleUsage(events: TelemetryEvent[]): LearningModuleUsage[] {
  const layerToggles = new Map<string, number>()
  const layerViews = new Map<string, number>()
  const layerByExp = new Map<string, Record<string, number>>()
  const layerDurations = new Map<string, number[]>()

  for (const e of events) {
    if (e.event_type === 'layer_toggle') {
      const layer = e.payload['layer'] as string
      layerToggles.set(layer, (layerToggles.get(layer) ?? 0) + 1)

      const expMap = layerByExp.get(layer) ?? {}
      expMap[e.experience_level] = (expMap[e.experience_level] ?? 0) + 1
      layerByExp.set(layer, expMap)
    }
    if (e.event_type === 'rules_view' || e.event_type === 'onboarding_view') {
      const layer = e.event_type === 'rules_view' ? 'rules' : 'onboarding'
      layerViews.set(layer, (layerViews.get(layer) ?? 0) + 1)
      const duration = e.payload['duration_ms'] as number ?? 0
      const arr = layerDurations.get(layer) ?? []
      arr.push(duration)
      layerDurations.set(layer, arr)
    }
  }

  const layers = ['onboarding', 'rules', 'checklist']
  return layers.map(layer => {
    const durations = layerDurations.get(layer) ?? []
    return {
      layer,
      toggle_count: layerToggles.get(layer) ?? 0,
      view_count: layerViews.get(layer) ?? 0,
      by_experience: layerByExp.get(layer) ?? {},
      avg_view_duration_ms: durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
    }
  })
}

// ─── Case Complexity ────────────────────────────────────────────

export function extractCaseComplexity(_events: TelemetryEvent[], summaries: SessionSummary[]): CaseComplexityPattern[] {
  // Group retirement sessions by case type (member_id → case fixture)
  const caseTypes = new Map<string, { durations: number[]; eventCounts: number[] }>()

  for (const s of summaries) {
    if (s.workflow !== 'retirement') continue
    const key = s.member_id
    const data = caseTypes.get(key) ?? { durations: [], eventCounts: [] }
    data.durations.push(s.duration_ms)
    data.eventCounts.push(s.event_count)
    caseTypes.set(key, data)
  }

  return [...caseTypes.entries()].map(([caseType, data]) => ({
    case_type: caseType,
    avg_duration_ms: Math.round(data.durations.reduce((a, b) => a + b, 0) / data.durations.length),
    avg_events: Math.round(data.eventCounts.reduce((a, b) => a + b, 0) / data.eventCounts.length),
    session_count: data.durations.length,
  }))
}

// ─── Main Extraction ────────────────────────────────────────────

export function extractAllPatterns(events: TelemetryEvent[], summaries: SessionSummary[]): ExtractedPatterns {
  return {
    stage_ordering: extractStageOrdering(events, summaries),
    bottlenecks: extractBottlenecks(events),
    error_recovery: extractErrorRecovery(events),
    expert_mode: extractExpertMode(events, summaries),
    completion_funnel: extractCompletionFunnel(events, summaries),
    nudge_effectiveness: extractNudgeEffectiveness(events),
    learning_module: extractLearningModuleUsage(events),
    case_complexity: extractCaseComplexity(events, summaries),
  }
}
