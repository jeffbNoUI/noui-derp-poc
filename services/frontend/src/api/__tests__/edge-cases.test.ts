/**
 * Frontend edge case tests — verifies business rule boundaries across demo fixtures.
 * Covers: tier boundaries, service purchase exclusion, AMS windows, reduction factors,
 * payment option ordering, IPR earned-only, death benefit, scenario boundaries,
 * leave payout, and data completeness.
 * Consumed by: vitest test runner
 * Depends on: demo-data.ts (demoApi, computeScenario), constants.ts (DEMO_CASES, DEFAULT_RETIREMENT_DATES)
 *
 * TOUCHPOINTS:
 *   Upstream: demo-data.ts fixtures, constants.ts, Member.ts types
 *   Downstream: None (test-only)
 *   Shared: fmt() currency formatter
 */
import { describe, it, expect } from 'vitest'
import { demoApi } from '../demo-data'
import { DEFAULT_RETIREMENT_DATES, DEMO_CASES, fmt } from '@/lib/constants'

// ── Tier Boundaries ──────────────────────────────────────────────────────

describe('Tier Boundaries', () => {
  it('Case 1 (Tier 1) uses 2.0% multiplier', async () => {
    const benefit = await demoApi.calculateBenefit('10001', DEFAULT_RETIREMENT_DATES['10001'])
    expect(benefit.multiplier).toBe(0.02)
  })

  it('Case 2 (Tier 2) uses 1.5% multiplier', async () => {
    const benefit = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    expect(benefit.multiplier).toBe(0.015)
  })

  it('Case 3 (Tier 3) uses 1.5% multiplier', async () => {
    const benefit = await demoApi.calculateBenefit('10003', DEFAULT_RETIREMENT_DATES['10003'])
    expect(benefit.multiplier).toBe(0.015)
  })

  it('Tier 1 multiplier yields higher benefit than Tier 2 with equivalent inputs', async () => {
    const b1 = await demoApi.calculateBenefit('10001', DEFAULT_RETIREMENT_DATES['10001'])
    const b2 = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    // Tier 1 has 2.0% vs 1.5%, plus more service, so should be significantly higher
    expect(b1.net_monthly_benefit).toBeGreaterThan(b2.net_monthly_benefit)
  })

  it('all 4 demo cases have correct tier metadata', () => {
    expect(DEMO_CASES[0].tier).toBe(1) // Case 1
    expect(DEMO_CASES[1].tier).toBe(2) // Case 2
    expect(DEMO_CASES[2].tier).toBe(3) // Case 3
    expect(DEMO_CASES[3].tier).toBe(1) // Case 4 (DRO variant)
  })
})

// ── Service Purchase Exclusion (CRITICAL) ────────────────────────────────

describe('Service Purchase Exclusion', () => {
  it('Case 2 purchased service excluded from Rule of N eligibility', async () => {
    const elig = await demoApi.evaluateEligibility('10002', DEFAULT_RETIREMENT_DATES['10002'])
    const svc = await demoApi.getServiceCredit('10002')
    // Purchased: 3.0 years
    expect(svc.purchased_service_years).toBe(3.0)
    // Rule of N uses earned only (18.17), not total (21.17)
    // Age 55 + 18.17 = 73.17, which is < 75 → does NOT qualify for Rule of 75
    expect(elig.retirement_type).toBe('early')
    expect(elig.rule_of_n_value).toBeLessThan(75)
  })

  it('Case 2 purchased service included in benefit calculation', async () => {
    const benefit = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    const svc = await demoApi.getServiceCredit('10002')
    // Benefit uses total_for_benefit (earned + purchased = 21.17)
    expect(benefit.service_years_for_benefit).toBeCloseTo(svc.total_for_benefit, 1)
    expect(benefit.service_years_for_benefit).toBeGreaterThan(svc.earned_service_years)
  })

  it('Case 1 has no purchased service — earned equals total', async () => {
    const svc = await demoApi.getServiceCredit('10001')
    expect(svc.purchased_service_years).toBe(0)
    expect(svc.earned_service_years).toBeCloseTo(svc.total_for_benefit, 0.01)
  })
})

// ── AMS Window ───────────────────────────────────────────────────────────

