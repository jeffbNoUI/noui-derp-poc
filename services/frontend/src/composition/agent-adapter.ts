/**
 * Agent composition adapter — maps the composition service's AgentWorkspaceSpec
 * to the guided workspace's StageHelp[] format for stage rendering.
 * Consumed by: GuidedWorkspace (when ?agent mode is active)
 * Depends on: guided-help.ts (STAGE_HELP, StageHelp), useWorkspace.ts (AgentWorkspaceSpec)
 */
import { STAGE_HELP, type StageHelp } from '@/pages/staff/guided-help'
import type { AgentWorkspaceSpec } from '@/hooks/useWorkspace'

/**
 * Maps composition service component IDs to guided workspace stage IDs.
 * Components that map to the same stage are collapsed — if any component
 * in a stage is present, the full stage is included.
 */
const COMPONENT_TO_STAGE: Record<string, string> = {
  'employment-timeline': 'member-verify',
  'service-credit-summary': 'service-credit',
  'salary-table': 'benefit-calc',
  'eligibility-panel': 'eligibility',
  'benefit-calculation': 'benefit-calc',
  'payment-options': 'payment-options',
  'ipr-panel': 'supplemental',
  'dro-impact': 'dro',
}

/** Stages always included regardless of agent composition (workspace-specific, no composition equivalent) */
const ALWAYS_PRESENT_STAGES = new Set(['application-intake', 'review-certify'])

/**
 * Maps an agent-composed workspace spec to a filtered list of StageHelp entries.
 * Preserves STAGE_HELP ordering for consistency — the agent may suggest a different
 * order but we use our canonical stage sequence.
 */
export function composeStagesFromAgent(spec: AgentWorkspaceSpec): StageHelp[] {
  const activeComponentIds = extractActiveComponentIds(spec)
  const activeStageIds = new Set<string>(ALWAYS_PRESENT_STAGES)

  // Map each agent component to its corresponding stage
  for (const componentId of activeComponentIds) {
    const stageId = COMPONENT_TO_STAGE[componentId]
    if (stageId) {
      activeStageIds.add(stageId)
    }
  }

  // Filter STAGE_HELP preserving canonical order
  return STAGE_HELP.filter(stage => activeStageIds.has(stage.id))
}

/**
 * Flattens the agent spec's stages[].components into a Set of component IDs
 * for quick lookup by downstream consumers.
 */
export function extractActiveComponentIds(spec: AgentWorkspaceSpec): Set<string> {
  const ids = new Set<string>()
  for (const stage of spec.stages) {
    for (const componentId of stage.components) {
      ids.add(componentId)
    }
  }
  return ids
}
