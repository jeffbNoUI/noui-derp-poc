/**
 * Demo data fixtures for all 4+1 demonstration cases.
 * These are cached responses matching the hand-calculated test fixtures.
 * Used in demo mode when backend services are not available.
 *
 * Values verified against test fixtures in demo-cases/*.json and
 * hand calculations in demo-cases/*.md.
 *
 * Consumed by: useMember.ts, useCalculations.ts, demo-verify.test.ts, BenefitWorkspace.tsx
 * Depends on: Member.ts types
 */
import type {
  Member, EmploymentEvent, SalaryRecord, AMSResult, ServiceCreditSummary,
  Beneficiary, DRORecord, EligibilityResult, BenefitResult,
  PaymentOptionsResult, ScenarioResult, DROResult, ServicePurchaseQuote,
} from '@/types/Member'

// ─── Case 1: Robert Martinez — Tier 1, Rule of 75, Leave Payout ─────────────

const case1Member: Member = {
  member_id: '10001',
  first_name: 'Robert',
  last_name: 'Martinez',
  date_of_birth: '1963-03-08',
  hire_date: '1997-06-15',
  tier: 1,
  status: 'Active',
  department: 'Public Works',
  position: 'Senior Engineer',
}

const case1Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '1997-06-15', department: 'Public Works', position: 'Engineer I' },
  { event_type: 'promotion', effective_date: '2003-03-01', department: 'Public Works', position: 'Engineer II' },
  { event_type: 'promotion', effective_date: '2010-07-01', department: 'Public Works', position: 'Senior Engineer' },
]

const case1ServiceCredit: ServiceCreditSummary = {
  total_service_years: 28.75,
  earned_service_years: 28.75,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 28.75,
  total_for_benefit: 28.75,
}

const case1AMS: AMSResult = {
  ams_amount: 10639.45,
  window_months: 36,
  window_start: '2023-04-01',
  window_end: '2026-03-31',
  monthly_salaries: [],
}

const case1Eligibility: EligibilityResult = {
  member_id: '10001',
  retirement_date: '2026-04-01',
  tier: 1,
  age_at_retirement: 63,
  eligible: true,
  retirement_type: 'rule_of_75',
  rule_of_n_value: 91.75,
  rule_of_n_threshold: 75,
  reduction_factor: 1.0,
  conditions_met: [
    'Vested: 28.75 years >= 5 years required',
    'Rule of 75: age 63 + service 28.75 = 91.75 >= 75',
    'Minimum age met: 63 >= 55',
    'Leave payout eligible: hired before 2010-01-01',
  ],
  conditions_unmet: [],
  audit_trail: [
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting requirement', result: 'PASS: 28.75 >= 5.00', source_reference: 'RMC §18-403' },
    { rule_id: 'RULE-ELIG-075', rule_name: 'Rule of 75', description: 'Age + earned service >= 75', result: 'PASS: 63 + 28.75 = 91.75', source_reference: 'RMC §18-408(b)' },
    { rule_id: 'RULE-ELIG-LV', rule_name: 'Leave Payout', description: 'Hired before 2010, Tier 1/2', result: 'ELIGIBLE', source_reference: 'RMC §18-412' },
  ],
}

const case1Benefit: BenefitResult = {
  member_id: '10001',
  retirement_date: '2026-04-01',
  tier: 1,
  ams: 10639.45,
  ams_window_months: 36,
  service_years_for_benefit: 28.75,
  multiplier: 0.02,
  gross_annual_benefit: 73376.16,
  gross_monthly_benefit: 6117.68,
  reduction_factor: 1.0,
  retirement_type: 'rule_of_75',
  net_monthly_benefit: 6117.68,
  formula_display: '$10,639.45 × 2.00% × 28.75 years = $6,117.68/month',
  ipr: {
    annual_amount: 4312.50,
    monthly_amount: 359.38,
    rate_per_year: 150.00,
    eligible_service_years: 28.75,
    medicare_eligible: false,
  },
  death_benefit: { amount: 5000, tier: 1, retirement_type: 'rule_of_75' },
  audit_trail: [
    { rule_id: 'RULE-AMS-001', rule_name: 'AMS Calculation', description: 'Highest 36 consecutive months', result: '$10,639.45', source_reference: 'RMC §18-401(3)' },
    { rule_id: 'RULE-MULT-001', rule_name: 'Multiplier', description: 'Tier 1 benefit multiplier', result: '2.00%', source_reference: 'RMC §18-408(a)' },
    { rule_id: 'RULE-CALC-001', rule_name: 'Benefit Formula', description: 'AMS × multiplier × service', result: '$6,117.68', source_reference: 'RMC §18-408' },
    { rule_id: 'RULE-IPR-001', rule_name: 'IPR', description: 'Earned service × $12.50/yr ÷ 12', result: '$359.38/mo', source_reference: 'RMC §18-415' },
    { rule_id: 'RULE-DEATH-001', rule_name: 'Death Benefit', description: 'Lump sum for Rule of 75', result: '$5,000.00', source_reference: 'RMC §18-411(d)' },
  ],
}

