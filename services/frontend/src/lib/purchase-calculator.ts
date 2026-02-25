/**
 * Service purchase cost calculator — deterministic rules engine functions.
 * Implements RULE-PURCHASE-COST-FACTOR, RULE-PURCHASE-PAYMENT-OPTIONS,
 * RULE-PURCHASE-BENEFIT-IMPACT, RULE-PURCHASE-ELIGIBILITY, RULE-PURCHASE-QUOTE-VALIDITY.
 * NO React, NO UI — pure calculation functions with audit logging.
 *
 * Consumed by: Stage9ServicePurchase.tsx, purchase-calculator.test.ts
 * Depends on: rules/definitions/service-purchase.yaml (actuarial cost factor tables)
 */

// ─── Actuarial Cost Factor Tables ────────────────────────────────────────────
// Source: rules/definitions/service-purchase.yaml → cost_factor_tables
// Factors represent present value of additional lifetime benefit.
// Higher age = higher factor (shorter contribution period, higher PV).
// Tier 1 higher than Tier 2/3 due to 2.0% multiplier vs 1.5%.
// Assumption Q-COST-FACTOR-01: representative values; actual DERP factors
// come from actuarial valuation.

// Robust rounding to cents — handles floating point edge cases like 1982.175
// which is represented as 1982.17499... in IEEE 754. Adding 1e-10 after
// scaling to cents corrects .xx5 half-penny values without affecting
// legitimate rounding decisions (smallest meaningful gap is 0.005).
function round2(val: number): number {
  return Math.round(val * 100 + 1e-10) / 100
}

type CostFactorTable = Record<number, number>

const COST_FACTOR_TABLES: Record<number, CostFactorTable> = {
  // Tier 1: 2.0% multiplier — higher cost per year of purchased service
  1: {
    25: 0.0420, 30: 0.0520, 35: 0.0640, 40: 0.0790, 45: 0.0980,
    48: 0.1120, 50: 0.1210, 55: 0.1590, 60: 0.2120, 64: 0.2680,
  },
  // Tier 2: 1.5% multiplier, 36-month AMS window
  2: {
    25: 0.0320, 30: 0.0400, 35: 0.0490, 40: 0.0610, 45: 0.0750,
    48: 0.0860, 50: 0.0930, 55: 0.1220, 60: 0.1630, 64: 0.2060,
  },
  // Tier 3: 1.5% multiplier, 60-month AMS window
  3: {
    25: 0.0310, 30: 0.0380, 35: 0.0470, 40: 0.0580, 45: 0.0720,
    48: 0.0820, 50: 0.0890, 55: 0.1170, 60: 0.1560, 64: 0.1970,
  },
}

/**
 * Look up the actuarial cost factor for a given tier and age.
 * Uses exact match from the published table. If the age is not in
 * the table, interpolates linearly between the two nearest entries.
 * RMC §18-415(c): cost determined by actuarial tables.
 */
export function lookupCostFactor(tier: number, age: number): number {
  const table = COST_FACTOR_TABLES[tier]
  if (!table) throw new Error(`Invalid tier: ${tier}. Must be 1, 2, or 3.`)

  // Direct lookup
  if (table[age] !== undefined) return table[age]

  // Linear interpolation between nearest ages
  const ages = Object.keys(table).map(Number).sort((a, b) => a - b)
  if (age < ages[0]) return table[ages[0]]
  if (age > ages[ages.length - 1]) return table[ages[ages.length - 1]]

  let lower = ages[0]
  let upper = ages[ages.length - 1]
  for (const a of ages) {
    if (a <= age) lower = a
    if (a >= age && a < upper) upper = a
  }

  // Interpolate: factor = lower_factor + (age - lower) / (upper - lower) * (upper_factor - lower_factor)
  const lowerFactor = table[lower]
  const upperFactor = table[upper]
  const fraction = (age - lower) / (upper - lower)
  return +(lowerFactor + fraction * (upperFactor - lowerFactor)).toFixed(4)
}

// ─── Cost Calculation ────────────────────────────────────────────────────────

export interface PurchaseCostResult {
  costFactor: number
  costPerYear: number
  totalCost: number
}

