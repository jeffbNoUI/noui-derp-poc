/**
 * Demo data fixtures for Contribution Refund cases (Cases 7 and 8).
 * Values verified against hand calculations in demo-cases/case7-santos-refund/calculation.md
 * and demo-cases/case8-vested-refund/calculation.md.
 *
 * Consumed by: pages/staff/stages/refund/*.tsx, api/refund-demo-data.test.ts
 * Depends on: types/Refund.ts, types/Member.ts
 */
import type { Member } from '@/types/Member'
import type {
  RefundEligibility,
  ContributionAccumulation,
  ContributionDetail,
  InterestSchedule,
  TaxWithholdingResult,
  DeferredComparison,
  RefundCalculation,
} from '@/types/Refund'

// ─── Case 7: Maria Santos — Non-Vested Tier 2 Refund ──────────────────────

const case7Member: Member = {
  member_id: '10007',
  first_name: 'Maria',
  last_name: 'Santos',
  date_of_birth: '1995-08-15',
  hire_date: '2022-04-01',
  tier: 2,
  status: 'Terminated',
  department: 'Human Services',
  position: 'Case Worker I',
  termination_date: '2026-01-31',
}

const case7Eligibility: RefundEligibility = {
  eligible: true,
  reason: 'Eligible for contribution refund',
  vested: false,
  service_years: 3.83,
  forfeiture_required: false,
  waiting_period_met: true,
  days_since_termination: 90,
  earliest_application_date: '2026-05-01',
  audit_trail: [
    {
      rule_id: 'RULE-REFUND-WAIT',
      rule_name: '90-Day Waiting Period',
      description: 'Check calendar days since termination',
      result: 'PASS: 90 days >= 90 required',
      source_reference: 'RMC §18-403(a)',
    },
    {
      rule_id: 'RULE-REFUND-VESTED',
      rule_name: 'Vested Refund Forfeiture',
      description: 'Service 3.83 years < 5.0 vesting requirement',
      result: 'NOT APPLICABLE — non-vested, no pension rights to forfeit',
      source_reference: 'RMC §18-404',
    },
  ],
}

// Build Santos contribution detail (46 months)
function buildSantosContribDetail(): ContributionDetail[] {
  const detail: ContributionDetail[] = []
  let runningTotal = 0

  // Year 1: Apr 2022 – Mar 2023 (12 months at ~$4,307.02)
  const y1Pay = 4307.02
  for (let m = 4; m <= 12; m++) {
    const contrib = y1Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2022, month: m, pensionable_pay: y1Pay, contribution: contrib, running_total: runningTotal })
  }
  for (let m = 1; m <= 3; m++) {
    const contrib = y1Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2023, month: m, pensionable_pay: y1Pay, contribution: contrib, running_total: runningTotal })
  }

  // Year 2: Apr 2023 – Mar 2024 (12 months at $4,550.00)
  const y2Pay = 4550.00
  for (let m = 4; m <= 12; m++) {
    const contrib = y2Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2023, month: m, pensionable_pay: y2Pay, contribution: contrib, running_total: runningTotal })
  }
  for (let m = 1; m <= 3; m++) {
    const contrib = y2Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2024, month: m, pensionable_pay: y2Pay, contribution: contrib, running_total: runningTotal })
  }

  // Year 3: Apr 2024 – Mar 2025 (12 months at $4,777.50)
  const y3Pay = 4777.50
  for (let m = 4; m <= 12; m++) {
    const contrib = y3Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2024, month: m, pensionable_pay: y3Pay, contribution: contrib, running_total: runningTotal })
  }
  for (let m = 1; m <= 3; m++) {
    const contrib = y3Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2025, month: m, pensionable_pay: y3Pay, contribution: contrib, running_total: runningTotal })
  }

  // Year 4: Apr 2025 – Jan 2026 (10 months at $5,016.38)
  const y4Pay = 5016.38
  for (let m = 4; m <= 12; m++) {
    const contrib = y4Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2025, month: m, pensionable_pay: y4Pay, contribution: contrib, running_total: runningTotal })
  }
  {
    const contrib = y4Pay * 0.0845
    runningTotal += contrib
    detail.push({ year: 2026, month: 1, pensionable_pay: y4Pay, contribution: contrib, running_total: runningTotal })
  }

  return detail
}

const case7ContribDetail = buildSantosContribDetail()

const case7Contributions: ContributionAccumulation = {
  total_contributions: 17988.89,
  month_count: 46,
  monthly_detail: case7ContribDetail,
  formula: 'SUM(monthly_pensionable_salary x 0.0845)',
}

