/**
 * Adaptive card depth — pure functions for computing whether a stage renders
 * as 'full' (complete stage component) or 'summary' (compact key-value card).
 * DRO and review-certify are always full. Amber/red signals force full depth.
 * Consumed by: GuidedWorkspace, ExpertMode, StageSummary
 * Depends on: guided-signals.ts (StageSignal), guided-help.ts (SummaryField), stages/StageProps
 */
import type { StageSignal } from './guided-signals'
import type { SummaryField } from './guided-help'
import type { StageProps } from './stages/StageProps'

export type StageDepth = 'full' | 'summary'

/** Stages that are always full regardless of signal */
const ALWAYS_FULL_STAGES = new Set(['dro', 'review-certify'])

/**
 * Compute whether a stage should render as full or summary.
 * Full when: signal is amber/red, stage is DRO or review-certify, or manually expanded.
 */
export function computeStageDepth(
  stageId: string,
  signal: StageSignal | undefined,
): StageDepth {
  if (ALWAYS_FULL_STAGES.has(stageId)) return 'full'
  if (!signal || signal.level === 'amber' || signal.level === 'red') return 'full'
  return 'summary'
}

/**
 * Resolve summary field values from StageProps using dot-path notation.
 * Returns an array of { label, value, format, badgeColor } ready for rendering.
 */
export function resolveSummaryValues(
  fields: SummaryField[],
  props: StageProps,
): { label: string; value: string; format: SummaryField['format']; badgeColor?: SummaryField['badgeColor'] }[] {
  return fields.map(field => {
    const raw = getNestedValue(props, field.path)
    const value = raw !== undefined && raw !== null ? String(raw) : '—'
    return { label: field.label, value, format: field.format, badgeColor: field.badgeColor }
  })
}

/** Traverse a dot-path like 'benefit.net_monthly_benefit' into a nested object */
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}