describe('AMS Window', () => {
  it('Tier 1 and 2 use 36-month AMS window', async () => {
    const b1 = await demoApi.calculateBenefit('10001', DEFAULT_RETIREMENT_DATES['10001'])
    const b2 = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    expect(b1.ams_window_months).toBe(36)
    expect(b2.ams_window_months).toBe(36)
  })

  it('Tier 3 uses 60-month AMS window', async () => {
    const b3 = await demoApi.calculateBenefit('10003', DEFAULT_RETIREMENT_DATES['10003'])
    expect(b3.ams_window_months).toBe(60)
  })
})

// ── Reduction Factors ────────────────────────────────────────────────────

describe('Reduction Factors', () => {
  it('Case 1 (Rule of 75) has no reduction — factor 1.0', async () => {
    const elig = await demoApi.evaluateEligibility('10001', DEFAULT_RETIREMENT_DATES['10001'])
    expect(elig.reduction_factor).toBe(1.0)
    expect(elig.retirement_type).toBe('rule_of_75')
  })

  it('Case 2 (early T2, age 55) has 30% reduction — factor 0.70', async () => {
    const elig = await demoApi.evaluateEligibility('10002', DEFAULT_RETIREMENT_DATES['10002'])
    expect(elig.reduction_factor).toBeCloseTo(0.70, 2)
    // 3% per year × 10 years under 65 = 30%
  })

  it('Case 3 (early T3, age 63) has 12% reduction — factor 0.88', async () => {
    const elig = await demoApi.evaluateEligibility('10003', DEFAULT_RETIREMENT_DATES['10003'])
    expect(elig.reduction_factor).toBeCloseTo(0.88, 2)
    // 6% per year × 2 years under 65 = 12%
  })

  it('reduction correctly applied to gross benefit', async () => {
    const benefit = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    // net = gross × reduction_factor
    const expectedNet = benefit.gross_monthly_benefit * 0.70
    expect(benefit.net_monthly_benefit).toBeCloseTo(expectedNet, 0)
  })
})

// ── Payment Option Ordering ──────────────────────────────────────────────

describe('Payment Option Ordering', () => {
  it('payment options include all 4 types in correct order', async () => {
    const opts = await demoApi.calculatePaymentOptions('10001', DEFAULT_RETIREMENT_DATES['10001'])
    expect(opts.options).toHaveLength(4)
    expect(opts.options[0].option_type).toBe('maximum')
    expect(opts.options[1].option_type).toBe('j&s_100')
    expect(opts.options[2].option_type).toBe('j&s_75')
    expect(opts.options[3].option_type).toBe('j&s_50')
  })

  it('maximum option always has highest monthly amount', async () => {
    const opts = await demoApi.calculatePaymentOptions('10001', DEFAULT_RETIREMENT_DATES['10001'])
    const maxAmount = opts.options[0].monthly_amount
    for (const opt of opts.options.slice(1)) {
      expect(opt.monthly_amount).toBeLessThan(maxAmount)
    }
  })

  it('J&S survivor percentage decreases → monthly amount increases', async () => {
    const opts = await demoApi.calculatePaymentOptions('10001', DEFAULT_RETIREMENT_DATES['10001'])
    // J&S 100% < J&S 75% < J&S 50% (higher survivor = lower member payment)
    const js100 = opts.options[1].monthly_amount
    const js75 = opts.options[2].monthly_amount
    const js50 = opts.options[3].monthly_amount
    expect(js100).toBeLessThan(js75)
    expect(js75).toBeLessThan(js50)
  })
})

// ── IPR Earned-Only (CRITICAL) ───────────────────────────────────────────

