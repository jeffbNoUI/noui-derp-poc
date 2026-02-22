import type { Member, ServiceCreditSummary, DRORecord } from '@/types/Member'

// Component identifiers for workspace composition
export type ComponentId =
  | 'member-banner'
  | 'alert-bar'
  | 'employment-timeline'
  | 'salary-table'
  | 'eligibility-panel'
  | 'benefit-calculation'
  | 'payment-options'
  | 'scenario-modeler'
  | 'dro-impact'
  | 'service-credit-summary'
  | 'leave-payout'
  | 'early-retirement-reduction'
  | 'ipr-panel'

export interface CompositionResult {
  components: ComponentId[]
  reason: Record<ComponentId, string>
}

// Tier 1 (deterministic): Always-present components
const ALWAYS_PRESENT: ComponentId[] = [
  'member-banner',
  'alert-bar',
  'employment-timeline',
  'salary-table',
  'service-credit-summary',
]

// Tier 1 (deterministic): Components that appear when a retirement date is selected
const WITH_RETIREMENT_DATE: ComponentId[] = [
  'eligibility-panel',
  'benefit-calculation',
  'payment-options',
  'scenario-modeler',
  'ipr-panel',
]

/**
 * Workspace composition engine.
 *
 * Tier 1 (deterministic): Rule-based component selection based on member attributes.
 * Tier 2 (rule-based): Conditional components based on member situation.
 * Tier 3 (AI): Not implemented in POC — system is fully functional without it.
 *
 * AI decides WHAT to show; the rules engine decides WHAT THE NUMBERS ARE.
 */
export function composeWorkspace(
  member: Member,
  _serviceCredit?: ServiceCreditSummary,
  dros?: DRORecord[],
  hasRetirementDate?: boolean,
  reductionFactor?: number
): CompositionResult {
  const components: ComponentId[] = [...ALWAYS_PRESENT]
  const reason: Partial<Record<ComponentId, string>> = {}

  // Always-present reasons
  reason['member-banner'] = 'Always shown — member identification and tier'
  reason['alert-bar'] = 'Always shown — contextual alerts based on member situation'
  reason['employment-timeline'] = 'Always shown — employment history context'
  reason['salary-table'] = 'Always shown — salary data with AMS calculation'
  reason['service-credit-summary'] = 'Always shown — service credit breakdown'

  // Tier 2: Conditional — Leave payout (only Tier 1/2 hired before 2010)
  if (member.tier <= 2 && new Date(member.hire_date) < new Date('2010-01-01')) {
    components.push('leave-payout')
    reason['leave-payout'] = `Tier ${member.tier} member hired ${member.hire_date} (before 2010) — leave payout eligible per RMC §18-412`
  }

  // Tier 2: Conditional — DRO impact (only when DRO exists)
  const hasDRO = dros && dros.length > 0
  if (hasDRO) {
    if (hasRetirementDate) {
      components.push('dro-impact')
      reason['dro-impact'] = `Active DRO found — division calculation shown per RMC §18-420`
    }
  }

  // Components that require a retirement date
  if (hasRetirementDate) {
    components.push(...WITH_RETIREMENT_DATE)
    reason['eligibility-panel'] = 'Retirement date selected — evaluating eligibility'
    reason['benefit-calculation'] = 'Retirement date selected — calculating benefit'
    reason['payment-options'] = 'Retirement date selected — showing payment options'
    reason['scenario-modeler'] = 'Retirement date selected — enabling scenario comparison'
    reason['ipr-panel'] = 'Retirement date selected — calculating IPR'

    // Tier 2: Conditional — Early retirement reduction (only when reduction applies)
    if (reductionFactor !== undefined && reductionFactor < 1.0) {
      components.push('early-retirement-reduction')
      reason['early-retirement-reduction'] = `Reduction factor ${reductionFactor.toFixed(4)} < 1.0 — early retirement reduction applies`
    }
  }

  return { components, reason: reason as Record<ComponentId, string> }
}

/**
 * Validates that the composition result is correct for the demo cases.
 * Used in composition tests to verify correct components appear AND incorrect ones don't.
 */
export function validateComposition(
  result: CompositionResult,
  expectedPresent: ComponentId[],
  expectedAbsent: ComponentId[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const id of expectedPresent) {
    if (!result.components.includes(id)) {
      errors.push(`Expected component '${id}' to be present but it was not`)
    }
  }

  for (const id of expectedAbsent) {
    if (result.components.includes(id)) {
      errors.push(`Expected component '${id}' to be absent but it was present: ${result.reason[id]}`)
    }
  }

  return { valid: errors.length === 0, errors }
}
