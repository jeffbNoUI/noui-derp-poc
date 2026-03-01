/**
 * Static fallback composition — used when Claude API is unavailable.
 * Mirrors the logic in frontend composition/rules.ts for COPERA.
 * Consumed by: compose.ts (on API failure)
 * Depends on: types.ts (WorkspaceSpec)
 */

import type { WorkspaceSpec, ComposeRequest } from './types.js'

interface MemberContext {
  division: string
  has_table: number
  has_dros: boolean
  reduction_factor?: number
  anti_spiking_applied?: boolean
}

/** Static composition that mirrors the frontend rules.ts logic. */
export function staticCompose(req: ComposeRequest, member: MemberContext): WorkspaceSpec {
  const stages = []
  const conditional: Record<string, boolean> = {}
  const rationale: Record<string, string> = {}

  // Stage 1: Member Review
  stages.push({
    id: 'member-review',
    label: 'Member Review',
    order: 1,
    components: ['member-banner', 'alert-bar'],
  })
  rationale['member-banner'] = 'Always shown — member identification and division'
  rationale['alert-bar'] = 'Always shown — contextual alerts'

  // Stage 2: Employment & Service
  stages.push({
    id: 'employment-service',
    label: 'Employment & Service',
    order: 2,
    components: ['employment-timeline', 'service-credit-summary'],
  })
  rationale['employment-timeline'] = 'Always shown — employment history context'
  rationale['service-credit-summary'] = 'Always shown — service credit breakdown'

  // Stage 3: Salary & HAS
  const salaryComponents = ['salary-table']
  const antiSpiking = member.anti_spiking_applied ?? false
  conditional['anti-spiking-detail'] = antiSpiking
  if (antiSpiking) {
    salaryComponents.push('anti-spiking-detail')
    rationale['anti-spiking-detail'] = 'Anti-spiking triggered — salary capped at 108% of prior year per C.R.S. §24-51-101(25.5)'
  } else {
    rationale['anti-spiking-detail'] = 'Excluded — no anti-spiking applied'
  }

  stages.push({
    id: 'salary-has',
    label: 'Salary & HAS',
    order: 3,
    components: salaryComponents,
  })
  rationale['salary-table'] = 'Always shown — salary data with HAS calculation'

  if (req.retirement_date) {
    // Stage 4: Eligibility
    stages.push({
      id: 'eligibility',
      label: 'Eligibility',
      order: 4,
      components: ['eligibility-panel'],
    })
    rationale['eligibility-panel'] = 'Retirement date selected — evaluating eligibility'

    // Stage 5: Benefit Calculation
    const benefitComponents = ['benefit-calculation']
    const earlyReduction = member.reduction_factor !== undefined && member.reduction_factor < 1.0
    conditional['early-retirement-reduction'] = earlyReduction
    if (earlyReduction) {
      benefitComponents.push('early-retirement-reduction')
      rationale['early-retirement-reduction'] = `Reduction factor ${member.reduction_factor!.toFixed(4)} < 1.0 — early retirement applies`
    } else {
      rationale['early-retirement-reduction'] = 'Excluded — no early retirement reduction (normal or Rule of N retirement)'
    }

    stages.push({
      id: 'benefit-calculation',
      label: 'Benefit Calculation',
      order: 5,
      components: benefitComponents,
    })
    rationale['benefit-calculation'] = 'Retirement date selected — calculating benefit'

    // Stage 6: Payment Options
    const paymentComponents = ['payment-options']
    conditional['dro-impact'] = member.has_dros
    if (member.has_dros) {
      paymentComponents.push('dro-impact')
      rationale['dro-impact'] = 'Active DRO found — division calculation shown'
    } else {
      rationale['dro-impact'] = 'Excluded — no active Domestic Relations Orders'
    }

    stages.push({
      id: 'payment-options',
      label: 'Payment Options',
      order: 6,
      components: paymentComponents,
    })
    rationale['payment-options'] = `Retirement date selected — showing ${member.division === 'DPS' ? 'DPS Options A/B/P2/P3' : 'PERA Options 1/2/3'}`

    // Stage 7: Scenario Comparison
    stages.push({
      id: 'scenario-comparison',
      label: 'Scenario Comparison',
      order: 7,
      components: ['scenario-modeler'],
    })
    rationale['scenario-modeler'] = 'Retirement date selected — enabling scenario comparison'

    // Stage 8: Annual Increase
    stages.push({
      id: 'annual-increase',
      label: 'Annual Increase',
      order: 8,
      components: ['annual-increase'],
    })
    rationale['annual-increase'] = 'Retirement date selected — showing annual increase projection per C.R.S. §24-51-1001'

    // Stage 9: Review
    stages.push({
      id: 'review-certify',
      label: 'Review & Certify',
      order: 9,
      components: [],
    })
  }

  return {
    stages,
    conditional_components: conditional,
    rationale,
    alerts: [],
    knowledge_context: [],
    composed_by: 'static-fallback',
  }
}