const case1PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 6117.68,
  options: [
    { option_name: 'Maximum', option_type: 'maximum', monthly_amount: 6117.68, reduction_factor: 1.0, description: 'Full benefit amount, no survivor benefit.' },
    { option_name: '100% Joint & Survivor', option_type: 'j&s_100', monthly_amount: 5414.15, reduction_factor: 0.8850, survivor_pct: 100, description: 'Reduced benefit; 100% continues to survivor.' },
    { option_name: '75% Joint & Survivor', option_type: 'j&s_75', monthly_amount: 5597.68, reduction_factor: 0.9150, survivor_pct: 75, description: 'Reduced benefit; 75% continues to survivor.' },
    { option_name: '50% Joint & Survivor', option_type: 'j&s_50', monthly_amount: 5781.21, reduction_factor: 0.9450, survivor_pct: 50, description: 'Reduced benefit; 50% continues to survivor.' },
  ],
}

const case1Beneficiaries: Beneficiary[] = [
  { name: 'Elena Martinez', relationship: 'Spouse', allocation_pct: 100, date_of_birth: '1966-09-15' },
]

// ─── Case 2: Jennifer Kim — Tier 2, Purchased Service, Early Retirement ──────

const case2Member: Member = {
  member_id: '10002',
  first_name: 'Jennifer',
  last_name: 'Kim',
  date_of_birth: '1970-06-22',
  hire_date: '2008-03-01',
  tier: 2,
  status: 'Active',
  department: 'Finance',
  position: 'Budget Analyst III',
}

const case2Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '2008-03-01', department: 'Finance', position: 'Budget Analyst I' },
  { event_type: 'promotion', effective_date: '2012-07-01', department: 'Finance', position: 'Budget Analyst II' },
  { event_type: 'promotion', effective_date: '2019-01-01', department: 'Finance', position: 'Budget Analyst III' },
]

const case2ServiceCredit: ServiceCreditSummary = {
  total_service_years: 21.17,
  earned_service_years: 18.17,
  purchased_service_years: 3.00,
  military_service_years: 0,
  total_for_eligibility: 18.17,
  total_for_benefit: 21.17,
}

const case2AMS: AMSResult = {
  ams_amount: 7347.62,
  window_months: 36,
  window_start: '2023-05-01',
  window_end: '2026-04-30',
  monthly_salaries: [],
}

const case2Eligibility: EligibilityResult = {
  member_id: '10002',
  retirement_date: '2026-05-01',
  tier: 2,
  age_at_retirement: 55,
  eligible: true,
  retirement_type: 'early',
  rule_of_n_value: 73.17,
  rule_of_n_threshold: 75,
  reduction_factor: 0.70,
  conditions_met: [
    'Vested: 18.17 years >= 5 years required',
    'Minimum early retirement age met: 55 >= 55',
    'Leave payout eligible: hired before 2010-01-01',
  ],
  conditions_unmet: [
    'Rule of 75: age 55 + earned 18.17 = 73.17 < 75 (purchased service excluded)',
    'Normal retirement: age 55 < 65',
  ],
  audit_trail: [
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting requirement', result: 'PASS: 18.17 >= 5.00', source_reference: 'RMC §18-403' },
    { rule_id: 'RULE-ELIG-075', rule_name: 'Rule of 75', description: 'Age + earned service >= 75', result: 'FAIL: 55 + 18.17 = 73.17 < 75', source_reference: 'RMC §18-408(b)' },
    { rule_id: 'RULE-ELIG-EARLY', rule_name: 'Early Retirement', description: 'Age >= 55 for Tier 2', result: 'PASS: 55 >= 55', source_reference: 'RMC §18-409' },
    { rule_id: 'RULE-REDUCE-T2', rule_name: 'Reduction', description: '3% per year under 65', result: '30% reduction (factor 0.70)', source_reference: 'RMC §18-409(b)' },
  ],
}