/**
 * Calculate the actuarial cost of purchasing service credit.
 * Formula: Total Cost = Cost Factor x Current Annual Salary x Years Purchased
 * RULE-PURCHASE-COST-FACTOR — RMC §18-415(c)
 */
export function calculatePurchaseCost(params: {
  tier: number
  age: number
  currentAnnualSalary: number
  yearsPurchased: number
}): PurchaseCostResult {
  const { tier, age, currentAnnualSalary, yearsPurchased } = params

  // Look up actuarial cost factor from table — RMC §18-415(c)
  const costFactor = lookupCostFactor(tier, age)

  // Cost per year = factor x salary
  const costPerYear = round2(costFactor * currentAnnualSalary)

  // Total cost = factor x salary x years — carry full precision, round final
  const totalCost = round2(costFactor * currentAnnualSalary * yearsPurchased)

  return { costFactor, costPerYear, totalCost }
}

// ─── Payroll Deduction Amortization ──────────────────────────────────────────

export interface PayrollDeductionResult {
  monthlyPayment: number
  totalPaid: number
  interestCost: number
}

/**
 * Calculate payroll deduction amortization for service purchase installments.
 * Standard amortization formula: P x r(1+r)^n / ((1+r)^n - 1)
 * RULE-PURCHASE-PAYMENT-OPTIONS — RMC §18-415(d)
 * Assumption Q-PAYROLL-INTEREST-01: 3% annual rate set by DERP board.
 * Assumption Q-PAYROLL-MAX-01: max 60 months (5 years).
 */
export function calculatePayrollDeduction(params: {
  principal: number
  annualRate: number
  months: number
}): PayrollDeductionResult {
  const { principal, annualRate, months } = params

  // Monthly interest rate
  const r = annualRate / 12

  if (r === 0) {
    // No interest — simple division
    const monthlyPayment = round2(principal / months)
    const totalPaid = round2(monthlyPayment * months)
    return { monthlyPayment, totalPaid, interestCost: 0 }
  }

  // Standard amortization: P x r(1+r)^n / ((1+r)^n - 1)
  const compoundFactor = Math.pow(1 + r, months) // (1+r)^n
  const monthlyPayment = round2(principal * (r * compoundFactor) / (compoundFactor - 1))

  // Total paid = monthly x number of payments
  const totalPaid = round2(monthlyPayment * months)

  // Interest cost = total paid - principal
  const interestCost = round2(totalPaid - principal)

  return { monthlyPayment, totalPaid, interestCost }
}

// ─── Benefit Impact Analysis ─────────────────────────────────────────────────

export interface BenefitImpactResult {
  currentMonthly: number
  projectedMonthly: number
  monthlyIncrease: number
  annualIncrease: number
  breakevenMonths: number
  breakevenYears: number
}

/**
 * Calculate the benefit impact of purchasing service credit.
 * Shows before/after monthly benefit and breakeven analysis.
 * CRITICAL: purchased service counts for BENEFIT but NOT for eligibility.
 * RULE-PURCHASE-BENEFIT-IMPACT — RMC §18-415(a), §18-409(a)
 */
export function calculateBenefitImpact(params: {
  tier: number
  ams: number
  earnedYears: number
  purchasedYears: number
  totalCost: number
}): BenefitImpactResult {
  const { tier, ams, earnedYears, purchasedYears, totalCost } = params

  // Multiplier by tier — RMC §18-408(a)
  const multiplier = tier === 1 ? 0.02 : 0.015

  // Current monthly (earned only): multiplier x AMS x earned
  const currentMonthly = round2(multiplier * ams * earnedYears)

  // Projected monthly (earned + purchased): multiplier x AMS x (earned + purchased)
  const projectedMonthly = round2(multiplier * ams * (earnedYears + purchasedYears))

  // Monthly increase = difference
  const monthlyIncrease = round2(projectedMonthly - currentMonthly)

  // Annual increase = monthly x 12
  const annualIncrease = round2(monthlyIncrease * 12)

  // Breakeven months = total cost / monthly increase, rounded up
  // This is the number of retirement months needed to recoup the purchase cost
  const breakevenMonths = Math.ceil(totalCost / monthlyIncrease)

  // Breakeven years = breakeven months / 12, rounded to 1 decimal
  const breakevenYears = +(breakevenMonths / 12).toFixed(1)

  return {
    currentMonthly,
    projectedMonthly,
    monthlyIncrease,
    annualIncrease,
    breakevenMonths,
    breakevenYears,
  }
}