const case7Interest: InterestSchedule = {
  total_interest: 650.14,
  interest_rate: 0.02,
  credits: [
    { date: '2023-06-30', balance_before: 6370.00, interest_amount: 127.40, balance_after: 6497.40 },
    { date: '2024-06-30', balance_before: 12477.40, interest_amount: 252.10, balance_after: 12729.50 },
    { date: '2025-06-30', balance_before: 17638.38, interest_amount: 270.64, balance_after: 17909.02 },
  ],
  formula: 'balance_at_june_30 x 0.0200, compounded annually on June 30',
}

const case7TaxDirect: TaxWithholdingResult = {
  gross_refund: 18639.03,
  election_type: 'direct_payment',
  withholding_rate: 0.20,
  withholding_amount: 3727.81,
  net_payment: 14911.22,
  formula: '18639.03 x 20% = 3727.81 withholding',
}

const case7TaxRollover: TaxWithholdingResult = {
  gross_refund: 18639.03,
  election_type: 'direct_rollover',
  withholding_rate: 0,
  withholding_amount: 0,
  rollover_amount: 18639.03,
  net_payment: 18639.03,
  formula: 'Full rollover — no withholding',
}

const case7TaxPartial: TaxWithholdingResult = {
  gross_refund: 18639.03,
  election_type: 'partial_rollover',
  withholding_rate: 0.20,
  withholding_amount: 1863.90,
  rollover_amount: 9319.52,
  net_payment: 16775.13,
  formula: 'Direct: 9319.51 x 20% = 1863.90 withholding; Rollover: 9319.52 (no withholding)',
}

const case7Refund: RefundCalculation = {
  member_id: '10007',
  eligibility: case7Eligibility,
  contributions: case7Contributions,
  interest: case7Interest,
  gross_refund: 18639.03,
  tax_options: [case7TaxDirect, case7TaxRollover, case7TaxPartial],
  audit_trail: [
    ...case7Eligibility.audit_trail,
    {
      rule_id: 'RULE-REFUND-CONTRIB',
      rule_name: 'Contribution Accumulation',
      description: '46 months of contributions at 8.45%',
      result: '$17,988.89 total employee contributions',
      source_reference: 'RMC §18-403(b)',
    },
    {
      rule_id: 'RULE-REFUND-INTEREST',
      rule_name: 'Interest on Contributions',
      description: '2.0% annual, compounded June 30, 3 compounding periods',
      result: '$650.14 total accrued interest',
      source_reference: 'RMC §18-403(c)',
    },
    {
      rule_id: 'RULE-REFUND-GROSS',
      rule_name: 'Gross Refund',
      description: '$17,988.89 contributions + $650.14 interest',
      result: '$18,639.03 gross refund',
      source_reference: 'RMC §18-403',
    },
  ],
}

// ─── Case 8: Thomas Chen — Vested Tier 1 Refund with Forfeiture ────────────

const case8Member: Member = {
  member_id: '10008',
  first_name: 'Thomas',
  last_name: 'Chen',
  date_of_birth: '1981-03-10',
  hire_date: '2018-06-01',
  tier: 1,
  status: 'Terminated',
  department: 'Information Technology',
  position: 'Systems Analyst II',
  termination_date: '2025-06-30',
}

const case8Eligibility: RefundEligibility = {
  eligible: true,
  reason: 'Eligible for contribution refund',
  vested: true,
  service_years: 7.08,
  forfeiture_required: true,
  waiting_period_met: true,
  days_since_termination: 90,
  earliest_application_date: '2025-09-28',
  audit_trail: [
    {
      rule_id: 'RULE-REFUND-WAIT',
      rule_name: '90-Day Waiting Period',
      description: 'Check calendar days since termination',
      result: 'PASS: 90 days >= 90 required',
      source_reference: 'RMC §18-403(a)',
    },
    {
      rule_id: 'RULE-REFUND-VESTED',
      rule_name: 'Vested Refund Forfeiture',
      description: 'Service 7.08 years >= 5.0 vesting requirement',
      result: 'FORFEITURE REQUIRED — pension rights permanently forfeited upon refund',
      source_reference: 'RMC §18-404',
    },
  ],
}

const case8Contributions: ContributionAccumulation = {
  total_contributions: 45333.41,
  month_count: 85,
  monthly_detail: [], // Abbreviated for vested case — full detail in production
  formula: 'SUM(monthly_pensionable_salary x 0.0845)',
}