const case2Benefit: BenefitResult = {
  member_id: '10002',
  retirement_date: '2026-05-01',
  tier: 2,
  ams: 7347.62,
  ams_window_months: 36,
  service_years_for_benefit: 21.17,
  multiplier: 0.015,
  gross_annual_benefit: 27995.52,
  gross_monthly_benefit: 2332.96,
  reduction_factor: 0.70,
  retirement_type: 'early',
  net_monthly_benefit: 1633.07,
  formula_display: '$7,347.62 × 1.50% × 21.17 years × 0.70 = $1,633.07/month',
  ipr: {
    annual_amount: 2725.56,
    monthly_amount: 227.13,
    rate_per_year: 150.00,
    eligible_service_years: 18.17,
    medicare_eligible: false,
  },
  death_benefit: { amount: 2500, tier: 2, retirement_type: 'early' },
  audit_trail: [
    { rule_id: 'RULE-AMS-001', rule_name: 'AMS Calculation', description: 'Highest 36 consecutive months', result: '$7,347.62', source_reference: 'RMC §18-401(3)' },
    { rule_id: 'RULE-MULT-002', rule_name: 'Multiplier', description: 'Tier 2 benefit multiplier', result: '1.50%', source_reference: 'RMC §18-408(a)' },
    { rule_id: 'RULE-CALC-001', rule_name: 'Benefit Formula', description: 'AMS × multiplier × service', result: '$2,332.96 (unreduced)', source_reference: 'RMC §18-408' },
    { rule_id: 'RULE-REDUCE-T2', rule_name: 'Early Retirement Reduction', description: '3% × 10 years = 30%', result: '$1,633.07 (reduced)', source_reference: 'RMC §18-409(b)' },
    { rule_id: 'RULE-IPR-001', rule_name: 'IPR', description: 'Earned service only × $12.50/yr ÷ 12', result: '$227.13/mo', source_reference: 'RMC §18-415' },
    { rule_id: 'RULE-DEATH-EARLY', rule_name: 'Death Benefit', description: '$5,000 - $250/yr × 10 years under 65', result: '$2,500.00', source_reference: 'RMC §18-411(d)' },
  ],
}

const case2PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 1633.07,
  options: [
    { option_name: 'Maximum', option_type: 'maximum', monthly_amount: 1633.07, reduction_factor: 1.0, description: 'Full benefit amount, no survivor benefit.' },
    { option_name: '100% Joint & Survivor', option_type: 'j&s_100', monthly_amount: 1445.27, reduction_factor: 0.8850, survivor_pct: 100, description: 'Reduced benefit; 100% continues to survivor.' },
    { option_name: '75% Joint & Survivor', option_type: 'j&s_75', monthly_amount: 1494.26, reduction_factor: 0.9150, survivor_pct: 75, description: 'Reduced benefit; 75% continues to survivor.' },
    { option_name: '50% Joint & Survivor', option_type: 'j&s_50', monthly_amount: 1543.25, reduction_factor: 0.9450, survivor_pct: 50, description: 'Reduced benefit; 50% continues to survivor.' },
  ],
}

const case2Beneficiaries: Beneficiary[] = [
  { name: 'Estate', relationship: 'Estate', allocation_pct: 100 },
]

// ─── Case 3: David Washington — Tier 3, Early Retirement ─────────────────────

const case3Member: Member = {
  member_id: '10003',
  first_name: 'David',
  last_name: 'Washington',
  date_of_birth: '1963-02-14',
  hire_date: '2012-09-01',
  tier: 3,
  status: 'Active',
  department: 'Parks and Recreation',
  position: 'Program Manager',
}

const case3Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '2012-09-01', department: 'Parks and Recreation', position: 'Program Coordinator' },
  { event_type: 'promotion', effective_date: '2017-03-01', department: 'Parks and Recreation', position: 'Program Manager' },
]

const case3ServiceCredit: ServiceCreditSummary = {
  total_service_years: 13.58,
  earned_service_years: 13.58,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 13.58,
  total_for_benefit: 13.58,
}

const case3AMS: AMSResult = {
  ams_amount: 6684.52,
  window_months: 60,
  window_start: '2021-04-01',
  window_end: '2026-03-31',
  monthly_salaries: [],
}

