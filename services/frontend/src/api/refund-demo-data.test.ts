/**
 * Refund demo data verification — validates refund fixtures against hand-calculated oracle values.
 * Verifies Cases 7 (Santos) and 8 (Chen) match the expected results TO THE PENNY.
 *
 * TOUCHPOINTS for refund-demo-data.test.ts:
 *   Upstream: refund-demo-data.ts (fixtures), types/Refund.ts (interfaces)
 *   Downstream: None (leaf test)
 *   Shared: fmt() (not directly used — tests raw numeric values)
 */
import { describe, it, expect } from 'vitest'
import { refundDemoApi, DEMO_REFUND_MEMBERS, DEMO_REFUND_CALCULATIONS } from './refund-demo-data'

function expectClose(actual: number, expected: number, label: string, tolerance = 0.01) {
  expect(
    Math.abs(actual - expected),
    `${label}: expected ${expected}, got ${actual} (diff ${Math.abs(actual - expected).toFixed(4)})`
  ).toBeLessThanOrEqual(tolerance)
}

describe('Refund Demo Data Verification', () => {
  describe('Case 7: Maria Santos — Non-Vested Tier 2 Refund', () => {
    it('member data is correct', async () => {
      const m = await refundDemoApi.getRefundMember('10007')
      expect(m.first_name).toBe('Maria')
      expect(m.last_name).toBe('Santos')
      expect(m.tier).toBe(2)
      expect(m.status).toBe('Terminated')
      expect(m.termination_date).toBe('2026-01-31')
    })

    it('eligibility determination is correct', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      const e = r.eligibility
      expect(e.eligible).toBe(true)
      expect(e.vested).toBe(false)
      expect(e.forfeiture_required).toBe(false)
      expect(e.waiting_period_met).toBe(true)
      expectClose(e.service_years, 3.83, 'service_years')
      expect(e.days_since_termination).toBe(90)
    })

    it('contribution total matches hand calculation: $17,988.89', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expectClose(r.contributions.total_contributions, 17988.89, 'total_contributions')
      expect(r.contributions.month_count).toBe(46)
    })

    it('contribution detail has 46 monthly entries', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expect(r.contributions.monthly_detail.length).toBe(46)
    })

    it('contribution detail running totals are monotonically increasing', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      const detail = r.contributions.monthly_detail
      for (let i = 1; i < detail.length; i++) {
        expect(detail[i].running_total).toBeGreaterThan(detail[i - 1].running_total)
      }
    })

    it('interest total matches hand calculation: $650.14', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expectClose(r.interest.total_interest, 650.14, 'total_interest')
      expect(r.interest.credits.length).toBe(3)
      expect(r.interest.interest_rate).toBe(0.02)
    })

    it('interest compounding dates are all June 30', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      for (const credit of r.interest.credits) {
        expect(credit.date).toMatch(/-06-30$/)
      }
    })

    it('gross refund matches hand calculation: $18,639.03', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expectClose(r.gross_refund, 18639.03, 'gross_refund')
      // Verify gross = contributions + interest
      expectClose(
        r.contributions.total_contributions + r.interest.total_interest,
        r.gross_refund,
        'gross_refund_sum'
      )
    })

    it('direct payment tax withholding: 20% = $3,727.81', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      const direct = r.tax_options.find(o => o.election_type === 'direct_payment')!
      expect(direct).toBeDefined()
      expectClose(direct.withholding_rate, 0.20, 'withholding_rate')
      expectClose(direct.withholding_amount, 3727.81, 'withholding_amount')
      expectClose(direct.net_payment, 14911.22, 'net_payment')
    })

    it('direct rollover has zero withholding', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      const rollover = r.tax_options.find(o => o.election_type === 'direct_rollover')!
      expect(rollover).toBeDefined()
      expect(rollover.withholding_rate).toBe(0)
      expect(rollover.withholding_amount).toBe(0)
      expectClose(rollover.net_payment, 18639.03, 'rollover_net')
    })

    it('has no deferred comparison (non-vested)', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expect(r.deferred_comparison).toBeUndefined()
    })

    it('audit trail has correct rule entries', async () => {
      const r = await refundDemoApi.calculateRefund('10007')
      expect(r.audit_trail.length).toBeGreaterThanOrEqual(5)
      const ruleIds = r.audit_trail.map(e => e.rule_id)
      expect(ruleIds).toContain('RULE-REFUND-WAIT')
      expect(ruleIds).toContain('RULE-REFUND-VESTED')
      expect(ruleIds).toContain('RULE-REFUND-CONTRIB')
      expect(ruleIds).toContain('RULE-REFUND-INTEREST')
      expect(ruleIds).toContain('RULE-REFUND-GROSS')
    })
  })

  describe('Case 8: Thomas Chen — Vested Tier 1 Refund with Forfeiture', () => {
    it('member data is correct', async () => {
      const m = await refundDemoApi.getRefundMember('10008')
      expect(m.first_name).toBe('Thomas')
      expect(m.last_name).toBe('Chen')
      expect(m.tier).toBe(1)
      expect(m.status).toBe('Terminated')
      expect(m.termination_date).toBe('2025-06-30')
    })

    it('eligibility: vested with forfeiture required', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      const e = r.eligibility
      expect(e.eligible).toBe(true)
      expect(e.vested).toBe(true)
      expect(e.forfeiture_required).toBe(true)
      expect(e.waiting_period_met).toBe(true)
      expectClose(e.service_years, 7.08, 'service_years')
    })

    it('contribution total matches hand calculation: $45,333.41', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      expectClose(r.contributions.total_contributions, 45333.41, 'total_contributions')
      expect(r.contributions.month_count).toBe(85)
    })

    it('interest total matches hand calculation: $3,668.21', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      expectClose(r.interest.total_interest, 3668.21, 'total_interest')
      expect(r.interest.credits.length).toBe(7)
    })

    it('gross refund matches hand calculation: $49,001.62', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      expectClose(r.gross_refund, 49001.62, 'gross_refund')
    })

    it('direct payment tax withholding: 20% = $9,800.32', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      const direct = r.tax_options.find(o => o.election_type === 'direct_payment')!
      expect(direct).toBeDefined()
      expectClose(direct.withholding_amount, 9800.32, 'withholding_amount')
      expectClose(direct.net_payment, 39201.30, 'net_payment')
    })

    it('has deferred comparison (vested member)', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      expect(r.deferred_comparison).toBeDefined()
      const dc = r.deferred_comparison!
      expectClose(dc.refund_gross, 49001.62, 'deferred_refund_gross')
      expectClose(dc.deferred_monthly_at_65, 1028.45, 'monthly_at_65')
      expectClose(dc.deferred_annual_at_65, 12341.40, 'annual_at_65')
      expect(dc.years_to_age_65).toBe(21)
      expectClose(dc.breakeven_years_after_65, 4.0, 'breakeven')
      expectClose(dc.lifetime_value_at_85, 246828.00, 'lifetime_85')
    })

    it('audit trail includes deferred comparison rule', async () => {
      const r = await refundDemoApi.calculateRefund('10008')
      const ruleIds = r.audit_trail.map(e => e.rule_id)
      expect(ruleIds).toContain('RULE-REFUND-DEFERRED')
    })
  })

  describe('Type conformance', () => {
    it('all demo members have required fields', () => {
      for (const [id, m] of Object.entries(DEMO_REFUND_MEMBERS)) {
        expect(m.member_id).toBe(id)
        expect(m.first_name).toBeTruthy()
        expect(m.last_name).toBeTruthy()
        expect(m.status).toBe('Terminated')
        expect(m.termination_date).toBeTruthy()
      }
    })

    it('all calculations have required fields', () => {
      for (const [id, r] of Object.entries(DEMO_REFUND_CALCULATIONS)) {
        expect(r.member_id).toBe(id)
        expect(r.eligibility).toBeDefined()
        expect(r.contributions).toBeDefined()
        expect(r.interest).toBeDefined()
        expect(r.gross_refund).toBeGreaterThan(0)
        expect(r.tax_options.length).toBeGreaterThan(0)
        expect(r.audit_trail.length).toBeGreaterThan(0)
      }
    })

    it('gross refund equals contributions + interest for all cases', () => {
      for (const [id, r] of Object.entries(DEMO_REFUND_CALCULATIONS)) {
        expectClose(
          r.contributions.total_contributions + r.interest.total_interest,
          r.gross_refund,
          `case_${id}_gross_sum`
        )
      }
    })

    it('interest credits balance_after = balance_before + interest_amount', () => {
      for (const [id, r] of Object.entries(DEMO_REFUND_CALCULATIONS)) {
        for (const credit of r.interest.credits) {
          expectClose(
            credit.balance_before + credit.interest_amount,
            credit.balance_after,
            `case_${id}_credit_${credit.date}`
          )
        }
      }
    })

    it('tax withholding net = gross - withholding for direct payments', () => {
      for (const [id, r] of Object.entries(DEMO_REFUND_CALCULATIONS)) {
        for (const opt of r.tax_options) {
          if (opt.election_type === 'direct_payment') {
            expectClose(
              opt.gross_refund - opt.withholding_amount,
              opt.net_payment,
              `case_${id}_direct_net`
            )
          }
        }
      }
    })
  })

  describe('API error handling', () => {
    it('rejects unknown member ID', async () => {
      await expect(refundDemoApi.getRefundMember('99999')).rejects.toThrow()
    })

    it('rejects unknown calculation ID', async () => {
      await expect(refundDemoApi.calculateRefund('99999')).rejects.toThrow()
    })
  })
})