// ─── Purchase Eligibility ────────────────────────────────────────────────────

export interface PurchaseEligibilityResult {
  eligible: boolean
  reasons: string[]
}

/**
 * Check whether a member is eligible to purchase service credit.
 * RULE-PURCHASE-ELIGIBILITY — RMC §18-415(a), §18-415(b)
 * Conditions: active, vested (5+ years), valid purchase type, within year limit.
 */
export function checkPurchaseEligibility(params: {
  memberStatus: string
  earnedYears: number
  serviceType: string
  yearsRequested: number
}): PurchaseEligibilityResult {
  const { memberStatus, earnedYears, serviceType, yearsRequested } = params
  const reasons: string[] = []
  let eligible = true

  // Must be active — RMC §18-415(a)
  if (memberStatus.toLowerCase() !== 'active') {
    eligible = false
    reasons.push(`Member status '${memberStatus}' is not Active. Only active members may purchase.`)
  }

  // Must be vested (5+ years earned) — assumption Q-PURCHASE-VEST-01
  if (earnedYears < 5) {
    eligible = false
    reasons.push(`Not vested: ${earnedYears.toFixed(2)} earned years < 5 years required.`)
  } else {
    reasons.push(`Vested: ${earnedYears.toFixed(2)} years >= 5 years required.`)
  }

  // Valid purchase type — RMC §18-415(b)
  const validTypes = ['governmental', 'military', 'leave_of_absence', 'furlough']
  if (!validTypes.includes(serviceType)) {
    eligible = false
    reasons.push(`Invalid service type '${serviceType}'. Must be one of: ${validTypes.join(', ')}.`)
  } else {
    reasons.push(`Service type '${serviceType}' is valid per RMC §18-415(b).`)
  }

  // Max 5 years for governmental and military — RMC §18-415(b)(1), §18-415(b)(2)
  const maxYears = 5.0
  if (yearsRequested > maxYears) {
    eligible = false
    reasons.push(`Requested ${yearsRequested} years exceeds maximum ${maxYears} years.`)
  } else if (yearsRequested <= 0) {
    eligible = false
    reasons.push(`Years requested must be greater than 0.`)
  } else {
    reasons.push(`Requested ${yearsRequested} years within ${maxYears}-year limit.`)
  }

  return { eligible, reasons }
}

// ─── Quote Validity ──────────────────────────────────────────────────────────

export interface QuoteValidityResult {
  valid: boolean
  expirationDate: string
  daysRemaining: number
}

/**
 * Check whether a service purchase cost quote is still valid.
 * Quotes are valid for 90 calendar days from issuance.
 * RULE-PURCHASE-QUOTE-VALIDITY — DERP administrative practice.
 * After 90 days, cost must be recalculated (age/salary may have changed).
 */
export function checkQuoteValidity(
  issueDate: string,
  currentDate: string,
): QuoteValidityResult {
  // Use UTC noon to avoid timezone edge cases with date-only strings
  const issue = new Date(issueDate + 'T12:00:00Z')
  const current = new Date(currentDate + 'T12:00:00Z')

  // Expiration = issue date + 90 calendar days
  const msPerDay = 24 * 60 * 60 * 1000
  const expiration = new Date(issue.getTime() + 90 * msPerDay)

  // Days remaining = expiration - current (can be negative if expired)
  const daysRemaining = Math.round((expiration.getTime() - current.getTime()) / msPerDay)

  // Valid if current date <= expiration date (on the 90th day is still valid)
  const valid = daysRemaining >= 0

  // Format expiration as YYYY-MM-DD
  const expirationDate = expiration.toISOString().split('T')[0]

  return { valid, expirationDate, daysRemaining }
}
