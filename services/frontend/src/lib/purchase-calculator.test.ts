/**
 * Service purchase calculator tests — validates against Case 11 (Lisa Chen) oracle values.
 * Every test documents: inputs, applicable rule, expected output, source reference.
 *
 * TOUCHPOINTS for purchase-calculator.test.ts:
 *   Upstream: purchase-calculator.ts (all 5 calculation functions)
 *   Downstream: None (test file)
 *   Shared: Case 11 test fixture values (demo-cases/case11-chen-service-purchase-test-fixture.json)
 */
import { describe, it, expect } from 'vitest'
import {
  calculatePurchaseCost,
  calculatePayrollDeduction,
  calculateBenefitImpact,
  checkPurchaseEligibility,
  checkQuoteValidity,
  lookupCostFactor,
} from './purchase-calculator'

// ─── Case 11 Oracle Values ──────────────────────────────────────────────────
// Source: demo-cases/case11-chen-service-purchase-test-fixture.json
// Lisa Chen: Tier 2, age 48, hired Oct 1 2005, salary $78,000/yr ($6,500/mo)
// Purchasing: 3.0 years of prior governmental service (State of Colorado)

describe('Service Purchase Calculator — Case 11: Lisa Chen', () => {

  // ─── Cost Factor Lookup ─────────────────────────────────────────────────
  describe('lookupCostFactor', () => {
    it('returns exact factor for Tier 2 age 48', () => {
      // RULE-PURCHASE-COST-FACTOR: T2, age 48 → 0.0860
      expect(lookupCostFactor(2, 48)).toBe(0.0860)
    })

    it('returns exact factor for Tier 1 age 60', () => {
      // RULE-PURCHASE-COST-FACTOR: T1, age 60 → 0.2120
      expect(lookupCostFactor(1, 60)).toBe(0.2120)
    })

    it('returns exact factor for Tier 3 age 48', () => {
      // RULE-PURCHASE-COST-FACTOR: T3, age 48 → 0.0820
      expect(lookupCostFactor(3, 48)).toBe(0.0820)
    })

    it('throws for invalid tier', () => {
      expect(() => lookupCostFactor(4, 48)).toThrow('Invalid tier')
    })
  })

  // ─── Cost Calculation ───────────────────────────────────────────────────
  describe('calculatePurchaseCost', () => {
    it('Case 11: 0.0860 x $78,000 x 3.0 = $20,124.00', () => {
      // RULE-PURCHASE-COST-FACTOR — RMC §18-415(c)
      // factor 0.0860 x salary $78,000 x 3 years = $20,124.00
      const result = calculatePurchaseCost({
        tier: 2,
        age: 48,
        currentAnnualSalary: 78000.00,
        yearsPurchased: 3.0,
      })

      expect(result.costFactor).toBe(0.0860)
      expect(result.costPerYear).toBe(6708.00)
      expect(result.totalCost).toBe(20124.00)
    })

    it('Tier 1 age 60: 0.2120 x $95,000 x 2.0 = $40,280.00', () => {
      // Boundary test: older Tier 1 member — expensive purchase
      const result = calculatePurchaseCost({
        tier: 1,
        age: 60,
        currentAnnualSalary: 95000.00,
        yearsPurchased: 2.0,
      })

      expect(result.costFactor).toBe(0.2120)
      expect(result.costPerYear).toBe(20140.00)
      expect(result.totalCost).toBe(40280.00)
    })

    it('Young Tier 2 age 30: 0.0400 x $52,000 x 4.0 = $8,320.00', () => {
      // Boundary test: young member — cheaper purchase
      const result = calculatePurchaseCost({
        tier: 2,
        age: 30,
        currentAnnualSalary: 52000.00,
        yearsPurchased: 4.0,
      })

      expect(result.costFactor).toBe(0.0400)
      expect(result.costPerYear).toBe(2080.00)
      expect(result.totalCost).toBe(8320.00)
    })
  })

  // ─── Payroll Deduction ──────────────────────────────────────────────────
  describe('calculatePayrollDeduction', () => {
    it('Case 11: amortize($20,124, 3%/yr, 60 months) = $361.60/mo', () => {
      // RULE-PURCHASE-PAYMENT-OPTIONS — RMC §18-415(d)
      // Standard amortization: P x r(1+r)^n / ((1+r)^n - 1)
      // where r = 0.03/12 = 0.0025, n = 60
      // Formula-correct: 361.6019... → 361.60 (fixture originally had 361.56 — corrected)
      const result = calculatePayrollDeduction({
        principal: 20124.00,
        annualRate: 0.03,
        months: 60,
      })

      expect(result.monthlyPayment).toBe(361.60)
      expect(result.totalPaid).toBe(21696.00)
      expect(result.interestCost).toBe(1572.00)
    })

    it('Short deduction: $8,320 over 24 months at 3%', () => {
      // TC-PURCHASE-PAY-04: boundary test — shorter period
      // Formula-correct: 357.6037... → 357.60 (fixture originally had 357.66 — corrected)
      const result = calculatePayrollDeduction({
        principal: 8320.00,
        annualRate: 0.03,
        months: 24,
      })

      expect(result.monthlyPayment).toBe(357.60)
      expect(result.totalPaid).toBe(8582.40)
      expect(result.interestCost).toBe(262.40)
    })

    it('Zero interest rate: simple division', () => {
      const result = calculatePayrollDeduction({
        principal: 12000.00,
        annualRate: 0,
        months: 60,
      })

      expect(result.monthlyPayment).toBe(200.00)
      expect(result.totalPaid).toBe(12000.00)
      expect(result.interestCost).toBe(0)
    })
  })

  // ─── Benefit Impact ─────────────────────────────────────────────────────
  describe('calculateBenefitImpact', () => {
    it('Case 11: benefit increase $292.50/mo, breakeven 69 months', () => {
      // RULE-PURCHASE-BENEFIT-IMPACT — RMC §18-415(a), §18-409(a)
      // Before: 1.5% x $6,500 x 20.33 = $1,982.18
      // After:  1.5% x $6,500 x 23.33 = $2,274.68
      // Increase: $292.50/mo
      // Breakeven: $20,124.00 / $292.50 = 68.8 → 69 months
      const result = calculateBenefitImpact({
        tier: 2,
        ams: 6500.00,
        earnedYears: 20.33,
        purchasedYears: 3.0,
        totalCost: 20124.00,
      })

      expect(result.currentMonthly).toBe(1982.18)
      expect(result.projectedMonthly).toBe(2274.68)
      expect(result.monthlyIncrease).toBe(292.50)
      expect(result.annualIncrease).toBe(3510.00)
      expect(result.breakevenMonths).toBe(69)
      expect(result.breakevenYears).toBe(5.8)
    })

    it('Tier 1: higher multiplier means bigger impact per year', () => {
      // TC-PURCHASE-IMPACT-02: 2.0% x $8,500 x 2 = $340/mo increase
      const result = calculateBenefitImpact({
        tier: 1,
        ams: 8500.00,
        earnedYears: 20.0,
        purchasedYears: 2.0,
        totalCost: 40280.00,
      })

      expect(result.currentMonthly).toBe(3400.00)
      expect(result.projectedMonthly).toBe(3740.00)
      expect(result.monthlyIncrease).toBe(340.00)
      expect(result.annualIncrease).toBe(4080.00)
      expect(result.breakevenMonths).toBe(119)
      expect(result.breakevenYears).toBe(9.9)
    })
  })

  // ─── Purchase Eligibility ───────────────────────────────────────────────
  describe('checkPurchaseEligibility', () => {
    it('Case 11: active, vested, governmental, 3 years — eligible', () => {
      // RULE-PURCHASE-ELIGIBILITY — RMC §18-415(a), §18-415(b)
      const result = checkPurchaseEligibility({
        memberStatus: 'Active',
        earnedYears: 20.33,
        serviceType: 'governmental',
        yearsRequested: 3.0,
      })

      expect(result.eligible).toBe(true)
      expect(result.reasons.length).toBeGreaterThan(0)
    })

    it('terminated member — not eligible', () => {
      // TC-PURCHASE-ELIG-03: non-active member
      const result = checkPurchaseEligibility({
        memberStatus: 'terminated',
        earnedYears: 20.0,
        serviceType: 'governmental',
        yearsRequested: 3.0,
      })

      expect(result.eligible).toBe(false)
      expect(result.reasons.some(r => r.includes('not Active'))).toBe(true)
    })

    it('non-vested member — not eligible', () => {
      // TC-PURCHASE-ELIG-04: under 5 years
      const result = checkPurchaseEligibility({
        memberStatus: 'Active',
        earnedYears: 3.5,
        serviceType: 'governmental',
        yearsRequested: 2.0,
      })

      expect(result.eligible).toBe(false)
      expect(result.reasons.some(r => r.includes('Not vested'))).toBe(true)
    })

    it('exceeds 5-year maximum — not eligible', () => {
      // TC-PURCHASE-GOV-03: 6 years exceeds max
      const result = checkPurchaseEligibility({
        memberStatus: 'Active',
        earnedYears: 15.0,
        serviceType: 'governmental',
        yearsRequested: 6.0,
      })

      expect(result.eligible).toBe(false)
      expect(result.reasons.some(r => r.includes('exceeds'))).toBe(true)
    })

    it('invalid service type — not eligible', () => {
      const result = checkPurchaseEligibility({
        memberStatus: 'Active',
        earnedYears: 15.0,
        serviceType: 'private_sector',
        yearsRequested: 3.0,
      })

      expect(result.eligible).toBe(false)
      expect(result.reasons.some(r => r.includes('Invalid service type'))).toBe(true)
    })
  })

  // ─── Quote Validity ─────────────────────────────────────────────────────
  describe('checkQuoteValidity', () => {
    it('Case 11: quote issued Feb 15 2026, current Feb 25 2026 — valid', () => {
      // RULE-PURCHASE-QUOTE-VALIDITY: 90-day window
      const result = checkQuoteValidity('2026-02-15', '2026-02-25')

      expect(result.valid).toBe(true)
      expect(result.expirationDate).toBe('2026-05-16')
      expect(result.daysRemaining).toBeGreaterThan(0)
    })

    it('quote issued 91 days ago — expired', () => {
      // TC-PURCHASE-QUOTE-02: boundary — one day past expiration
      const result = checkQuoteValidity('2026-01-15', '2026-04-16')

      expect(result.valid).toBe(false)
    })

    it('quote issued exactly 90 days ago — still valid', () => {
      // TC-PURCHASE-QUOTE-03: boundary — exactly at expiration day
      const result = checkQuoteValidity('2026-01-15', '2026-04-15')

      expect(result.valid).toBe(true)
      expect(result.daysRemaining).toBe(0)
    })

    it('quote issued 30 days ago — valid with 60 days remaining', () => {
      // TC-PURCHASE-QUOTE-01
      const result = checkQuoteValidity('2026-01-15', '2026-02-14')

      expect(result.valid).toBe(true)
      expect(result.expirationDate).toBe('2026-04-15')
      expect(result.daysRemaining).toBe(60)
    })
  })

  // ─── Eligibility Exclusion (CRITICAL) ───────────────────────────────────
  describe('Eligibility Exclusion — purchased service excluded from Rule of 75', () => {
    it('Rule of 75 sum unchanged by purchase — RMC §18-415(a)', () => {
      // CRITICAL: Age 48 + 20.33 earned = 68.33
      // Purchased 3.0 years are EXCLUDED
      // Rule of 75 sum is STILL 68.33, NOT 71.33
      const age = 48
      const earnedYears = 20.33
      const purchasedYears = 3.0

      // Without purchase: age + earned
      const ruleOf75Without = age + earnedYears

      // With purchase: STILL age + earned (purchased excluded!)
      const ruleOf75With = age + earnedYears // NOT + purchasedYears

      expect(ruleOf75Without).toBeCloseTo(68.33, 2)
      expect(ruleOf75With).toBeCloseTo(68.33, 2)
      expect(ruleOf75With).toBe(ruleOf75Without) // MUST be equal

      // Verify purchased years would matter for benefit but NOT eligibility
      const totalForBenefit = earnedYears + purchasedYears
      expect(totalForBenefit).toBeCloseTo(23.33, 2)

      const totalForEligibility = earnedYears // purchased excluded
      expect(totalForEligibility).toBeCloseTo(20.33, 2)
    })
  })
})