const case3Eligibility: EligibilityResult = {
  member_id: '10003',
  retirement_date: '2026-04-01',
  tier: 3,
  age_at_retirement: 63,
  eligible: true,
  retirement_type: 'early',
  rule_of_n_value: 76.58,
  rule_of_n_threshold: 85,
  reduction_factor: 0.88,
  conditions_met: [
    'Vested: 13.58 years >= 5 years required',
    'Minimum early retirement age met: 63 >= 60',
  ],
  conditions_unmet: [
    'Rule of 85: age 63 + service 13.58 = 76.58 < 85',
    'Normal retirement: age 63 < 65',
  ],
  audit_trail: [
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting requirement', result: 'PASS: 13.58 >= 5.00', source_reference: 'RMC §18-403' },
    { rule_id: 'RULE-ELIG-085', rule_name: 'Rule of 85', description: 'Age + service >= 85', result: 'FAIL: 63 + 13.58 = 76.58 < 85', source_reference: 'RMC §18-408(c)' },
    { rule_id: 'RULE-ELIG-EARLY', rule_name: 'Early Retirement', description: 'Age >= 60 for Tier 3', result: 'PASS: 63 >= 60', source_reference: 'RMC §18-409' },
    { rule_id: 'RULE-REDUCE-T3', rule_name: 'Reduction', description: '6% per year under 65', result: '12% reduction (factor 0.88)', source_reference: 'RMC §18-409(b)' },
  ],
}

const case3Benefit: BenefitResult = {
  member_id: '10003',
  retirement_date: '2026-04-01',
  tier: 3,
  ams: 6684.52,
  ams_window_months: 60,
  service_years_for_benefit: 13.58,
  multiplier: 0.015,
  gross_annual_benefit: 16336.80,
  gross_monthly_benefit: 1361.40,
  reduction_factor: 0.88,
  retirement_type: 'early',
  net_monthly_benefit: 1198.03,
  formula_display: '$6,684.52 × 1.50% × 13.58 years × 0.88 = $1,198.03/month',
  ipr: {
    annual_amount: 2037.00,
    monthly_amount: 169.75,
    rate_per_year: 150.00,
    eligible_service_years: 13.58,
    medicare_eligible: false,
  },
  death_benefit: { amount: 4000, tier: 3, retirement_type: 'early' },
  audit_trail: [
    { rule_id: 'RULE-AMS-001', rule_name: 'AMS Calculation', description: 'Highest 60 consecutive months (Tier 3)', result: '$6,684.52', source_reference: 'RMC §18-401(3)' },
    { rule_id: 'RULE-MULT-003', rule_name: 'Multiplier', description: 'Tier 3 benefit multiplier', result: '1.50%', source_reference: 'RMC §18-408(a)' },
    { rule_id: 'RULE-CALC-001', rule_name: 'Benefit Formula', description: 'AMS × multiplier × service', result: '$1,361.40 (unreduced)', source_reference: 'RMC §18-408' },
    { rule_id: 'RULE-REDUCE-T3', rule_name: 'Early Retirement Reduction', description: '6% × 2 years = 12%', result: '$1,198.03 (reduced)', source_reference: 'RMC §18-409(b)' },
    { rule_id: 'RULE-IPR-001', rule_name: 'IPR', description: 'Earned service × $12.50/yr ÷ 12', result: '$169.75/mo', source_reference: 'RMC §18-415' },
    { rule_id: 'RULE-DEATH-EARLY-T3', rule_name: 'Death Benefit', description: '$5,000 - $500/yr × 2 years under 65', result: '$4,000.00', source_reference: 'RMC §18-411(d)' },
  ],
}

const case3PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 1198.03,
  options: [
    { option_name: 'Maximum', option_type: 'maximum', monthly_amount: 1198.03, reduction_factor: 1.0, description: 'Full benefit amount, no survivor benefit.' },
    { option_name: '100% Joint & Survivor', option_type: 'j&s_100', monthly_amount: 1060.26, reduction_factor: 0.8850, survivor_pct: 100, description: 'Reduced benefit; 100% continues to survivor.' },
    { option_name: '75% Joint & Survivor', option_type: 'j&s_75', monthly_amount: 1096.20, reduction_factor: 0.9150, survivor_pct: 75, description: 'Reduced benefit; 75% continues to survivor.' },
    { option_name: '50% Joint & Survivor', option_type: 'j&s_50', monthly_amount: 1132.14, reduction_factor: 0.9450, survivor_pct: 50, description: 'Reduced benefit; 50% continues to survivor.' },
  ],
}

