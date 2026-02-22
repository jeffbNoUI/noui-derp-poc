/**
 * Demo data verification — validates cached demo fixtures against expected values.
 * This is the Day 14 "verification job" ensuring all cases are correct.
 */
import { describe, it, expect } from 'vitest'
import { demoApi } from './demo-data'

function expectClose(actual: number, expected: number, _label: string, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe('Demo Data Verification', () => {
  describe('Case 1: Robert Martinez — Tier 1, Rule of 75', () => {
    it('member data is correct', async () => {
      const m = await demoApi.getMember('10001')
      expect(m.first_name).toBe('Robert')
      expect(m.last_name).toBe('Martinez')
      expect(m.tier).toBe(1)
    })

    it('eligibility is Rule of 75', async () => {
      const e = await demoApi.evaluateEligibility('10001', '2026-04-01')
      expect(e.eligible).toBe(true)
      expect(e.retirement_type).toBe('rule_of_75')
      expect(e.reduction_factor).toBe(1.0)
      expectClose(e.rule_of_n_value!, 91.75, 'rule_sum')
    })

    it('benefit matches hand calculation', async () => {
      const b = await demoApi.calculateBenefit('10001', '2026-04-01')
      expectClose(b.ams, 10639.45, 'AMS')
      expect(b.multiplier).toBe(0.02)
      expectClose(b.service_years_for_benefit, 28.75, 'service_years')
      expectClose(b.net_monthly_benefit, 6117.68, 'net_benefit')
      expect(b.death_benefit!.amount).toBe(5000)
    })

    it('payment options are correct', async () => {
      const p = await demoApi.calculatePaymentOptions('10001', '2026-04-01')
      expectClose(p.base_monthly_benefit, 6117.68, 'base')
      const js75 = p.options.find(o => o.option_type === 'j&s_75')!
      expectClose(js75.monthly_amount, 5597.68, 'j&s_75')
    })

    it('IPR correct', async () => {
      const b = await demoApi.calculateBenefit('10001', '2026-04-01')
      expect(b.ipr).toBeDefined()
      expectClose(b.ipr!.monthly_amount, 359.38, 'ipr_monthly')
    })
  })

  describe('Case 2: Jennifer Kim — Tier 2, Early Retirement, Purchased Service', () => {
    it('member data is correct', async () => {
      const m = await demoApi.getMember('10002')
      expect(m.first_name).toBe('Jennifer')
      expect(m.last_name).toBe('Kim')
      expect(m.tier).toBe(2)
    })

    it('service credit separates purchased correctly', async () => {
      const sc = await demoApi.getServiceCredit('10002')
      expectClose(sc.earned_service_years, 18.17, 'earned')
      expectClose(sc.purchased_service_years, 3.00, 'purchased')
      expectClose(sc.total_for_benefit, 21.17, 'total_benefit')
      expectClose(sc.total_for_eligibility, 18.17, 'total_elig')
    })

    it('eligibility is early with 30% reduction', async () => {
      const e = await demoApi.evaluateEligibility('10002', '2026-05-01')
      expect(e.eligible).toBe(true)
      expect(e.retirement_type).toBe('early')
      expectClose(e.reduction_factor, 0.70, 'factor')
      expectClose(e.rule_of_n_value!, 73.17, 'rule_sum')
    })

    it('benefit matches hand calculation', async () => {
      const b = await demoApi.calculateBenefit('10002', '2026-05-01')
      expectClose(b.ams, 7347.62, 'AMS')
      expectClose(b.gross_monthly_benefit, 2332.96, 'unreduced')
      expectClose(b.net_monthly_benefit, 1633.07, 'reduced')
      expect(b.death_benefit!.amount).toBe(2500)
    })

    it('IPR uses earned service only', async () => {
      const b = await demoApi.calculateBenefit('10002', '2026-05-01')
      expectClose(b.ipr!.eligible_service_years, 18.17, 'ipr_years')
      expectClose(b.ipr!.monthly_amount, 227.13, 'ipr_monthly')
    })
  })

  describe('Case 3: David Washington — Tier 3, Early Retirement', () => {
    it('member data is correct', async () => {
      const m = await demoApi.getMember('10003')
      expect(m.first_name).toBe('David')
      expect(m.last_name).toBe('Washington')
      expect(m.tier).toBe(3)
    })

    it('uses 60-month AMS window', async () => {
      const b = await demoApi.calculateBenefit('10003', '2026-04-01')
      expect(b.ams_window_months).toBe(60)
    })

    it('eligibility is early with 12% reduction', async () => {
      const e = await demoApi.evaluateEligibility('10003', '2026-04-01')
      expect(e.eligible).toBe(true)
      expect(e.retirement_type).toBe('early')
      expectClose(e.reduction_factor, 0.88, 'factor')
      expect(e.rule_of_n_threshold).toBe(85)
    })

    it('benefit matches hand calculation', async () => {
      const b = await demoApi.calculateBenefit('10003', '2026-04-01')
      expectClose(b.ams, 6684.52, 'AMS')
      expectClose(b.gross_monthly_benefit, 1361.40, 'unreduced')
      expectClose(b.net_monthly_benefit, 1198.03, 'reduced')
      expect(b.death_benefit!.amount).toBe(4000)
    })

    it('payment options are correct', async () => {
      const p = await demoApi.calculatePaymentOptions('10003', '2026-04-01')
      const js50 = p.options.find(o => o.option_type === 'j&s_50')!
      expectClose(js50.monthly_amount, 1132.14, 'j&s_50')
    })
  })

  describe('Case 4: Robert Martinez DRO', () => {
    it('has active DRO record', async () => {
      const dros = await demoApi.getDROs('10004')
      expect(dros.length).toBe(1)
      expect(dros[0].alternate_payee_name).toBe('Patricia Martinez')
      expect(dros[0].division_pct).toBe(40)
    })

    it('DRO calculation matches hand calculation', async () => {
      const d = await demoApi.calculateDRO('10004')
      expectClose(d.marital_service_years, 18.25, 'marital_years')
      expectClose(d.marital_fraction, 0.6348, 'fraction', 0.001)
      expectClose(d.marital_share, 3883.10, 'marital_share')
      expectClose(d.alternate_payee_amount, 1553.24, 'alt_payee')
      expectClose(d.member_net_after_dro, 4564.44, 'member_net')
    })

    it('payment options are based on post-DRO amount', async () => {
      const p = await demoApi.calculatePaymentOptions('10004', '2026-04-01')
      expectClose(p.base_monthly_benefit, 4564.44, 'base')
      const js75 = p.options.find(o => o.option_type === 'j&s_75')!
      expectClose(js75.monthly_amount, 4176.46, 'j&s_75')
    })
  })
})
