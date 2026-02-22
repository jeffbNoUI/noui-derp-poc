/**
 * Stage composition logic — filters the STAGE_HELP list based on member data.
 * Stage 7 (DRO) is conditional: only included when DROs exist for the member.
 * Consumed by: GuidedWorkspace, guided-composition.test.ts
 * Depends on: guided-help.ts (STAGE_HELP), Member types
 */
import type { ServiceCreditSummary, DRORecord } from '@/types/Member'
import { STAGE_HELP, type StageHelp } from './guided-help'

/**
 * Returns the list of active stages for a given member's data context.
 * Conditional stages (e.g. DRO) are filtered out when their condition is not met.
 */
export function composeStages(
  sc: ServiceCreditSummary | undefined,
  dros: DRORecord[] | undefined,
): StageHelp[] {
  return STAGE_HELP.filter(stage => {
    if (!stage.conditional) return true
    return stage.conditional(sc, dros)
  })
}

/** Returns just the stage IDs for a given member context */
export function composeStageIds(
  sc: ServiceCreditSummary | undefined,
  dros: DRORecord[] | undefined,
): string[] {
  return composeStages(sc, dros).map(s => s.id)
}