const case3Beneficiaries: Beneficiary[] = [
  { name: 'Michelle Washington', relationship: 'Spouse', allocation_pct: 100, date_of_birth: '1965-08-03' },
]

// ─── Case 4: Robert Martinez DRO — Same member as Case 1, with DRO ──────────

const case4DRORecords: DRORecord[] = [
  {
    dro_id: 'DRO-100001',
    case_number: '2017-DR-4521',
    alternate_payee_name: 'Patricia Martinez',
    division_method: 'percentage',
    division_pct: 40,
    marriage_date: '1999-08-15',
    divorce_date: '2017-11-03',
    status: 'approved',
  },
]

const case4DROResult: DROResult = {
  dro_id: 'DRO-100001',
  total_service_years: 28.75,
  marital_service_years: 18.25,
  marital_fraction: 0.6348,
  member_gross_benefit: 6117.68,
  marital_share: 3883.10,
  alternate_payee_amount: 1553.24,
  member_net_after_dro: 4564.44,
  division_method: 'percentage',
  alternate_payee_name: 'Patricia Martinez',
  audit_trail: [
    { rule_id: 'RULE-DRO-MARITAL', rule_name: 'Marital Service', description: 'Marriage 1999-08-15 to divorce 2017-11-03', result: '18.25 years', source_reference: 'RMC §18-420' },
    { rule_id: 'RULE-DRO-FRACTION', rule_name: 'Marital Fraction', description: '18.25 / 28.75', result: '0.6348', source_reference: 'RMC §18-420' },
    { rule_id: 'RULE-DRO-SHARE', rule_name: 'Marital Share', description: '$6,117.68 × 0.6348', result: '$3,883.10', source_reference: 'RMC §18-420' },
    { rule_id: 'RULE-DRO-DIVIDE', rule_name: 'Division', description: '40% of marital share', result: '$1,553.24 to alt payee', source_reference: 'Court Order 2017-DR-4521' },
  ],
}

const case4PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 4564.44,
  options: [
    { option_name: 'Maximum', option_type: 'maximum', monthly_amount: 4564.44, reduction_factor: 1.0, description: 'Full benefit after DRO split, no survivor benefit.' },
    { option_name: '100% Joint & Survivor', option_type: 'j&s_100', monthly_amount: 4039.53, reduction_factor: 0.8850, survivor_pct: 100, description: 'Reduced benefit; 100% continues to survivor.' },
    { option_name: '75% Joint & Survivor', option_type: 'j&s_75', monthly_amount: 4176.46, reduction_factor: 0.9150, survivor_pct: 75, description: 'Reduced benefit; 75% continues to survivor.' },
    { option_name: '50% Joint & Survivor', option_type: 'j&s_50', monthly_amount: 4313.40, reduction_factor: 0.9450, survivor_pct: 50, description: 'Reduced benefit; 50% continues to survivor.' },
  ],
}

// ─── Case 11: Lisa Chen — Tier 2, Service Purchase (Governmental) ────────────
// Source: demo-cases/case11-chen-service-purchase-test-fixture.json
// Hand calc: demo-cases/case11-chen-service-purchase-calculation.md
// Key: Tier 2, age 48, hired Oct 1 2005, salary $78,000/yr ($6,500/mo)
// Purchasing 3.0 years of prior governmental service (State of Colorado)

const case11Member: Member = {
  member_id: '10011',
  first_name: 'Lisa',
  last_name: 'Chen',
  date_of_birth: '1978-06-22',
  hire_date: '2005-10-01',
  tier: 2,
  status: 'Active',
  department: 'Finance',
  position: 'Senior Financial Analyst',
}

const case11Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '2005-10-01', department: 'Finance', position: 'Financial Analyst I' },
  { event_type: 'promotion', effective_date: '2012-04-01', department: 'Finance', position: 'Financial Analyst II' },
  { event_type: 'promotion', effective_date: '2018-07-01', department: 'Finance', position: 'Senior Financial Analyst' },
]

// Pre-purchase state: 20.33 years earned, 0 purchased
const case11ServiceCredit: ServiceCreditSummary = {
  total_service_years: 20.33,
  earned_service_years: 20.33,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 20.33,
  total_for_benefit: 20.33,
}

