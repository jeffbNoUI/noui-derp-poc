/**
 * Demo data verification — validates cached demo fixtures against expected values.
 * This verifies all COPERA cases are correct.
 */
import { describe, it, expect } from 'vitest'
import { demoApi } from './demo-data'

function expectClose(actual: number, expected: number, _label: string, tolerance = 0.01) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance)
}

describe('Demo Data Verification', () => {
  describe('Case 1: Maria Garcia — State, PERA 1, Rule of 80', () => {
    it('member data is correct', async () => {
      const m = await demoApi.getMember('COPERA-001')
      expect(m.first_name).toBe('Maria')
      expect(m.last_name).toBe('Garcia')
      expect(m.division).toBe('State')
      expect(m.has_table).toBe(1)
      expect(m.member_id).toBe('COPERA-001')
      expect(m.date_of_birth).toBe('1963-07-20')
      expect(m.hire_date).toBe('1998-01-01')
      expect(m.status).toBe('Active')
      expect(m.department).toBe('Department of Revenue')
    })

    it('eligibility is Rule of 80 / normal', async () => {
      const e = await demoApi.evaluateEligibility('COPERA-001', '2026-01-01')
      expect(e.eligible).toBe(true)
      expect(e.retirement_type).toBe('normal')
      expect(e.reduction_factor).toBe(1.0)
      expectClose(e.rule_of_n_value!, 90.00, 'rule_sum')
    })

    it('benefit matches hand calculation', async () => {
      const b = await demoApi.calculateBenefit('COPERA-001', '2026-01-01')
      expectClose(b.ams, 7652.78, 'AMS')
      expect(b.ams_window_months).toBe(36)
      expect(b.multiplier).toBe(0.025)
      expectClose(b.service_years_for_benefit, 28.00, 'service_years')
      expectClose(b.gross_monthly_benefit, 5356.94, 'gross_benefit')
      expect(b.reduction_factor).toBe(1.0)
      expectClose(b.net_monthly_benefit, 5356.94, 'net_benefit')
      expect(b.retirement_type).toBe('normal')
      expect(b.death_benefit!.amount).toBe(5000)
      expect(b.death_benefit!.has_table).toBe(1)
    })

    it('payment options have expected types', async () => {
      const p = await demoApi.calculatePaymentOptions('COPERA-001', '2026-01-01')
      expectClose(p.base_monthly_benefit, 5356.94, 'base')
      expect(p.options.length).toBeGreaterThanOrEqual(3)
      const types = p.options.map(o => o.option_type)
      expect(types).toContain('maximum')
      const max = p.options.find(o => o.option_type === 'maximum')!
      expectClose(max.monthly_amount, 5356.94, 'maximum')
    })

    it('annual increase correct', async () => {
      const b = await demoApi.calculateBenefit('COPERA-001', '2026-01-01')
      expect(b.annual_increase).toBeDefined()
      expect(b.annual_increase!.rate).toBe(0.015)
      expect(b.annual_increase!.compound_method).toBe('compound')
      expect(b.annual_increase!.first_eligible_date).toBe('2028-03-01')
    })
  })

  describe('Case 2: James Chen — School, PERA 6, Early Retirement, Anti-Spiking', () => {
    it('member data is correct', async () => {
      const m = await demoApi.getMember('COPERA-002')
      expect(m.first_name).toBe('James')
      expect(m.last_name).toBe('Chen')
      expect(m.division).toBe('School')
      expect(m.has_table).toBe(6)
    })

    it('eligibility is early retirement with reduction', async () => {
      const e = await demoApi.evaluateEligibility('COPERA-002', '2026-01-01')
      expect(e.eligible).toBe(true)
      expect(e.retirement_type).toBe('early')
      expectClose(e.reduction_factor, 0.68, 'factor')
    })

    it('benefit matches hand calculation', async () => {
      const b = await demoApi.calculateBenefit('COPERA-002', '2026-01-01')
      expectClose(b.ams, 6037.78, 'AMS')
      expectClose(b.gross_monthly_benefit, 2717.00, 'unreduced')
      expectClose(b.net_monthly_benefit, 1847.56, 'reduced')
      expect(b.anti_spiking_applied).toBe(true)
      expect(b.death_benefit!.amount).toBe(5000)
    })

    it('annual increase uses 1.0% for PERA 6', async () => {
      const b = await demoApi.calculateBenefit('COPERA-002', '2026-01-01')
      expect(b.annual_increase).toBeDefined()
      expect(b.annual_increase!.rate).toBe(0.010)
    })
  })

  describe('Case 3: Sarah Williams — DPS, DPS 1, Rule of 80', () => {
    it('member data is correct', async () => {
      const m = await demoApi.getMember('COPERA-003')
      expect(m.first_name).toBe('Sarah')
      expect(m.last_name).toBe('Williams')
      expect(m.division).toBe('DPS')
      expect(m.has_table).toBe(10)
    })

    it('eligibility is Rule of 80', async () => {
      const e = await demoApi.evaluateEligibility('COPERA-003', '2026-01-01')
      expect(e.eligible).toBe(true)
      expect(e.retirement_type).toBe('rule_of_80')
      expectClose(e.reduction_factor, 1.0, 'factor')
    })

    it('benefit matches hand calculation', async () => {
      const b = await demoApi.calculateBenefit('COPERA-003', '2026-01-01')
      expectClose(b.ams, 9083.33, 'AMS')
      expectClose(b.gross_monthly_benefit, 5904.17, 'unreduced')
      expectClose(b.net_monthly_benefit, 5904.17, 'unreduced (no reduction)')
      expect(b.death_benefit!.amount).toBe(5000)
    })

    it('DPS payment options include Pop-Up feature', async () => {
      const p = await demoApi.calculatePaymentOptions('COPERA-003', '2026-01-01')
      const popUps = p.options.filter(o => o.pop_up_feature)
      expect(popUps.length).toBeGreaterThan(0)
    })
  })

  describe('Scenario Modeler — projected benefits for different retirement dates', () => {
    it('Maria Garcia: base date returns exact fixture values', async () => {
      const scenarios = await demoApi.calculateScenarios('COPERA-001', ['2026-01-01'])
      expect(scenarios).toHaveLength(1)
      expect(scenarios[0].retirement_date).toBe('2026-01-01')
      expect(scenarios[0].age_at_retirement).toBe(62)
      expect(scenarios[0].retirement_type).toBe('normal')
      expect(scenarios[0].reduction_factor).toBe(1.0)
      expectClose(scenarios[0].net_monthly_benefit, 5356.94, 'base_benefit')
    })

    it('Maria Garcia: all scenarios show eligible (already qualified)', async () => {
      const dates = ['2026-01-01', '2027-01-01', '2028-01-01']
      const scenarios = await demoApi.calculateScenarios('COPERA-001', dates)
      scenarios.forEach(s => {
        expect(s.eligible).toBe(true)
        expect(s.reduction_factor).toBe(1.0)
      })
      // Benefit should increase with more service years
      expect(scenarios[2].net_monthly_benefit).toBeGreaterThan(scenarios[0].net_monthly_benefit)
    })
  })
})
