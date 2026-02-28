/**
 * Member-specific knowledge enhancements — computes contextual analysis for each
 * DERP provision based on real typed member data. Pure logic, no React.
 * Consumed by: KnowledgeMiniPanel.tsx (utility rail connected mode)
 * Depends on: Member.ts types, constants.ts (fmt)
 */
import type { Member, EligibilityResult, BenefitResult, ServiceCreditSummary } from '@/types/Member'
import { fmt } from '@/lib/constants'

export interface MemberEnhancement {
  label: string   // e.g. "MEMBER ANALYSIS"
  content: string // Multi-line analysis text with actual values
  status: 'met' | 'not-met' | 'caution' | 'info'
}

// ─── Stage relevance mapping ────────────────────────────────
// Stage IDs must match those defined in guided-composition.ts (composeStages)

const STAGE_RELEVANCE: Record<string, string[]> = {
  // Staff retirement workspace stages
  'application-intake': ['application-deadline'],
  'member-verify': ['vesting', 'rule-75', 'rule-85'],
  'service-credit': ['purchased-service-eligibility', 'vesting'],
  'eligibility': ['rule-75', 'rule-85', 'early-retirement', 'early-retirement-tier3'],
  'benefit-calc': ['benefit-formula', 'ams-window', 'leave-payout'],
  'payment-options': ['payment-options', 'spousal-consent'],
  'supplemental': ['lump-sum-death', 'ipr'],
  'dro': ['dro-basics'],
  'review-certify': [],
  // Death processing stages
  'death-notification': ['lump-sum-death'],
  'survivor-determination': ['lump-sum-death', 'payment-options'],
  'survivor-benefit': ['benefit-formula', 'lump-sum-death'],
  'overpayment-review': [],
  'death-benefit-installments': ['lump-sum-death'],
  'processing-review': [],
  // Refund processing stages
  'refund-eligibility': ['vesting'],
  'contribution-summary': [],
  'interest-calculation': [],
  'refund-options': [],
  'vested-decision': ['vesting', 'benefit-formula'],
  'refund-review': [],
  // Portal wizard step IDs (mapped from step index)
  'wizard-personal-info': ['application-deadline'],
  'wizard-retirement-date': ['rule-75', 'rule-85', 'early-retirement', 'early-retirement-tier3'],
  'wizard-benefit-estimate': ['benefit-formula', 'ams-window', 'leave-payout'],
  'wizard-payment-option': ['payment-options', 'spousal-consent'],
  'wizard-death-benefit': ['lump-sum-death'],
  'wizard-insurance-tax': ['ipr'],
  'wizard-review-submit': ['application-deadline'],
}

/** Returns knowledge entry IDs relevant to the given stage */
export function getStageRelevantIds(stageId: string): string[] {
  return STAGE_RELEVANCE[stageId] ?? []
}

// ─── Helpers ────────────────────────────────────────────────

function memberName(m: Member): string {
  return `${m.first_name} ${m.last_name}`
}

// ─── Enhancement logic per provision ────────────────────────

type EnhancementFn = (
  m: Member,
  e?: EligibilityResult,
  b?: BenefitResult,
  sc?: ServiceCreditSummary,
) => MemberEnhancement | null