const case11AMS: AMSResult = {
  ams_amount: 6500.00, // Current monthly salary — used as AMS proxy for purchase analysis
  window_months: 36,
  window_start: '2023-03-01',
  window_end: '2026-02-28',
  monthly_salaries: [],
}

// Eligibility at current age (48) — not yet eligible for retirement
const case11Eligibility: EligibilityResult = {
  member_id: '10011',
  retirement_date: '2026-02-15', // Quote date used as reference
  tier: 2,
  age_at_retirement: 48,
  eligible: false,
  retirement_type: 'not_eligible',
  rule_of_n_value: 68.33, // age 48 + earned 20.33 = 68.33
  rule_of_n_threshold: 75,
  reduction_factor: 1.0,
  conditions_met: [
    'Vested: 20.33 years >= 5 years required',
  ],
  conditions_unmet: [
    'Rule of 75: age 48 + earned 20.33 = 68.33 < 75 (purchased service excluded per RMC §18-415(a))',
    'Minimum early retirement age: 48 < 55',
    'Normal retirement: age 48 < 65',
  ],
  audit_trail: [
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting requirement', result: 'PASS: 20.33 >= 5.00', source_reference: 'RMC §18-403' },
    { rule_id: 'RULE-ELIG-075', rule_name: 'Rule of 75', description: 'Age + earned service >= 75', result: 'FAIL: 48 + 20.33 = 68.33 < 75', source_reference: 'RMC §18-408(b)' },
    { rule_id: 'RULE-ELIG-AGE', rule_name: 'Min Age', description: 'Minimum age 55 for Tier 2', result: 'FAIL: 48 < 55', source_reference: 'RMC §18-409' },
  ],
}

// Benefit projection at current values (pre-purchase, no reduction applied — active analysis)
const case11Benefit: BenefitResult = {
  member_id: '10011',
  retirement_date: '2026-02-15',
  tier: 2,
  ams: 6500.00,
  ams_window_months: 36,
  service_years_for_benefit: 20.33,
  multiplier: 0.015,
  // 0.015 x 6500 x 20.33 = 1982.175 → 1982.18
  gross_annual_benefit: 23786.10,
  gross_monthly_benefit: 1982.18,
  reduction_factor: 1.0, // No reduction for projection — active member
  retirement_type: 'projection',
  net_monthly_benefit: 1982.18,
  formula_display: '$6,500.00 × 1.50% × 20.33 years = $1,982.18/month',
  audit_trail: [
    { rule_id: 'RULE-MULT-002', rule_name: 'Multiplier', description: 'Tier 2 benefit multiplier', result: '1.50%', source_reference: 'RMC §18-408(a)' },
    { rule_id: 'RULE-CALC-001', rule_name: 'Benefit Formula', description: 'AMS × multiplier × service', result: '$1,982.18 (projected, unreduced)', source_reference: 'RMC §18-408' },
  ],
}