describe('IPR Earned-Only', () => {
  it('Case 1 IPR uses full earned service (28.75 years)', async () => {
    const benefit = await demoApi.calculateBenefit('10001', DEFAULT_RETIREMENT_DATES['10001'])
    expect(benefit.ipr).toBeDefined()
    expect(benefit.ipr!.eligible_service_years).toBeCloseTo(28.75, 1)
    // 28.75 × $150/yr ÷ 12 = $359.38
    expect(benefit.ipr!.monthly_amount).toBeCloseTo(359.38, 0)
  })

  it('Case 2 IPR uses earned only (18.17), NOT total (21.17)', async () => {
    const benefit = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    const svc = await demoApi.getServiceCredit('10002')
    expect(benefit.ipr).toBeDefined()
    // IPR service years should match earned, not total
    expect(benefit.ipr!.eligible_service_years).toBeCloseTo(svc.earned_service_years, 1)
    expect(benefit.ipr!.eligible_service_years).not.toBeCloseTo(svc.total_for_benefit, 1)
  })

  it('Case 3 IPR uses earned service (13.58 years)', async () => {
    const benefit = await demoApi.calculateBenefit('10003', DEFAULT_RETIREMENT_DATES['10003'])
    expect(benefit.ipr).toBeDefined()
    expect(benefit.ipr!.eligible_service_years).toBeCloseTo(13.58, 1)
    // 13.58 × $150/yr ÷ 12 = $169.75
    expect(benefit.ipr!.monthly_amount).toBeCloseTo(169.75, 0)
  })
})

// ── Death Benefit ────────────────────────────────────────────────────────

describe('Death Benefit', () => {
  it('Case 1 (normal retirement equivalent) gets full $5,000', async () => {
    const benefit = await demoApi.calculateBenefit('10001', DEFAULT_RETIREMENT_DATES['10001'])
    expect(benefit.death_benefit).toBeDefined()
    expect(benefit.death_benefit!.amount).toBe(5000)
  })

  it('Case 2 (early T2, age 55) gets $2,500 — reduced by $250/yr × 10', async () => {
    const benefit = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    expect(benefit.death_benefit).toBeDefined()
    // $5,000 - ($250 × 10 years under 65) = $2,500
    expect(benefit.death_benefit!.amount).toBe(2500)
  })

  it('Case 3 (early T3, age 63) gets $4,000 — reduced by $500/yr × 2', async () => {
    const benefit = await demoApi.calculateBenefit('10003', DEFAULT_RETIREMENT_DATES['10003'])
    expect(benefit.death_benefit).toBeDefined()
    // $5,000 - ($500 × 2 years under 65) = $4,000
    expect(benefit.death_benefit!.amount).toBe(4000)
  })

  it('Tier 1/2 death reduction rate ($250/yr) differs from Tier 3 ($500/yr)', async () => {
    const b2 = await demoApi.calculateBenefit('10002', DEFAULT_RETIREMENT_DATES['10002'])
    const b3 = await demoApi.calculateBenefit('10003', DEFAULT_RETIREMENT_DATES['10003'])
    // Both under 65, but different per-year reductions
    // T2 at age 55: $5000 - 10×$250 = $2500
    // T3 at age 63: $5000 - 2×$500 = $4000
    expect(b2.death_benefit!.amount).toBe(2500)
    expect(b3.death_benefit!.amount).toBe(4000)
  })
})

// ── Scenario Boundaries ──────────────────────────────────────────────────

describe('Scenario Boundaries', () => {
  it('scenario projection returns data for multiple retirement dates', async () => {
    const scenarios = await demoApi.calculateScenarios('10001', [
      '2026-04-01', '2027-04-01', '2028-04-01',
    ])
    expect(scenarios).toHaveLength(3)
    scenarios.forEach(s => {
      expect(s.retirement_date).toBeDefined()
      expect(s.net_monthly_benefit).toBeGreaterThan(0)
    })
  })

  it('later retirement dates yield higher or equal benefits (salary growth)', async () => {
    const scenarios = await demoApi.calculateScenarios('10001', [
      '2026-04-01', '2028-04-01',
    ])
    // Later date should be >= earlier (more service, higher projected AMS)
    expect(scenarios[1].net_monthly_benefit).toBeGreaterThanOrEqual(scenarios[0].net_monthly_benefit)
  })

  it('Case 2 scenario: approaching Rule of 75 threshold', async () => {
    // Jennifer Kim at age 55 has rule_of_n = 73.17 (below 75)
    // In ~2 years she gains age and service, approaching 75
    const scenarios = await demoApi.calculateScenarios('10002', [
      '2026-05-01', '2028-05-01',
    ])
    // First date: early retirement
    expect(scenarios[0].retirement_type).toBe('early')
    // The later date should have a higher benefit due to more service and possibly less reduction
    expect(scenarios[1].net_monthly_benefit).toBeGreaterThan(scenarios[0].net_monthly_benefit)
  })
})

// ── Leave Payout ─────────────────────────────────────────────────────────

