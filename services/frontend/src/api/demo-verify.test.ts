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
      expect(m.member_id).toBe('10001')
      expect(m.date_of_birth).toBe('1963-03-08')
      expect(m.hire_date).toBe('1997-06-15')
      expect(m.status).toBe('Active')
      expect(m.department).toBe('Public Works')
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
      expect(b.ams_window_months).toBe(36)
      expect(b.multiplier).toBe(0.02)
      expectClose(b.service_years_for_benefit, 28.75, 'service_years')
      expectClose(b.gross_monthly_benefit, 6117.68, 'gross_benefit')
      expect(b.reduction_factor).toBe(1.0)
      expectClose(b.net_monthly_benefit, 6117.68, 'net_benefit')
      expect(b.retirement_type).toBe('rule_of_75')
      expect(b.death_benefit!.amount).toBe(5000)
      expect(b.death_benefit!.tier).toBe(1)
    })

    it('payment options have all 4 types', async () => {
      const p = await demoApi.calculatePaymentOptions('10001', '2026-04-01')
      expectClose(p.base_monthly_benefit, 6117.68, 'base')
      expect(p.options).toHaveLength(4)
      const types = p.options.map(o => o.option_type)
      expect(types).toContain('maximum')
      expect(types).toContain('j&s_100')
      expect(types).toContain('j&s_75')
      expect(types).toContain('j&s_50')
      // Verify specific amounts
      const max = p.options.find(o => o.option_type === 'maximum')!
      expectClose(max.monthly_amount, 6117.68, 'maximum')
      const js100 = p.options.find(o => o.option_type === 'j&s_100')!
      expectClose(js100.monthly_amount, 5414.15, 'j&s_100')
      const js75 = p.options.find(o => o.option_type === 'j&s_75')!
      expectClose(js75.monthly_amount, 5597.68, 'j&s_75')
      const js50 = p.options.find(o => o.option_type === 'j&s_50')!
      expectClose(js50.monthly_amount, 5781.21, 'j&s_50')
    })

    it('IPR correct', async () => {
      const b = await demoApi.calculateBenefit('10001', '2026-04-01')
      expect(b.ipr).toBeDefined()
      expectClose(b.ipr!.monthly_amount, 359.38, 'ipr_monthly')
      expectClose(b.ipr!.annual_amount, 4312.50, 'ipr_annual')
      expectClose(b.ipr!.rate_per_year, 150.00, 'ipr_rate')
      expectClose(b.ipr!.eligible_service_years, 28.75, 'ipr_years')
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

  describe('Scenario Modeler — projected benefits for different retirement dates', () => {
    it('Jennifer Kim: base date returns exact fixture values', async () => {
      const scenarios = await demoApi.calculateScenarios('10002', ['2026-05-01'])
      expect(scenarios).toHaveLength(1)
      expect(scenarios[0].retirement_date).toBe('2026-05-01')
      expect(scenarios[0].age_at_retirement).toBe(55)
      expect(scenarios[0].retirement_type).toBe('early')
      expect(scenarios[0].reduction_factor).toBe(0.70)
      expectClose(scenarios[0].net_monthly_benefit, 1633.07, 'base_benefit')
    })

    it('Jennifer Kim: waiting 1 year crosses Rule of 75 — no reduction, ~$2,518', async () => {
      const scenarios = await demoApi.calculateScenarios('10002', ['2027-05-01'])
      expect(scenarios).toHaveLength(1)
      const s = scenarios[0]
      expect(s.age_at_retirement).toBe(56)
      expect(s.retirement_type).toBe('rule_of_75')
      expect(s.reduction_factor).toBe(1.0)
      // Demo story expects ~$2,518; AMS grows ~3% → exact value near $2,516
      expect(s.net_monthly_benefit).toBeGreaterThan(2450)
      expect(s.net_monthly_benefit).toBeLessThan(2600)
    })

    it('Jennifer Kim: 1 year before is not eligible (age 54 < 55 min)', async () => {
      const scenarios = await demoApi.calculateScenarios('10002', ['2025-05-01'])
      expect(scenarios[0].eligible).toBe(false)
      expect(scenarios[0].net_monthly_benefit).toBe(0)
    })

    it('Jennifer Kim: full 4-date comparison shows dramatic benefit increase', async () => {
      const dates = ['2025-05-01', '2026-05-01', '2027-05-01', '2028-05-01']
      const scenarios = await demoApi.calculateScenarios('10002', dates)
      expect(scenarios).toHaveLength(4)
      // 2025: not eligible (age 54)
      expect(scenarios[0].eligible).toBe(false)
      // 2026: early, 30% reduction → ~$1,633
      expect(scenarios[1].retirement_type).toBe('early')
      expect(scenarios[1].reduction_factor).toBe(0.70)
      // 2027: Rule of 75, no reduction → ~$2,518
      expect(scenarios[2].retirement_type).toBe('rule_of_75')
      expect(scenarios[2].reduction_factor).toBe(1.0)
      // 2028: Rule of 75, no reduction → ~$2,711
      expect(scenarios[3].retirement_type).toBe('rule_of_75')
      // Benefit should increase year over year (when eligible)
      expect(scenarios[2].net_monthly_benefit).toBeGreaterThan(scenarios[1].net_monthly_benefit * 1.4)
      expect(scenarios[3].net_monthly_benefit).toBeGreaterThan(scenarios[2].net_monthly_benefit)
    })

    it('Robert Martinez: all scenarios show Rule of 75 (already qualified)', async () => {
      const dates = ['2025-04-01', '2026-04-01', '2027-04-01']
      const scenarios = await demoApi.calculateScenarios('10001', dates)
      // All dates should qualify for Rule of 75
      scenarios.forEach(s => {
        expect(s.eligible).toBe(true)
        expect(s.retirement_type).toBe('rule_of_75')
        expect(s.reduction_factor).toBe(1.0)
      })
      // Benefit should increase with more service years
      expect(scenarios[2].net_monthly_benefit).toBeGreaterThan(scenarios[0].net_monthly_benefit)
    })

    it('David Washington: Tier 3 reduction decreases as he approaches 65', async () => {
      const dates = ['2026-04-01', '2027-04-01', '2028-04-01']
      const scenarios = await demoApi.calculateScenarios('10003', dates)
      // 2026: age 63, 12% reduction (2 years × 6%)
      expect(scenarios[0].reduction_factor).toBe(0.88)
      // 2027: age 64, 6% reduction (1 year × 6%)
      expect(scenarios[1].reduction_factor).toBe(0.94)
      // 2028: age 65, normal retirement, no reduction
      expect(scenarios[2].reduction_factor).toBe(1.0)
      expect(scenarios[2].retirement_type).toBe('normal')
      // Benefits should increase significantly
      expect(scenarios[2].net_monthly_benefit).toBeGreaterThan(scenarios[0].net_monthly_benefit)
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