const case8Interest: InterestSchedule = {
  total_interest: 3668.21,
  interest_rate: 0.02,
  credits: [
    { date: '2019-06-30', balance_before: 6407.41, interest_amount: 128.15, balance_after: 6535.56 },
    { date: '2020-06-30', balance_before: 12302.67, interest_amount: 246.05, balance_after: 12548.72 },
    { date: '2021-06-30', balance_before: 18604.22, interest_amount: 372.08, balance_after: 18976.30 },
    { date: '2022-06-30', balance_before: 25334.59, interest_amount: 506.69, balance_after: 25841.28 },
    { date: '2023-06-30', balance_before: 32517.83, interest_amount: 650.36, balance_after: 33168.19 },
    { date: '2024-06-30', balance_before: 40178.16, interest_amount: 803.56, balance_after: 40981.72 },
    { date: '2025-06-30', balance_before: 48065.42, interest_amount: 961.31, balance_after: 49026.73 },
  ],
  formula: 'balance_at_june_30 x 0.0200, compounded annually on June 30',
}

const case8DeferredComparison: DeferredComparison = {
  refund_gross: 49001.62,
  deferred_monthly_at_65: 1028.45,
  deferred_annual_at_65: 12341.40,
  years_to_age_65: 21,
  breakeven_years_after_65: 4.0,
  lifetime_value_at_85: 246828.00,
  formula: 'AMS 7258.85 x 0.020 x 7.08 years = 1028.45/month at age 65',
}

const case8TaxDirect: TaxWithholdingResult = {
  gross_refund: 49001.62,
  election_type: 'direct_payment',
  withholding_rate: 0.20,
  withholding_amount: 9800.32,
  net_payment: 39201.30,
  formula: '49001.62 x 20% = 9800.32 withholding',
}

const case8TaxRollover: TaxWithholdingResult = {
  gross_refund: 49001.62,
  election_type: 'direct_rollover',
  withholding_rate: 0,
  withholding_amount: 0,
  rollover_amount: 49001.62,
  net_payment: 49001.62,
  formula: 'Full rollover — no withholding',
}

const case8Refund: RefundCalculation = {
  member_id: '10008',
  eligibility: case8Eligibility,
  contributions: case8Contributions,
  interest: case8Interest,
  gross_refund: 49001.62,
  tax_options: [case8TaxDirect, case8TaxRollover],
  deferred_comparison: case8DeferredComparison,
  audit_trail: [
    ...case8Eligibility.audit_trail,
    {
      rule_id: 'RULE-REFUND-CONTRIB',
      rule_name: 'Contribution Accumulation',
      description: '85 months of contributions at 8.45%',
      result: '$45,333.41 total employee contributions',
      source_reference: 'RMC §18-403(b)',
    },
    {
      rule_id: 'RULE-REFUND-INTEREST',
      rule_name: 'Interest on Contributions',
      description: '2.0% annual, compounded June 30, 7 compounding periods',
      result: '$3,668.21 total accrued interest',
      source_reference: 'RMC §18-403(c)',
    },
    {
      rule_id: 'RULE-REFUND-GROSS',
      rule_name: 'Gross Refund',
      description: '$45,333.41 contributions + $3,668.21 interest',
      result: '$49,001.62 gross refund',
      source_reference: 'RMC §18-403',
    },
    {
      rule_id: 'RULE-REFUND-DEFERRED',
      rule_name: 'Deferred Pension Comparison',
      description: 'Projected deferred benefit at age 65',
      result: '$1,028.45/month — breakeven ~4.0 years after 65',
      source_reference: 'RMC §18-404, §18-409(a)',
    },
  ],
}

// ─── Demo Data Registry ────────────────────────────────────────────────────

export const DEMO_REFUND_MEMBERS: Record<string, Member> = {
  '10007': case7Member,
  '10008': case8Member,
}

export const DEMO_REFUND_CALCULATIONS: Record<string, RefundCalculation> = {
  '10007': case7Refund,
  '10008': case8Refund,
}

// ─── Demo API ──────────────────────────────────────────────────────────────

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export const refundDemoApi = {
  getRefundMember: (id: string) => {
    const m = DEMO_REFUND_MEMBERS[id]
    if (!m) return Promise.reject(new Error(`Demo refund member ${id} not found. Try 10007 or 10008.`))
    return delay(m)
  },

  calculateRefund: (memberId: string) => {
    const r = DEMO_REFUND_CALCULATIONS[memberId]
    if (!r) return Promise.reject(new Error(`No refund calculation for ${memberId}`))
    return delay(r)
  },
}