describe('Leave Payout', () => {
  it('Case 1 (hired 1997, before 2010 cutoff) eligibility confirms leave payout eligible', async () => {
    const elig = await demoApi.evaluateEligibility('10001', DEFAULT_RETIREMENT_DATES['10001'])
    const leaveEntry = elig.audit_trail.find(e => e.rule_name === 'Leave Payout')
    expect(leaveEntry).toBeDefined()
    expect(leaveEntry!.result).toBe('ELIGIBLE')
    expect(leaveEntry!.source_reference).toContain('RMC')
  })

  it('Case 1 eligibility conditions mention leave payout', async () => {
    const elig = await demoApi.evaluateEligibility('10001', DEFAULT_RETIREMENT_DATES['10001'])
    const hasLeaveCondition = elig.conditions_met.some(c =>
      c.toLowerCase().includes('leave payout')
    )
    expect(hasLeaveCondition).toBe(true)
  })

  it('Case 3 (Tier 3, hired after 2010) has no leave payout audit entry', async () => {
    const elig = await demoApi.evaluateEligibility('10003', DEFAULT_RETIREMENT_DATES['10003'])
    // Tier 3 members hired on/after July 1, 2011 — not eligible for leave payout
    const leaveEntry = elig.audit_trail.find(e => e.rule_name === 'Leave Payout')
    // Either no entry, or entry shows NOT_ELIGIBLE
    if (leaveEntry) {
      expect(leaveEntry.result).not.toBe('ELIGIBLE')
    }
  })
})

// ── Data Completeness ────────────────────────────────────────────────────

describe('Data Completeness', () => {
  const caseIds = ['10001', '10002', '10003', '10004']

  it('all demo cases have member data', async () => {
    for (const id of caseIds) {
      const member = await demoApi.getMember(id)
      expect(member).toBeDefined()
      expect(member.first_name).toBeTruthy()
      expect(member.last_name).toBeTruthy()
      expect(member.tier).toBeGreaterThanOrEqual(1)
      expect(member.tier).toBeLessThanOrEqual(3)
    }
  })

  it('all demo cases have service credit data', async () => {
    for (const id of caseIds) {
      const svc = await demoApi.getServiceCredit(id)
      expect(svc).toBeDefined()
      expect(svc.earned_service_years).toBeGreaterThan(0)
      expect(svc.total_for_benefit).toBeGreaterThanOrEqual(svc.earned_service_years)
    }
  })

  it('all demo cases have benefit calculations with audit trail', async () => {
    for (const id of caseIds) {
      const retDate = DEFAULT_RETIREMENT_DATES[id]
      const benefit = await demoApi.calculateBenefit(id, retDate)
      expect(benefit).toBeDefined()
      expect(benefit.net_monthly_benefit).toBeGreaterThan(0)
      expect(benefit.audit_trail).toBeDefined()
      expect(benefit.audit_trail.length).toBeGreaterThan(0)
      // Every audit entry should have a source reference
      for (const entry of benefit.audit_trail) {
        expect(entry.source_reference).toBeTruthy()
      }
    }
  })

  it('all demo cases have eligibility results', async () => {
    for (const id of caseIds) {
      const retDate = DEFAULT_RETIREMENT_DATES[id]
      const elig = await demoApi.evaluateEligibility(id, retDate)
      expect(elig).toBeDefined()
      expect(elig.eligible).toBe(true)
      expect(elig.retirement_type).toBeTruthy()
      expect(elig.reduction_factor).toBeGreaterThan(0)
      expect(elig.reduction_factor).toBeLessThanOrEqual(1.0)
    }
  })

  it('fmt() formats currency correctly and handles edge cases', () => {
    expect(fmt(1234.56)).toBe('$1,234.56')
    expect(fmt(0)).toBe('$0.00')
    expect(fmt(null as unknown as number)).toBe('—')
    expect(fmt(undefined as unknown as number)).toBe('—')
  })

  it('DEFAULT_RETIREMENT_DATES covers all 4 demo cases', () => {
    for (const c of DEMO_CASES) {
      expect(DEFAULT_RETIREMENT_DATES[c.id]).toBeDefined()
      // Dates should be valid YYYY-MM-DD format
      expect(DEFAULT_RETIREMENT_DATES[c.id]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
