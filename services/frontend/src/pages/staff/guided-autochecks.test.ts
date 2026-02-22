/**
 * Tests for guided-autochecks — verifies auto-check logic for each stage.
 * TOUCHPOINTS:
 *   Upstream: Member types, guided-help.ts (checklist definitions)
 *   Downstream: GuidedWorkspace, ExpertMode (consumers of auto-checks)
 *   Shared: Member.ts types
 */
import { describe, it, expect } from 'vitest'
import { computeAutoChecks, computeAllAutoChecks, mergeChecks } from './guided-autochecks'
import type { AutoCheckContext } from './guided-autochecks'

const baseCtx: AutoCheckContext = {
  member: undefined,
  intake: undefined,
  serviceCredit: undefined,
  eligibility: undefined,
  benefit: undefined,
  paymentOptions: undefined,
  droCalc: undefined,
  leavePayout: 0,
  electedOption: '',
  retirementDate: '',
}

describe('computeAutoChecks', () => {
  describe('application-intake', () => {
    it('returns empty when no intake data', () => {
      expect(computeAutoChecks('application-intake', baseCtx).size).toBe(0)
    })

    it('auto-checks all items when intake is complete', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        intake: {
          application_received_date: '2026-03-01',
          last_day_worked: '2026-03-31',
          retirement_effective_date: '2026-04-01',
          notarization_confirmed: true,
          notarization_date: '2026-03-01',
          deadline_met: true,
          days_before_last_day: 30,
          payment_cutoff_met: true,
          cutoff_date: '2026-03-15',
          first_payment_date: '2026-05-01',
          combined_payment: false,
          documents: [],
          package_complete: true,
          complete_package_date: '2026-03-01',
        },
      }
      const auto = computeAutoChecks('application-intake', ctx)
      expect(auto).toEqual(new Set([0, 1, 2, 3]))
    })

    it('skips items that are not met', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        intake: {
          application_received_date: '2026-03-01',
          last_day_worked: '2026-03-31',
          retirement_effective_date: '2026-04-01',
          notarization_confirmed: true,
          notarization_date: '2026-03-01',
          deadline_met: true,
          days_before_last_day: 30,
          payment_cutoff_met: false,
          cutoff_date: '2026-03-15',
          first_payment_date: '2026-05-01',
          combined_payment: false,
          documents: [],
          package_complete: false,
          complete_package_date: null,
        },
      }
      const auto = computeAutoChecks('application-intake', ctx)
      expect(auto.has(0)).toBe(true)  // notarization
      expect(auto.has(1)).toBe(true)  // deadline
      expect(auto.has(2)).toBe(false) // package not complete
      expect(auto.has(3)).toBe(false) // cutoff not met
    })
  })

  describe('member-verify', () => {
    it('returns empty when no member data', () => {
      expect(computeAutoChecks('member-verify', baseCtx).size).toBe(0)
    })

    it('auto-checks all items for valid Tier 1 member', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        member: {
          member_id: '10001', first_name: 'Robert', last_name: 'Martinez',
          date_of_birth: '1963-03-08', hire_date: '1997-06-15', tier: 1,
          status: 'Active', department: 'Public Works', position: 'Senior Engineer',
        },
      }
      const auto = computeAutoChecks('member-verify', ctx)
      expect(auto).toEqual(new Set([0, 1, 2, 3]))
    })

    it('skips tier check when tier does not match hire date', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        member: {
          member_id: '99999', first_name: 'Test', last_name: 'User',
          date_of_birth: '1980-01-01', hire_date: '2005-01-01', tier: 1, // Should be Tier 2
          status: 'Active', department: 'Test', position: 'Test',
        },
      }
      const auto = computeAutoChecks('member-verify', ctx)
      expect(auto.has(0)).toBe(true)  // name/ID match
      expect(auto.has(1)).toBe(false) // tier mismatch!
      expect(auto.has(2)).toBe(true)  // employment history
      expect(auto.has(3)).toBe(true)  // no DQ flags
    })
  })

  describe('service-credit', () => {
    it('auto-checks vesting when met', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        serviceCredit: {
          earned_service_years: 15.5, purchased_service_years: 3.0,
          military_service_years: 0, total_service_years: 18.5,
          total_for_benefit: 18.5, total_for_eligibility: 15.5,
        },
      }
      const auto = computeAutoChecks('service-credit', ctx)
      expect(auto).toEqual(new Set([0, 1, 2, 3]))
    })

    it('skips vesting when not met', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        serviceCredit: {
          earned_service_years: 3.0, purchased_service_years: 0,
          military_service_years: 0, total_service_years: 3.0,
          total_for_benefit: 3.0, total_for_eligibility: 3.0,
        },
      }
      const auto = computeAutoChecks('service-credit', ctx)
      expect(auto.has(2)).toBe(false) // not vested
    })
  })

  describe('eligibility', () => {
    it('auto-checks all items when eligibility and date are set', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        retirementDate: '2026-04-01',
        eligibility: {
          member_id: '10001', tier: 1,
          eligible: true, retirement_type: 'rule_of_75',
          conditions_met: ['Vested'], conditions_unmet: [],
          retirement_date: '2026-04-01', age_at_retirement: 63,
          rule_of_n_value: 91.8, rule_of_n_threshold: 75,
          reduction_factor: 1.0, audit_trail: [],
        },
      }
      const auto = computeAutoChecks('eligibility', ctx)
      expect(auto).toEqual(new Set([0, 1, 2, 3]))
    })
  })

  describe('benefit-calc', () => {
    it('auto-checks all except salary match for Tier 1', () => {
      const ctx: AutoCheckContext = {
        ...baseCtx,
        member: {
          member_id: '10001', first_name: 'R', last_name: 'M',
          date_of_birth: '1963-03-08', hire_date: '1997-06-15', tier: 1,
          status: 'Active', department: 'PW', position: 'Eng',
        },
        benefit: {
          member_id: '10001', retirement_date: '2026-04-01', tier: 1,
          ams: 10639.45, ams_window_months: 36,
          multiplier: 0.02, service_years_for_benefit: 28.75,
          gross_annual_benefit: 73412.16, gross_monthly_benefit: 6117.68,
          net_monthly_benefit: 6117.68, retirement_type: 'rule_of_75',
          reduction_factor: 1.0, formula_display: '', audit_trail: [],
        },
      }
      const auto = computeAutoChecks('benefit-calc', ctx)
      expect(auto.has(0)).toBe(true)  // AMS window
      expect(auto.has(1)).toBe(false) // salary match — manual
      expect(auto.has(2)).toBe(true)  // leave payout (0, trivially correct)
      expect(auto.has(3)).toBe(true)  // multiplier matches tier
      expect(auto.has(4)).toBe(true)  // final benefit
    })
  })

  describe('review-certify', () => {
    it('only auto-checks election when set', () => {
      const ctx: AutoCheckContext = { ...baseCtx, electedOption: 'maximum' }
      const auto = computeAutoChecks('review-certify', ctx)
      expect(auto).toEqual(new Set([1]))
    })

    it('auto-checks nothing when no election', () => {
      const auto = computeAutoChecks('review-certify', baseCtx)
      expect(auto.size).toBe(0)
    })
  })
})

describe('computeAllAutoChecks', () => {
  it('computes auto-checks for all provided stage IDs', () => {
    const result = computeAllAutoChecks(['application-intake', 'member-verify'], baseCtx)
    expect(result['application-intake']).toBeInstanceOf(Set)
    expect(result['member-verify']).toBeInstanceOf(Set)
  })
})

describe('mergeChecks', () => {
  it('unions auto and manual checks', () => {
    const auto = new Set([0, 1])
    const manual = new Set([2, 3])
    const merged = mergeChecks(auto, manual)
    expect(merged).toEqual(new Set([0, 1, 2, 3]))
  })

  it('deduplicates overlapping items', () => {
    const auto = new Set([0, 1, 2])
    const manual = new Set([1, 2, 3])
    const merged = mergeChecks(auto, manual)
    expect(merged).toEqual(new Set([0, 1, 2, 3]))
    expect(merged.size).toBe(4)
  })
})
