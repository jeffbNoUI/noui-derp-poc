/**
 * Death & Survivor Benefits demo data verification.
 * Validates cached demo fixtures against hand-calculated expected values from:
 *   demo-cases/case9-thompson-retired-death/calculation.md
 *   demo-cases/case10-active-member-death/calculation.md
 *
 * TOUCHPOINTS:
 *   Upstream: death-survivor-demo-data.ts (fixtures), DeathSurvivor.ts (types)
 *   Downstream: None (test file)
 *   Shared: fmt() (not needed — raw number comparisons)
 */
import { describe, it, expect } from 'vitest'
import {
  case9Member, case9DeathRecord, case9SurvivorClaim, case9DeathBenefitElection,
  case9OverpaymentInfo, case9SurvivorBenefit, case9Installments, case9ProcessingSummary,
  case10Member, case10DeathRecord, case10SurvivorClaim, case10ActiveMemberDeath,
  case10ProcessingSummary,
  deathSurvivorDemoApi,
} from './death-survivor-demo-data.ts'

function expectClose(actual: number, expected: number, label: string, tolerance = 0.01) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}, got ${actual}`,
  ).toBeLessThanOrEqual(tolerance)
}

describe('Death & Survivor Demo Data Verification', () => {

  // ── Case 9: Margaret Thompson — Retired Member Death ─────────────

  describe('Case 9: Margaret Thompson — Retired Tier 1, 75% J&S', () => {

    it('member data is correct', () => {
      expect(case9Member.member_id).toBe('10009')
      expect(case9Member.first_name).toBe('Margaret')
      expect(case9Member.last_name).toBe('Thompson')
      expect(case9Member.has_table).toBeDefined()
      expect(case9Member.status).toBe('Retired')
    })

    it('death record has correct dates', () => {
      expect(case9DeathRecord.death_date).toBe('2026-03-15')
      expect(case9DeathRecord.notification_date).toBe('2026-03-16')
      expect(case9DeathRecord.notification_source).toBe('FAMILY')
      expect(case9DeathRecord.previous_member_status).toBe('R')
      expect(case9DeathRecord.status).toBe('VERIFIED')
    })

    it('survivor claim is 75% J&S for spouse', () => {
      expect(case9SurvivorClaim.survivor_first_name).toBe('William')
      expect(case9SurvivorClaim.survivor_last_name).toBe('Thompson')
      expect(case9SurvivorClaim.survivor_relationship).toBe('SPOUSE')
      expect(case9SurvivorClaim.claim_type).toBe('JS_SURVIVOR')
      expect(case9SurvivorClaim.js_percentage).toBe(75)
      // 75% of $3,248.00 = $2,436.00 — verified against hand calculation
      expectClose(case9SurvivorClaim.monthly_amount, 2436.00, 'survivor monthly')
    })

    it('survivor benefit calculation matches hand calculation TO THE PENNY', () => {
      // $3,248.00 * 75% = $2,436.00
      expectClose(case9SurvivorBenefit.survivor_monthly_benefit, 2436.00, 'survivor benefit')
      expect(case9SurvivorBenefit.js_percentage).toBe(0.75)
      expect(case9SurvivorBenefit.survivor_name).toBe('William Thompson')
      expect(case9SurvivorBenefit.formula).toBe('$3,248.00 x 75% = $2,436.00')
    })

    it('death benefit installments match hand calculation', () => {
      // $5,000 / 100 = $50.00 per installment
      expectClose(case9DeathBenefitElection.installment_amount, 50.00, 'per installment')
      expect(case9DeathBenefitElection.num_installments).toBe(100)
      // Jan 2024 through Mar 2026 = 27 installments paid
      expect(case9DeathBenefitElection.installments_paid).toBe(27)
      expect(case9DeathBenefitElection.installments_remaining).toBe(73)
      // 73 * $50.00 = $3,650.00
      expectClose(case9DeathBenefitElection.remaining_amount, 3650.00, 'remaining')
    })

    it('installment calc result matches election', () => {
      expectClose(case9Installments.installment_amount, 50.00, 'installment amount')
      expect(case9Installments.installments_paid).toBe(27)
      expect(case9Installments.installments_remaining).toBe(73)
      expectClose(case9Installments.remaining_total, 3650.00, 'remaining total')
    })

    it('overpayment is zero — March deposit before March 15 death', () => {
      expect(case9OverpaymentInfo.overpayment_count).toBe(0)
      expectClose(case9OverpaymentInfo.overpayment_total, 0.00, 'overpayment total')
      expect(case9OverpaymentInfo.valid_payments).toBe(3)
      // All three payments valid — deposited before March 15 death
      expect(case9OverpaymentInfo.payment_details.every(p => p.valid)).toBe(true)
    })

    it('processing summary has correct record transition', () => {
      expect(case9ProcessingSummary.notification.status_transition).toBe('RETIRED -> SUSPENDED')
      expect(case9ProcessingSummary.notification.benefit_suspended).toBe(true)
      expect(case9ProcessingSummary.record_transition.status_sequence).toEqual(['RETIRED', 'SUSPENDED', 'DECEASED'])
      expect(case9ProcessingSummary.record_transition.survivor_record_created).toBe(true)
      expect(case9ProcessingSummary.record_transition.benefit_terminated).toBe(false)
    })

    it('calculation trace has all 5 steps', () => {
      expect(case9ProcessingSummary.calculation_trace.length).toBe(5)
      expect(case9ProcessingSummary.calculation_trace[0].rule_id).toBe('RULE-DEATH-NOTIFY')
      expect(case9ProcessingSummary.calculation_trace[1].rule_id).toBe('RULE-OVERPAY-DETECT')
      expect(case9ProcessingSummary.calculation_trace[2].rule_id).toBe('RULE-SURVIVOR-JS')
      expect(case9ProcessingSummary.calculation_trace[3].rule_id).toBe('RULE-DEATH-INSTALLMENTS')
      expect(case9ProcessingSummary.calculation_trace[4].rule_id).toBe('RULE-DEATH-RECORD-TRANSITION')
    })

    it('demo API returns correct death status', async () => {
      const status = await deathSurvivorDemoApi.getDeathStatus('10009')
      expect(status.has_death_record).toBe(true)
      expect(status.death_record?.death_date).toBe('2026-03-15')
      expect(status.survivor_claims.length).toBe(1)
      expect(status.processing_complete).toBe(true)
    })

    it('demo API returns correct processing summary', async () => {
      const summary = await deathSurvivorDemoApi.getProcessingSummary('10009')
      expect(summary.member_id).toBe('10009')
      expectClose(summary.survivor_benefit!.survivor_monthly_benefit, 2436.00, 'api survivor benefit')
    })
  })

  // ── Case 10: James Rivera — Active Member Death ─────────────────

  describe('Case 10: James Rivera — Active Tier 3, Non-Vested', () => {

    it('member data is correct', () => {
      expect(case10Member.member_id).toBe('10010')
      expect(case10Member.first_name).toBe('James')
      expect(case10Member.last_name).toBe('Rivera')
      expect(case10Member.has_table).toBeDefined()
      expect(case10Member.status).toBe('Active')
    })

    it('death record has correct dates', () => {
      expect(case10DeathRecord.death_date).toBe('2026-02-10')
      expect(case10DeathRecord.notification_source).toBe('EMPLOYER')
      expect(case10DeathRecord.previous_member_status).toBe('A')
      expect(case10DeathRecord.status).toBe('VERIFIED')
    })

    it('survivor claim is contribution refund', () => {
      expect(case10SurvivorClaim.survivor_first_name).toBe('Maria')
      expect(case10SurvivorClaim.survivor_last_name).toBe('Rivera')
      expect(case10SurvivorClaim.claim_type).toBe('CONTRIB_REFUND')
      // $13,215.30 + $487.20 = $13,702.50
      expectClose(case10SurvivorClaim.lump_sum_amount!, 13702.50, 'refund amount')
      expect(case10SurvivorClaim.monthly_amount).toBe(0)
    })

    it('active member death result matches hand calculation', () => {
      expect(case10ActiveMemberDeath.benefit_type).toBe('contribution_refund')
      expect(case10ActiveMemberDeath.vested).toBe(false)
      expectClose(case10ActiveMemberDeath.refund_amount!, 13702.50, 'refund')
      expect(case10ActiveMemberDeath.survivor_annuity_available).toBe(false)
      expect(case10ActiveMemberDeath.formula).toBe('Contributions $13,215.30 + Interest $487.20 = $13,702.50 refund')
    })

    it('processing summary has correct record transition', () => {
      expect(case10ProcessingSummary.notification.status_transition).toBe('ACTIVE -> SUSPENDED')
      expect(case10ProcessingSummary.record_transition.status_sequence).toEqual(['ACTIVE', 'SUSPENDED', 'DECEASED'])
      expect(case10ProcessingSummary.record_transition.survivor_record_created).toBe(false)
      expect(case10ProcessingSummary.record_transition.benefit_terminated).toBe(true)
    })

    it('no overpayments for active member', () => {
      expect(case10ProcessingSummary.overpayment.overpayment_count).toBe(0)
      expect(case10ProcessingSummary.overpayment.valid_payments).toBe(0)
    })

    it('calculation trace has all 3 steps', () => {
      expect(case10ProcessingSummary.calculation_trace.length).toBe(3)
      expect(case10ProcessingSummary.calculation_trace[0].rule_id).toBe('RULE-DEATH-NOTIFY')
      expect(case10ProcessingSummary.calculation_trace[1].rule_id).toBe('RULE-ACTIVE-DEATH')
      expect(case10ProcessingSummary.calculation_trace[2].rule_id).toBe('RULE-DEATH-RECORD-TRANSITION')
    })

    it('demo API returns correct death status', async () => {
      const status = await deathSurvivorDemoApi.getDeathStatus('10010')
      expect(status.has_death_record).toBe(true)
      expect(status.survivor_claims.length).toBe(1)
      expect(status.processing_complete).toBe(true)
    })

    it('demo API rejects unknown member gracefully', async () => {
      const status = await deathSurvivorDemoApi.getDeathStatus('99999')
      expect(status.has_death_record).toBe(false)
      expect(status.survivor_claims.length).toBe(0)
    })

    it('demo API rejects unknown processing summary', async () => {
      await expect(deathSurvivorDemoApi.getProcessingSummary('99999'))
        .rejects.toThrow('No death processing summary for 99999')
    })
  })
})