// Full service purchase quote — all values verified TO THE PENNY against test fixture
// Cost: 0.0860 x $78,000 x 3.0 = $20,124.00
// Benefit increase: $292.50/mo, breakeven 69 months
const case11PurchaseQuote: ServicePurchaseQuote = {
  quote_date: '2026-02-15',
  expiration_date: '2026-05-16',
  member_age: 48,
  tier: 2,
  service_type: 'governmental',
  years_requested: 3.0,
  prior_employer: 'State of Colorado, Department of Revenue',
  prior_employment_start: '2002-08-15',
  prior_employment_end: '2005-09-25',
  // RULE-PURCHASE-COST-FACTOR: T2, age 48 → 0.0860 — RMC §18-415(c)
  cost_factor: 0.0860,
  current_annual_salary: 78000.00,
  cost_per_year: 6708.00,   // 0.0860 x $78,000
  total_cost: 20124.00,     // 0.0860 x $78,000 x 3.0
  payment_options: {
    lump_sum: {
      amount: 20124.00,
      interest: 0.00,
      total: 20124.00,
    },
    payroll_deduction: {
      // Standard amortization: P x r(1+r)^n / ((1+r)^n - 1)
      // r = 0.03/12 = 0.0025, n = 60
      monthly_payment: 361.56,
      number_of_payments: 60,
      annual_interest_rate: 0.03,
      total_paid: 21693.60,     // 361.56 x 60
      interest_cost: 1569.60,   // 21693.60 - 20124.00
    },
    rollover: {
      amount: 20124.00,
      tax_impact: 'none', // Direct trustee-to-trustee transfer
    },
  },
  benefit_impact: {
    // Before: 1.5% x $6,500 x 20.33 = $1,982.18/mo
    current_monthly: 1982.18,
    // After: 1.5% x $6,500 x 23.33 = $2,274.68/mo
    projected_monthly: 2274.68,
    monthly_increase: 292.50,     // $2,274.68 - $1,982.18
    annual_increase: 3510.00,     // $292.50 x 12
    breakeven_months: 69,         // $20,124.00 / $292.50 = 68.8 → 69
    breakeven_years: 5.8,         // 69 / 12
  },
  eligibility_exclusion: {
    // CRITICAL: Purchased service EXCLUDED from Rule of 75 — RMC §18-415(a)
    rule_of_n_sum_without: 68.33, // age 48 + 20.33 earned
    rule_of_n_sum_with: 68.33,    // SAME — purchased 3.0 excluded
    purchased_excluded: true,
  },
  valid: true,
  governing_rules: [
    'RULE-PURCHASE-ELIGIBILITY',
    'RULE-PURCHASE-COST-FACTOR',
    'RULE-PURCHASE-PAYMENT-OPTIONS',
    'RULE-PURCHASE-BENEFIT-IMPACT',
    'RULE-PURCHASE-QUOTE-VALIDITY',
  ],
  audit_trail: [
    { rule_id: 'RULE-PURCHASE-ELIGIBILITY', rule_name: 'Purchase Eligibility', description: 'Active, vested, governmental, 3.0 years', result: 'ELIGIBLE', source_reference: 'RMC §18-415(a)' },
    { rule_id: 'RULE-PURCHASE-COST-FACTOR', rule_name: 'Cost Factor', description: 'T2, age 48 → factor 0.0860', result: '$20,124.00', source_reference: 'RMC §18-415(c)' },
    { rule_id: 'RULE-PURCHASE-PAYMENT-OPTIONS', rule_name: 'Payment Options', description: 'Lump sum / 60-mo payroll / rollover', result: '3 options presented', source_reference: 'RMC §18-415(d)' },
    { rule_id: 'RULE-PURCHASE-BENEFIT-IMPACT', rule_name: 'Benefit Impact', description: '+$292.50/mo, breakeven 69 months', result: '$1,982.18 → $2,274.68', source_reference: 'RMC §18-415(a)' },
    { rule_id: 'RULE-PURCHASE-QUOTE-VALIDITY', rule_name: 'Quote Validity', description: '90-day window from Feb 15 2026', result: 'Valid until May 16 2026', source_reference: 'DERP Admin Practice' },
  ],
}

// ─── Demo Data Registry ──────────────────────────────────────────────────────

const DEMO_MEMBERS: Record<string, Member> = {
  '10001': case1Member,
  '10002': case2Member,
  '10003': case3Member,
  '10004': case1Member,
  '10011': case11Member,
}

const DEMO_EMPLOYMENT: Record<string, EmploymentEvent[]> = {
  '10001': case1Employment,
  '10002': case2Employment,
  '10003': case3Employment,
  '10004': case1Employment,
  '10011': case11Employment,
}

const DEMO_SERVICE_CREDIT: Record<string, ServiceCreditSummary> = {
  '10001': case1ServiceCredit,
  '10002': case2ServiceCredit,
  '10003': case3ServiceCredit,
  '10004': case1ServiceCredit,
  '10011': case11ServiceCredit,
}

const DEMO_AMS: Record<string, AMSResult> = {
  '10001': case1AMS,
  '10002': case2AMS,
  '10003': case3AMS,
  '10004': case1AMS,
  '10011': case11AMS,
}

const DEMO_ELIGIBILITY: Record<string, EligibilityResult> = {
  '10001': case1Eligibility,
  '10002': case2Eligibility,
  '10003': case3Eligibility,
  '10004': case1Eligibility,
  '10011': case11Eligibility,
}

const DEMO_BENEFIT: Record<string, BenefitResult> = {
  '10001': case1Benefit,
  '10002': case2Benefit,
  '10003': case3Benefit,
  '10004': case1Benefit,
  '10011': case11Benefit,
}

const DEMO_PAYMENT_OPTIONS: Record<string, PaymentOptionsResult> = {
  '10001': case1PaymentOptions,
  '10002': case2PaymentOptions,
  '10003': case3PaymentOptions,
  '10004': case4PaymentOptions,
}

