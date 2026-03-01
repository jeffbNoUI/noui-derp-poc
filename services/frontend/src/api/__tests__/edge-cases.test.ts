/**
 * Frontend edge case tests — verifies business rule boundaries across demo fixtures.
 * Covers: division/HAS table boundaries, service purchase exclusion, AMS windows,
 * reduction factors, payment option ordering, annual increase, death benefit,
 * scenario boundaries, and data completeness.
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

// ── Division / HAS Table Boundaries ─────────────────────────────────────

describe('Division / HAS Table Boundaries', () => {
  it('Case 1 (State, PERA 1) uses 2.5% multiplier', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    expect(benefit.multiplier).toBe(0.025)
  })

  it('Case 2 (School, PERA 6) uses 2.5% multiplier', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-002', DEFAULT_RETIREMENT_DATES['COPERA-002'])
    expect(benefit.multiplier).toBe(0.025)
  })

  it('Case 3 (DPS, DPS 1) uses 2.5% multiplier', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-003', DEFAULT_RETIREMENT_DATES['COPERA-003'])
    expect(benefit.multiplier).toBe(0.025)
  })

  it('all 3 demo cases have correct division and has_table metadata', () => {
    expect(DEMO_CASES[0].division).toBe('State')
    expect(DEMO_CASES[0].has_table).toBe(1)
    expect(DEMO_CASES[1].division).toBe('School')
    expect(DEMO_CASES[1].has_table).toBe(6)
    expect(DEMO_CASES[2].division).toBe('DPS')
    expect(DEMO_CASES[2].has_table).toBe(10)
  })
})

// ── AMS Window ───────────────────────────────────────────────────────────

describe('AMS Window', () => {
  it('all COPERA cases use HAS (Highest Average Salary) calculation', async () => {
    const b1 = await demoApi.calculateBenefit('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    const b2 = await demoApi.calculateBenefit('COPERA-002', DEFAULT_RETIREMENT_DATES['COPERA-002'])
    const b3 = await demoApi.calculateBenefit('COPERA-003', DEFAULT_RETIREMENT_DATES['COPERA-003'])
    // All should have positive AMS values
    expect(b1.ams).toBeGreaterThan(0)
    expect(b2.ams).toBeGreaterThan(0)
    expect(b3.ams).toBeGreaterThan(0)
  })
})

// ── Reduction Factors ────────────────────────────────────────────────────

describe('Reduction Factors', () => {
  it('Case 1 (Rule of 80) has no reduction — factor 1.0', async () => {
    const elig = await demoApi.evaluateEligibility('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    expect(elig.reduction_factor).toBe(1.0)
  })

  it('Case 2 (early retirement) has reduction', async () => {
    const elig = await demoApi.evaluateEligibility('COPERA-002', DEFAULT_RETIREMENT_DATES['COPERA-002'])
    expect(elig.reduction_factor).toBeLessThan(1.0)
    expect(elig.reduction_factor).toBeGreaterThan(0)
  })

  it('reduction correctly applied to gross benefit', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-002', DEFAULT_RETIREMENT_DATES['COPERA-002'])
    // net = gross × reduction_factor
    const expectedNet = benefit.gross_monthly_benefit * benefit.reduction_factor
    expect(benefit.net_monthly_benefit).toBeCloseTo(expectedNet, 0)
  })
})

// ── Payment Option Ordering ──────────────────────────────────────────────

describe('Payment Option Ordering', () => {
  it('PERA payment options include expected types', async () => {
    const opts = await demoApi.calculatePaymentOptions('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    expect(opts.options.length).toBeGreaterThan(0)
    const types = opts.options.map(o => o.option_type)
    expect(types).toContain('maximum')
  })

  it('maximum option always has highest monthly amount', async () => {
    const opts = await demoApi.calculatePaymentOptions('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    const maxOpt = opts.options.find(o => o.option_type === 'maximum')
    expect(maxOpt).toBeDefined()
    const maxAmount = maxOpt!.monthly_amount
    for (const opt of opts.options) {
      if (opt.option_type !== 'maximum') {
        expect(opt.monthly_amount).toBeLessThanOrEqual(maxAmount)
      }
    }
  })
})

// ── Annual Increase (replaces IPR) ──────────────────────────────────────

describe('Annual Increase', () => {
  it('Case 1 has annual_increase info', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    expect(benefit.annual_increase).toBeDefined()
    expect(benefit.annual_increase!.rate).toBeGreaterThan(0)
    expect(benefit.annual_increase!.compound_method).toBe('compound')
    expect(benefit.annual_increase!.first_eligible_date).toBeTruthy()
  })

  it('Case 2 has annual_increase info', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-002', DEFAULT_RETIREMENT_DATES['COPERA-002'])
    expect(benefit.annual_increase).toBeDefined()
    expect(benefit.annual_increase!.rate).toBeGreaterThan(0)
  })

  it('Case 3 has annual_increase info', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-003', DEFAULT_RETIREMENT_DATES['COPERA-003'])
    expect(benefit.annual_increase).toBeDefined()
    expect(benefit.annual_increase!.rate).toBeGreaterThan(0)
  })
})

// ── Death Benefit ────────────────────────────────────────────────────────

describe('Death Benefit', () => {
  it('Case 1 (normal retirement) gets death benefit', async () => {
    const benefit = await demoApi.calculateBenefit('COPERA-001', DEFAULT_RETIREMENT_DATES['COPERA-001'])
    expect(benefit.death_benefit).toBeDefined()
    expect(benefit.death_benefit!.amount).toBeGreaterThan(0)
  })
})

// ── Scenario Boundaries ──────────────────────────────────────────────────

describe('Scenario Boundaries', () => {
  it('scenario projection returns data for multiple retirement dates', async () => {
    const scenarios = await demoApi.calculateScenarios('COPERA-001', [
      '2026-01-01', '2027-01-01', '2028-01-01',
    ])
    expect(scenarios).toHaveLength(3)
    scenarios.forEach(s => {
      expect(s.retirement_date).toBeDefined()
      expect(s.net_monthly_benefit).toBeGreaterThan(0)
    })
  })

  it('later retirement dates yield higher or equal benefits (salary growth)', async () => {
    const scenarios = await demoApi.calculateScenarios('COPERA-001', [
      '2026-01-01', '2028-01-01',
    ])
    // Later date should be >= earlier (more service, higher projected AMS)
    expect(scenarios[1].net_monthly_benefit).toBeGreaterThanOrEqual(scenarios[0].net_monthly_benefit)
  })
})

// ── Data Completeness ────────────────────────────────────────────────────

describe('Data Completeness', () => {
  const caseIds = ['COPERA-001', 'COPERA-002', 'COPERA-003']

  it('all demo cases have member data', async () => {
    for (const id of caseIds) {
      const member = await demoApi.getMember(id)
      expect(member).toBeDefined()
      expect(member.first_name).toBeTruthy()
      expect(member.last_name).toBeTruthy()
      expect(member.division).toBeTruthy()
      expect(member.has_table).toBeGreaterThanOrEqual(1)
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

  it('DEFAULT_RETIREMENT_DATES covers all 3 demo cases', () => {
    for (const c of DEMO_CASES) {
      expect(DEFAULT_RETIREMENT_DATES[c.id]).toBeDefined()
      // Dates should be valid YYYY-MM-DD format
      expect(DEFAULT_RETIREMENT_DATES[c.id]).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
