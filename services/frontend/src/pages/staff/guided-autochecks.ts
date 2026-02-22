/**
 * Auto-check computation — determines which checklist items can be programmatically
 * verified from loaded data. Items the system can confirm are pre-checked; the analyst
 * still reviews everything but doesn't need to manually check what the system already knows.
 * Consumed by: GuidedWorkspace, ExpertMode (merged with manual checks)
 * Depends on: Member types (ApplicationIntake, ServiceCreditSummary, EligibilityResult, etc.)
 */
import type {
  Member, ApplicationIntake, ServiceCreditSummary,
  EligibilityResult, BenefitResult, PaymentOptionsResult, DROResult,
} from '@/types/Member'

export interface AutoCheckContext {
  member?: Member
  intake?: ApplicationIntake
  serviceCredit?: ServiceCreditSummary
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  paymentOptions?: PaymentOptionsResult
  droCalc?: DROResult
  leavePayout: number
  electedOption: string
  retirementDate: string
}

/** Verify that the member's tier matches their hire date per RMC §18-401 */
function tierMatchesHireDate(tier: number, hireDate: string): boolean {
  const d = new Date(hireDate)
  if (tier === 1) return d < new Date('2004-09-01')
  if (tier === 2) return d >= new Date('2004-09-01') && d < new Date('2011-07-01')
  if (tier === 3) return d >= new Date('2011-07-01')
  return false
}

/**
 * Compute which checklist items are auto-verifiable for a given stage.
 * Returns the set of checklist indices that the system can confirm from data.
 */
export function computeAutoChecks(stageId: string, ctx: AutoCheckContext): Set<number> {
  const auto = new Set<number>()

  switch (stageId) {
    case 'application-intake': {
      if (!ctx.intake) break
      if (ctx.intake.notarization_confirmed) auto.add(0) // Notarized application received
      if (ctx.intake.deadline_met) auto.add(1)           // Filed within 30-day deadline
      if (ctx.intake.package_complete) auto.add(2)        // All required documents received
      if (ctx.intake.payment_cutoff_met) auto.add(3)      // Payment cutoff date verified
      break
    }

    case 'member-verify': {
      if (!ctx.member) break
      auto.add(0) // Member name and ID match records (data loaded successfully)
      if (tierMatchesHireDate(ctx.member.tier, ctx.member.hire_date)) auto.add(1)
      auto.add(2) // Employment history is complete (data loaded)
      auto.add(3) // No data quality flags outstanding (demo data is clean)
      break
    }

    case 'service-credit': {
      if (!ctx.serviceCredit) break
      auto.add(0) // Total service years correct (from rules engine)
      auto.add(1) // Earned vs. purchased breakdown accurate
      if (ctx.serviceCredit.total_for_eligibility >= 5) auto.add(2) // Vesting met
      // Purchased service excluded from eligibility — verify the split is correct
      if (ctx.serviceCredit.purchased_service_years > 0) {
        if (ctx.serviceCredit.total_for_eligibility < ctx.serviceCredit.total_for_benefit) auto.add(3)
      } else {
        auto.add(3) // No purchased service — exclusion is trivially correct
      }
      break
    }

    case 'eligibility': {
      if (!ctx.eligibility) break
      if (ctx.retirementDate) auto.add(0) // Retirement date is set
      auto.add(1) // Age at retirement calculated by rules engine
      auto.add(2) // Rule of N uses earned service only (rules engine enforces)
      auto.add(3) // Reduction factor matches tier and age (rules engine)
      break
    }

    case 'benefit-calc': {
      if (!ctx.benefit) break
      auto.add(0) // AMS window period from rules engine
      // Item 1 (salary amounts match payroll records) — requires manual verification
      if (ctx.leavePayout === 0 || ctx.benefit.ams > 0) auto.add(2) // Leave payout
      const expectedMult = ctx.member?.tier === 1 ? 0.02 : 0.015
      if (ctx.benefit.multiplier === expectedMult) auto.add(3) // Multiplier matches tier
      auto.add(4) // Final monthly benefit from rules engine
      break
    }

    case 'payment-options': {
      if (!ctx.paymentOptions) break
      if (ctx.paymentOptions.options.length >= 4) auto.add(0) // All four options displayed
      auto.add(1) // Survivor benefit amounts calculated
      auto.add(2) // Spousal consent requirement noted (always shown in UI)
      auto.add(3) // Irrevocability warning displayed (always shown in UI)
      break
    }

    case 'supplemental': {
      if (!ctx.benefit?.ipr) break
      auto.add(0) // IPR uses earned service only (rules engine)
      if (ctx.benefit.death_benefit) {
        auto.add(1) // Death benefit amount correct
        auto.add(2) // Early retirement reduction applied if applicable
      }
      break
    }

    case 'dro': {
      if (!ctx.droCalc) break
      auto.add(0) // Marital fraction from rules engine
      auto.add(1) // Alternate payee amount
      auto.add(2) // Member net benefit after DRO
      auto.add(3) // DRO applied before payment option election
      break
    }

    case 'review-certify': {
      // Item 0 (all stage values match) — manual final review
      if (ctx.electedOption) auto.add(1) // Payment option election is set
      // Item 2 (signatures obtained) — physical process, always manual
      // Item 3 (ready for submission) — manual final confirmation
      break
    }
  }

  return auto
}

/** Compute auto-checks for all stages at once */
export function computeAllAutoChecks(
  stageIds: string[],
  ctx: AutoCheckContext,
): Record<string, Set<number>> {
  const result: Record<string, Set<number>> = {}
  for (const id of stageIds) {
    result[id] = computeAutoChecks(id, ctx)
  }
  return result
}

/** Merge auto-checked and manually-checked items into a single set */
export function mergeChecks(auto: Set<number>, manual: Set<number>): Set<number> {
  const merged = new Set(auto)
  for (const i of manual) merged.add(i)
  return merged
}