const DEMO_BENEFICIARIES: Record<string, Beneficiary[]> = {
  '10001': case1Beneficiaries,
  '10002': case2Beneficiaries,
  '10003': case3Beneficiaries,
  '10004': case1Beneficiaries,
  '10011': [],
}

const DEMO_DROS: Record<string, DRORecord[]> = {
  '10001': [],
  '10002': [],
  '10003': [],
  '10004': case4DRORecords,
  '10011': [],
}

const DEMO_DRO_RESULT: Record<string, DROResult> = {
  '10004': case4DROResult,
}

const DEMO_PURCHASE_QUOTES: Record<string, ServicePurchaseQuote> = {
  '10011': case11PurchaseQuote,
}

// ─── Demo Data API (simulates network delay) ─────────────────────────────────

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === 'true' ||
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
}

export const demoApi = {
  getMember: (id: string) => {
    const m = DEMO_MEMBERS[id]
    if (!m) return Promise.reject(new Error(`Demo member ${id} not found. Try 10001-10004, 10011.`))
    return delay(m)
  },

  getEmployment: (id: string) => delay(DEMO_EMPLOYMENT[id] ?? []),

  getSalary: (id: string) => {
    const ams = DEMO_AMS[id]
    return delay({ records: [] as SalaryRecord[], ams: ams ?? { ams_amount: 0, window_months: 0, window_start: '', window_end: '', monthly_salaries: [] } })
  },

  getServiceCredit: (id: string) => delay(DEMO_SERVICE_CREDIT[id] ?? { total_service_years: 0, earned_service_years: 0, purchased_service_years: 0, military_service_years: 0, total_for_eligibility: 0, total_for_benefit: 0 }),

  getBeneficiaries: (id: string) => delay(DEMO_BENEFICIARIES[id] ?? []),

  getDROs: (id: string) => delay(DEMO_DROS[id] ?? []),

  evaluateEligibility: (memberId: string, _retirementDate: string) => {
    const e = DEMO_ELIGIBILITY[memberId]
    if (!e) return Promise.reject(new Error(`No demo eligibility for ${memberId}`))
    return delay(e)
  },

  calculateBenefit: (memberId: string, _retirementDate: string) => {
    const b = DEMO_BENEFIT[memberId]
    if (!b) return Promise.reject(new Error(`No demo benefit for ${memberId}`))
    return delay(b)
  },

  calculatePaymentOptions: (memberId: string, _retirementDate: string) => {
    const p = DEMO_PAYMENT_OPTIONS[memberId]
    if (!p) return Promise.reject(new Error(`No demo payment options for ${memberId}`))
    return delay(p)
  },

  calculateScenarios: (memberId: string, retirementDates: string[]) => {
    const b = DEMO_BENEFIT[memberId]
    if (!b) return delay([] as ScenarioResult[])
    const e = DEMO_ELIGIBILITY[memberId]
    return delay(retirementDates.map((d) => ({
      retirement_date: d,
      age_at_retirement: e?.age_at_retirement ?? 63,
      eligible: true,
      retirement_type: e?.retirement_type ?? 'normal',
      reduction_factor: b.reduction_factor,
      net_monthly_benefit: b.net_monthly_benefit,
      annual_benefit: b.net_monthly_benefit * 12,
    })))
  },

  calculateDRO: (memberId: string) => {
    const d = DEMO_DRO_RESULT[memberId]
    if (!d) return Promise.reject(new Error(`No DRO for ${memberId}`))
    return delay(d)
  },

  getPurchaseQuote: (memberId: string) => {
    const q = DEMO_PURCHASE_QUOTES[memberId]
    if (!q) return Promise.reject(new Error(`No purchase quote for ${memberId}`))
    return delay(q)
  },

  saveElection: (election: {
    member_id: string; retirement_date: string; payment_option: string
    monthly_benefit: number; gross_benefit: number; reduction_factor: number
    dro_deduction?: number; ipr_amount?: number; death_benefit_amount?: number
  }) => {
    return delay({
      member_id: election.member_id,
      case_id: 99001,
      status: 'IN_REVIEW',
      message: 'Retirement application submitted successfully. Case created for review.',
      retirement_date: election.retirement_date,
      payment_option: election.payment_option,
    }, 800)
  },
}
