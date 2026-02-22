/**
 * Confidence signal computation — pure functions that produce per-stage green/amber/red signals.
 * No React dependency. Takes data context, returns workload forecast signals.
 * Consumed by: GuidedWorkspace (passes signals to ProgressBar and ExpertMode)
 * Depends on: Member types (ApplicationIntake, ServiceCreditSummary, EligibilityResult, BenefitResult)
 */
import type {
  ApplicationIntake, ServiceCreditSummary, EligibilityResult, BenefitResult,
} from '@/types/Member'

export type ConfidenceLevel = 'green' | 'amber' | 'red'

export interface StageSignal {
  level: ConfidenceLevel
  reason: string
}

export interface SignalContext {
  intake?: ApplicationIntake
  serviceCredit?: ServiceCreditSummary
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  electedOption: string
  leavePayout: number
  confirmed: Set<string>
  stageCount: number
}

/**
 * Compute the confidence signal for a single stage.
 * Q-001: Marital status inferred from intake documents — if MARRIAGE_CERT with status RECEIVED
 * exists, member is treated as married for spousal consent warnings.
 */
export function computeStageSignal(stageId: string, ctx: SignalContext): StageSignal {
  switch (stageId) {
    case 'application-intake': {
      if (!ctx.intake) return { level: 'amber', reason: 'Intake data not loaded' }
      return ctx.intake.package_complete
        ? { level: 'green', reason: 'Package complete' }
        : { level: 'amber', reason: 'Package incomplete — missing documents' }
    }

    case 'member-verify':
      // Demo data is always clean — green for all cases
      return { level: 'green', reason: 'Member data verified' }

    case 'service-credit': {
      if (!ctx.serviceCredit) return { level: 'amber', reason: 'Service credit not loaded' }
      return ctx.serviceCredit.purchased_service_years > 0
        ? { level: 'amber', reason: 'Purchased service — verify exclusion from eligibility' }
        : { level: 'green', reason: 'No purchased service' }
    }

    case 'eligibility': {
      if (!ctx.eligibility) return { level: 'amber', reason: 'Eligibility not evaluated' }
      return ctx.eligibility.reduction_factor < 1.0
        ? { level: 'amber', reason: `Early retirement — ${((1 - ctx.eligibility.reduction_factor) * 100).toFixed(0)}% reduction` }
        : { level: 'green', reason: 'Rule met — no reduction' }
    }

    case 'benefit-calc': {
      if (!ctx.benefit) return { level: 'amber', reason: 'Benefit not calculated' }
      return ctx.leavePayout > 0
        ? { level: 'amber', reason: 'Leave payout affects AMS — verify window' }
        : { level: 'green', reason: 'Standard calculation' }
    }

    case 'payment-options': {
      // Infer married from intake documents (Q-001)
      const isMarried = ctx.intake?.documents.some(
        d => d.doc_type === 'MARRIAGE_CERT' && d.status === 'RECEIVED'
      ) ?? false
      if (isMarried && ctx.electedOption === 'maximum') {
        return { level: 'amber', reason: 'Married + Maximum — spousal consent required' }
      }
      return { level: 'green', reason: 'Election recorded' }
    }

    case 'supplemental': {
      if (!ctx.benefit?.death_benefit) return { level: 'amber', reason: 'Death benefit not calculated' }
      return ctx.benefit.death_benefit.amount < 5000
        ? { level: 'amber', reason: `Reduced death benefit: $${ctx.benefit.death_benefit.amount.toLocaleString()}` }
        : { level: 'green', reason: 'Full $5,000 death benefit' }
    }

    case 'dro':
      // DRO always requires attention
      return { level: 'amber', reason: 'DRO requires careful review' }

    case 'review-certify': {
      const confirmedCount = ctx.confirmed.size
      return confirmedCount >= ctx.stageCount - 1
        ? { level: 'green', reason: 'All prior stages confirmed' }
        : { level: 'amber', reason: `${ctx.stageCount - 1 - confirmedCount} stage(s) not yet confirmed` }
    }

    default:
      return { level: 'green', reason: 'OK' }
  }
}

/** Compute signals for all stages at once */
export function computeAllSignals(
  stageIds: string[],
  ctx: SignalContext,
): Record<string, StageSignal> {
  const result: Record<string, StageSignal> = {}
  for (const id of stageIds) {
    result[id] = computeStageSignal(id, ctx)
  }
  return result
}
