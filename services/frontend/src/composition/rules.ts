/**
 * Workspace composition engine — deterministic component selection for COPERA.
 * Consumed by: BenefitWorkspace, composition tests
 * Depends on: Member, ServiceCreditSummary, DRORecord types
 */
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
  | 'anti-spiking-detail'
  | 'early-retirement-reduction'
  | 'annual-increase'

export interface CompositionResult {
  components: ComponentId[]
  reason: Record<ComponentId, string>
}

// Always-present components
const ALWAYS_PRESENT: ComponentId[] = [
  'member-banner',
  'alert-bar',
  'employment-timeline',
  'salary-table',
  'service-credit-summary',
]

// Components that appear when a retirement date is selected
const WITH_RETIREMENT_DATE: ComponentId[] = [
  'eligibility-panel',
  'benefit-calculation',
  'payment-options',
  'scenario-modeler',
  'annual-increase',
]

/**
 * Workspace composition engine.
 *
 * Deterministic rule-based component selection based on member attributes.
 * AI decides WHAT to show; the rules engine decides WHAT THE NUMBERS ARE.
 */
export function composeWorkspace(
  _member: Member,
  _serviceCredit?: ServiceCreditSummary,
  dros?: DRORecord[],
  hasRetirementDate?: boolean,
  reductionFactor?: number,
  antiSpikingApplied?: boolean
): CompositionResult {
  const components: ComponentId[] = [...ALWAYS_PRESENT]
  const reason: Partial<Record<ComponentId, string>> = {}

  // Always-present reasons
  reason['member-banner'] = 'Always shown — member identification and division'
  reason['alert-bar'] = 'Always shown — contextual alerts based on member situation'
  reason['employment-timeline'] = 'Always shown — employment history context'
  reason['salary-table'] = 'Always shown — salary data with HAS calculation'
  reason['service-credit-summary'] = 'Always shown — service credit breakdown'

  // Conditional — Anti-spiking detail (when salary exceeds 108% cap)
  if (antiSpikingApplied) {
    components.push('anti-spiking-detail')
    reason['anti-spiking-detail'] = 'Anti-spiking triggered — salary capped at 108% of prior year per C.R.S. §24-51-101(25.5)'
  }

  // Conditional — DRO impact (only when DRO exists)
  const hasDRO = dros && dros.length > 0
  if (hasDRO) {
    if (hasRetirementDate) {
      components.push('dro-impact')
      reason['dro-impact'] = 'Active DRO found — division calculation shown'
    }
  }

  // Components that require a retirement date
  if (hasRetirementDate) {
    components.push(...WITH_RETIREMENT_DATE)
    reason['eligibility-panel'] = 'Retirement date selected — evaluating eligibility'
    reason['benefit-calculation'] = 'Retirement date selected — calculating benefit'
    reason['payment-options'] = 'Retirement date selected — showing payment options'
    reason['scenario-modeler'] = 'Retirement date selected — enabling scenario comparison'
    reason['annual-increase'] = 'Retirement date selected — showing annual increase projection'

    // Conditional — Early retirement reduction (only when reduction applies)
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
