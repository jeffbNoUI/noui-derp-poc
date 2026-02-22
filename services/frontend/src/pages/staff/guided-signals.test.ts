/**
 * Confidence signal tests — verifies per-stage signals for all 4 demo cases.
 *
 * TOUCHPOINTS for guided-signals:
 *   Upstream: Member types (ApplicationIntake, ServiceCreditSummary, EligibilityResult, BenefitResult)
 *   Downstream: ProgressBar (renders dots), ExpertMode (renders dots)
 *   Shared: none
 */
import { describe, it, expect } from 'vitest'
import { computeStageSignal, computeAllSignals } from './guided-signals'
import type { SignalContext } from './guided-signals'
import type {
  ApplicationIntake, ServiceCreditSummary, EligibilityResult, BenefitResult,
} from '@/types/Member'

// ─── Shared fixtures ──────────────────────────────────────────

const CASE1_INTAKE: ApplicationIntake = {
  application_received_date: '2026-03-10',
  last_day_worked: '2026-03-31',
  retirement_effective_date: '2026-04-01',
  notarization_confirmed: true,
  notarization_date: '2026-03-10',
  deadline_met: true,
  days_before_last_day: 21,
  payment_cutoff_met: true,
  cutoff_date: '2026-03-15',
  first_payment_date: '2026-04-30',
  combined_payment: false,
  package_complete: true,
  complete_package_date: '2026-03-12',
  documents: [
    { doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Application', required: true, status: 'RECEIVED', received_date: '2026-03-10' },
    { doc_type: 'MARRIAGE_CERT', doc_name: 'Marriage Certificate', required: false, conditional_on: 'Married', status: 'RECEIVED', received_date: '2026-03-10' },
    { doc_type: 'VOIDED_CHECK', doc_name: 'Voided Check', required: true, status: 'RECEIVED', received_date: '2026-03-10' },
  ],
}

const CASE2_INTAKE: ApplicationIntake = {
  ...CASE1_INTAKE,
  application_received_date: '2026-04-08',
  last_day_worked: '2026-04-30',
  retirement_effective_date: '2026-05-01',
  complete_package_date: '2026-04-08',
  // Jennifer Kim is unmarried — no MARRIAGE_CERT document
  documents: [
    { doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Application', required: true, status: 'RECEIVED', received_date: '2026-04-08' },
    { doc_type: 'VOIDED_CHECK', doc_name: 'Voided Check', required: true, status: 'RECEIVED', received_date: '2026-04-08' },
  ],
}

const CASE1_SC: ServiceCreditSummary = {
  total_service_years: 28.75,
  earned_service_years: 28.75,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 28.75,
  total_for_benefit: 28.75,
}

const CASE2_SC: ServiceCreditSummary = {
  total_service_years: 23.92,
  earned_service_years: 20.92,
  purchased_service_years: 3.0,
  military_service_years: 0,
  total_for_eligibility: 20.92,
  total_for_benefit: 23.92,
}

const CASE1_ELIG: EligibilityResult = {
  member_id: '10001',
  retirement_date: '2026-04-01',
  tier: 1,
  age_at_retirement: 63,
  eligible: true,
  retirement_type: 'rule_of_75',
  rule_of_n_value: 91.75,
  rule_of_n_threshold: 75,
  reduction_factor: 1.0,
  conditions_met: ['Rule of 75 met'],
  conditions_unmet: [],
  audit_trail: [],
}

const CASE2_ELIG: EligibilityResult = {
  member_id: '10002',
  retirement_date: '2026-05-01',
  tier: 2,
  age_at_retirement: 55,
  eligible: true,
  retirement_type: 'early',
  rule_of_n_value: 73.17,
  rule_of_n_threshold: 75,
  reduction_factor: 0.70,
  conditions_met: ['Age >= 55'],
  conditions_unmet: ['Rule of 75 not met'],
  audit_trail: [],
}

const CASE1_BENEFIT: BenefitResult = {
  member_id: '10001',
  retirement_date: '2026-04-01',
  tier: 1,
  ams: 10639.45,
  ams_window_months: 36,
  service_years_for_benefit: 28.75,
  multiplier: 0.02,
  gross_annual_benefit: 73361.10,
  gross_monthly_benefit: 6113.43,
  reduction_factor: 1.0,
  retirement_type: 'rule_of_75',
  net_monthly_benefit: 6117.68,
  formula_display: '',
  death_benefit: { amount: 5000, tier: 1, retirement_type: 'rule_of_75' },
  ipr: { annual_amount: 4312.50, monthly_amount: 359.38, rate_per_year: 150, eligible_service_years: 28.75, medicare_eligible: false },
  audit_trail: [],
}

const CASE2_BENEFIT: BenefitResult = {
  member_id: '10002',
  retirement_date: '2026-05-01',
  tier: 2,
  ams: 7347.62,
  ams_window_months: 36,
  service_years_for_benefit: 21.17,
  multiplier: 0.015,
  gross_annual_benefit: 33280.80,
  gross_monthly_benefit: 2773.40,
  reduction_factor: 0.70,
  retirement_type: 'early',
  net_monthly_benefit: 1633.07,
  formula_display: '',
  death_benefit: { amount: 2500, tier: 2, retirement_type: 'early' },
  audit_trail: [],
}

// ─── Tests ───────────────────────────────────────────────────

describe('guided-signals', () => {
  describe('computeStageSignal', () => {

    // Application intake
    it('application-intake: green when package complete', () => {
      const ctx: SignalContext = { intake: CASE1_INTAKE, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('application-intake', ctx).level).toBe('green')
    })

    it('application-intake: amber when package incomplete', () => {
      const incomplete = { ...CASE1_INTAKE, package_complete: false }
      const ctx: SignalContext = { intake: incomplete, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('application-intake', ctx).level).toBe('amber')
    })

    // Member verify — always green for demo data
    it('member-verify: always green', () => {
      const ctx: SignalContext = { electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('member-verify', ctx).level).toBe('green')
    })

    // Service credit
    it('service-credit: green when no purchased service (Case 1)', () => {
      const ctx: SignalContext = { serviceCredit: CASE1_SC, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('service-credit', ctx).level).toBe('green')
    })

    it('service-credit: amber when purchased service exists (Case 2)', () => {
      const ctx: SignalContext = { serviceCredit: CASE2_SC, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      const signal = computeStageSignal('service-credit', ctx)
      expect(signal.level).toBe('amber')
      expect(signal.reason).toContain('Purchased service')
    })

    // Eligibility
    it('eligibility: green when rule met, no reduction (Case 1)', () => {
      const ctx: SignalContext = { eligibility: CASE1_ELIG, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('eligibility', ctx).level).toBe('green')
    })

    it('eligibility: amber when early retirement with reduction (Case 2)', () => {
      const ctx: SignalContext = { eligibility: CASE2_ELIG, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      const signal = computeStageSignal('eligibility', ctx)
      expect(signal.level).toBe('amber')
      expect(signal.reason).toContain('30%')
    })

    // Benefit calc
    it('benefit-calc: amber when leave payout involved (Case 1)', () => {
      const ctx: SignalContext = { benefit: CASE1_BENEFIT, electedOption: 'maximum', leavePayout: 52000, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('benefit-calc', ctx).level).toBe('amber')
    })

    it('benefit-calc: green for standard calculation (Case 2)', () => {
      const ctx: SignalContext = { benefit: CASE2_BENEFIT, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('benefit-calc', ctx).level).toBe('green')
    })

    // Payment options — spousal consent
    it('payment-options: amber when married + Maximum elected (Case 1)', () => {
      const ctx: SignalContext = { intake: CASE1_INTAKE, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      const signal = computeStageSignal('payment-options', ctx)
      expect(signal.level).toBe('amber')
      expect(signal.reason).toContain('spousal consent')
    })

    it('payment-options: green when married + J&S elected', () => {
      const ctx: SignalContext = { intake: CASE1_INTAKE, electedOption: 'j&s_75', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('payment-options', ctx).level).toBe('green')
    })

    it('payment-options: green when unmarried + Maximum elected (Case 2)', () => {
      const ctx: SignalContext = { intake: CASE2_INTAKE, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('payment-options', ctx).level).toBe('green')
    })

    // Supplemental
    it('supplemental: green when full death benefit (Case 1)', () => {
      const ctx: SignalContext = { benefit: CASE1_BENEFIT, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      expect(computeStageSignal('supplemental', ctx).level).toBe('green')
    })

    it('supplemental: amber when reduced death benefit (Case 2)', () => {
      const ctx: SignalContext = { benefit: CASE2_BENEFIT, electedOption: 'maximum', leavePayout: 0, confirmed: new Set(), stageCount: 8 }
      const signal = computeStageSignal('supplemental', ctx)
      expect(signal.level).toBe('amber')
      expect(signal.reason).toContain('$2,500')
    })

    // DRO — always amber
    it('dro: always amber (Case 4)', () => {
      const ctx: SignalContext = { electedOption: 'j&s_75', leavePayout: 0, confirmed: new Set(), stageCount: 9 }
      expect(computeStageSignal('dro', ctx).level).toBe('amber')
    })

    // Review & certify
    it('review-certify: green when all prior confirmed', () => {
      const allConfirmed = new Set(['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental'])
      const ctx: SignalContext = { electedOption: 'maximum', leavePayout: 0, confirmed: allConfirmed, stageCount: 8 }
      expect(computeStageSignal('review-certify', ctx).level).toBe('green')
    })

    it('review-certify: amber when not all prior confirmed', () => {
      const partial = new Set(['application-intake', 'member-verify'])
      const ctx: SignalContext = { electedOption: 'maximum', leavePayout: 0, confirmed: partial, stageCount: 8 }
      const signal = computeStageSignal('review-certify', ctx)
      expect(signal.level).toBe('amber')
      expect(signal.reason).toContain('5 stage(s) not yet confirmed')
    })
  })

  describe('computeAllSignals', () => {
    it('returns signals for all stage IDs', () => {
      const stageIds = ['application-intake', 'member-verify', 'service-credit', 'eligibility', 'benefit-calc', 'payment-options', 'supplemental', 'review-certify']
      const ctx: SignalContext = {
        intake: CASE1_INTAKE,
        serviceCredit: CASE1_SC,
        eligibility: CASE1_ELIG,
        benefit: CASE1_BENEFIT,
        electedOption: 'j&s_75',
        leavePayout: 52000,
        confirmed: new Set(),
        stageCount: 8,
      }
      const signals = computeAllSignals(stageIds, ctx)
      expect(Object.keys(signals)).toEqual(stageIds)
      // Case 1 with J&S 75: service-credit=green, eligibility=green, benefit-calc=amber (leave payout)
      expect(signals['service-credit'].level).toBe('green')
      expect(signals['eligibility'].level).toBe('green')
      expect(signals['benefit-calc'].level).toBe('amber')
    })
  })
})