const enhancers: Record<string, EnhancementFn> = {

  'rule-75': (m, e, _b, sc) => {
    if (m.tier === 3) return null // Rule of 75 doesn't apply to Tier 3
    if (!e || !sc) return null
    const age = e.age_at_retirement
    const earned = sc.earned_service_years
    const sum = e.rule_of_n_value ?? (age + earned)
    const met = sum >= 75 && age >= 55
    return {
      label: 'MEMBER ANALYSIS',
      content: `${memberName(m)} — Age ${age} + ${earned.toFixed(2)}y earned = ${sum.toFixed(2)}. Rule of 75: ${met ? 'MET' : 'NOT MET (need 75, min age 55)'}`,
      status: met ? 'met' : 'not-met',
    }
  },

  'rule-85': (m, e, _b, sc) => {
    if (m.tier !== 3) return null // Rule of 85 only applies to Tier 3
    if (!e || !sc) return null
    const age = e.age_at_retirement
    const earned = sc.earned_service_years
    const sum = e.rule_of_n_value ?? (age + earned)
    const met = sum >= 85 && age >= 60
    return {
      label: 'MEMBER ANALYSIS',
      content: `${memberName(m)} — Age ${age} + ${earned.toFixed(2)}y earned = ${sum.toFixed(2)}. Rule of 85: ${met ? 'MET' : 'NOT MET (need 85, min age 60)'}`,
      status: met ? 'met' : 'not-met',
    }
  },

  'purchased-service-eligibility': (_m, _e, _b, sc) => {
    if (!sc || sc.purchased_service_years === 0) return null
    return {
      label: 'MEMBER ANALYSIS',
      content: `${sc.earned_service_years.toFixed(2)}y earned + ${sc.purchased_service_years.toFixed(2)}y purchased. Purchased excluded from Rule of 75/85 eligibility but included in benefit formula (${sc.total_for_benefit.toFixed(2)}y for benefit calc).`,
      status: 'caution',
    }
  },

  'early-retirement': (m, e) => {
    if (m.tier === 3) return null // Tier 3 uses different provision
    if (!e) return null
    const isEarly = e.retirement_type === 'early'
    const yearsUnder = Math.max(0, Math.floor(65 - e.age_at_retirement))
    if (isEarly) {
      const pct = yearsUnder * 3
      return {
        label: 'MEMBER ANALYSIS',
        content: `${memberName(m)} — Age ${e.age_at_retirement}, ${yearsUnder} year${yearsUnder !== 1 ? 's' : ''} under 65. Reduction: 3% x ${yearsUnder} = ${pct}%.`,
        status: 'not-met',
      }
    }
    return {
      label: 'MEMBER ANALYSIS',
      content: `${memberName(m)} qualifies for unreduced benefits — early retirement reduction does not apply.`,
      status: 'met',
    }
  },

  'early-retirement-tier3': (m, e) => {
    if (m.tier !== 3) return null
    if (!e) return null
    const isEarly = e.retirement_type === 'early'
    const yearsUnder = Math.max(0, Math.floor(65 - e.age_at_retirement))
    if (isEarly) {
      const pct = yearsUnder * 6
      return {
        label: 'MEMBER ANALYSIS',
        content: `${memberName(m)} — Age ${e.age_at_retirement}, ${yearsUnder} year${yearsUnder !== 1 ? 's' : ''} under 65. Tier 3 reduction: 6% x ${yearsUnder} = ${pct}%.`,
        status: 'not-met',
      }
    }
    return {
      label: 'MEMBER ANALYSIS',
      content: `${memberName(m)} qualifies for unreduced benefits — Tier 3 early retirement reduction does not apply.`,
      status: 'met',
    }
  },

  'benefit-formula': (m, _e, b) => {
    if (!b) return null
    const pct = (b.multiplier * 100).toFixed(1)
    return {
      label: 'MEMBER ANALYSIS',
      content: `${memberName(m)} — ${pct}% x ${fmt(b.ams)} x ${b.service_years_for_benefit.toFixed(2)}y = ${fmt(b.gross_monthly_benefit)}/mo gross${b.reduction_factor < 1 ? ` (${fmt(b.net_monthly_benefit)}/mo after ${Math.round((1 - b.reduction_factor) * 100)}% reduction)` : ''}.`,
      status: 'info',
    }
  },

  'ams-window': (m, _e, b) => {
    if (!b) return null
    const window = m.tier === 3 ? 60 : 36
    return {
      label: 'MEMBER ANALYSIS',
      content: `Tier ${m.tier}: highest ${window} consecutive months. AMS = ${fmt(b.ams)}.`,
      status: 'info',
    }
  },

  'leave-payout': (m) => {
    const hireDate = new Date(m.hire_date)
    const cutoff = new Date('2010-01-01')
    const eligible = hireDate < cutoff
    return {
      label: 'MEMBER ANALYSIS',
      content: eligible
        ? `${memberName(m)} hired ${m.hire_date} (before 2010) — eligible for leave payout inclusion in AMS.`
        : `${memberName(m)} hired ${m.hire_date} (on/after 2010) — not eligible for leave payout.`,
      status: eligible ? 'met' : 'not-met',
    }
  },

  'vesting': (_m, _e, _b, sc) => {
    if (!sc) return null
    const vested = sc.earned_service_years >= 5
    return {
      label: 'MEMBER ANALYSIS',
      content: `${sc.earned_service_years.toFixed(2)} years earned service. Vesting (5y): ${vested ? 'MET' : 'NOT MET'}.`,
      status: vested ? 'met' : 'not-met',
    }
  },

  'payment-options': (_m, _e, b) => {
    if (!b) return null
    return {
      label: 'MEMBER ANALYSIS',
      content: `Base monthly benefit for option calculation: ${fmt(b.net_monthly_benefit)}.`,
      status: 'info',
    }
  },

  'dro-basics': () => {
    // DRO records are not part of the enhancement data contract — the existence
    // of active DROs is already visible via the DRO badge in the member banner
    return null
  },

  'lump-sum-death': (_m, _e, b) => {
    if (!b?.death_benefit) return null
    return {
      label: 'MEMBER ANALYSIS',
      content: `Death benefit: ${fmt(b.death_benefit.amount)} (${b.death_benefit.retirement_type} retirement).`,
      status: 'info',
    }
  },

  'ipr': (_m, _e, b) => {
    if (!b?.ipr) return null
    return {
      label: 'MEMBER ANALYSIS',
      content: `IPR: ${fmt(b.ipr.monthly_amount)}/mo (${fmt(b.ipr.rate_per_year)}/yr x ${b.ipr.eligible_service_years.toFixed(2)}y earned). ${b.ipr.medicare_eligible ? 'Medicare-eligible rate.' : 'Non-Medicare rate.'}`,
      status: 'info',
    }
  },

  'application-deadline': (_m, e) => {
    if (!e) return null
    return {
      label: 'MEMBER ANALYSIS',
      content: `Retirement date: ${e.retirement_date}. Application must be received within 30 days of last day worked.`,
      status: 'info',
    }
  },

  'spousal-consent': (m) => {
    return {
      label: 'MEMBER ANALYSIS',
      content: `Tier ${m.tier} member — if married, spouse must consent to any option other than 50%+ J&S with spouse as beneficiary.`,
      status: 'caution',
    }
  },
}

/** Compute a member-specific enhancement for a knowledge entry */
export function getMemberEnhancement(
  entryId: string,
  member: Member,
  eligibility?: EligibilityResult,
  benefit?: BenefitResult,
  serviceCredit?: ServiceCreditSummary,
): MemberEnhancement | null {
  const fn = enhancers[entryId]
  if (!fn) return null
  return fn(member, eligibility, benefit, serviceCredit)
}
