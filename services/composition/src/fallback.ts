/**
 * Static fallback composition — used when Claude API is unavailable.
 * Mirrors the logic in frontend composition/rules.ts.
 * Consumed by: compose.ts (on API failure)
 * Depends on: types.ts (WorkspaceSpec)
 */

import type { WorkspaceSpec, ComposeRequest } from './types.js'

interface MemberContext {
  tier: number
  hire_date: string
  has_dros: boolean
  reduction_factor?: number
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
  rationale['member-banner'] = 'Always shown — member identification and tier'
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

  // Stage 3: Salary & AMS
  const salaryComponents = ['salary-table']
  const leavePayout = member.tier <= 2 && new Date(member.hire_date) < new Date('2010-01-01')
  conditional['leave-payout'] = leavePayout
  if (leavePayout) {
    salaryComponents.push('leave-payout')
    rationale['leave-payout'] = `Tier ${member.tier} member hired ${member.hire_date} (before 2010) — leave payout eligible per RMC §18-412`
  } else {
    rationale['leave-payout'] = `Excluded — ${member.tier >= 3 ? 'Tier 3 members not eligible' : 'hired on or after 2010-01-01'}`
  }

  stages.push({
    id: 'salary-ams',
    label: 'Salary & AMS',
    order: 3,
    components: salaryComponents,
  })
  rationale['salary-table'] = 'Always shown — salary data with AMS calculation'

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
      rationale['dro-impact'] = 'Active DRO found — division calculation shown per RMC §18-420'
    } else {
      rationale['dro-impact'] = 'Excluded — no active Domestic Relations Orders'
    }

    stages.push({
      id: 'payment-options',
      label: 'Payment Options',
      order: 6,
      components: paymentComponents,
    })
    rationale['payment-options'] = 'Retirement date selected — showing payment options'

    // Stage 7: Scenario Comparison
    stages.push({
      id: 'scenario-comparison',
      label: 'Scenario Comparison',
      order: 7,
      components: ['scenario-modeler'],
    })
    rationale['scenario-modeler'] = 'Retirement date selected — enabling scenario comparison'

    // Stage 8: IPR
    stages.push({
      id: 'ipr',
      label: 'Insurance Premium Reimbursement',
      order: 8,
      components: ['ipr-panel'],
    })
    rationale['ipr-panel'] = 'Retirement date selected — calculating IPR'

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
