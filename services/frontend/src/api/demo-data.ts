/**
 * Demo data fixtures for all 4 demonstration cases.
 * These are cached responses matching the hand-calculated test fixtures.
 * Used in demo mode when backend services are not available.
 *
 * Values verified against test fixtures in demo-cases/*.json and
 * hand calculations in demo-cases/*.md.
 */
import type {
  Member, EmploymentEvent, SalaryRecord, AMSResult, ServiceCreditSummary,
  Beneficiary, DRORecord, EligibilityResult, BenefitResult,
  PaymentOptionsResult, ScenarioResult, DROResult, ApplicationIntake,
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

// ─── Application Intake Fixtures ─────────────────────────────────────────────
// Document checklists and timeline data for the Application Intake stage (Stage 0).
// Documents vary by marital status, tier, age, and DRO presence.

const case1Intake: ApplicationIntake = {
  application_received_date: '2026-03-10',
  last_day_worked: '2026-03-31',
  retirement_effective_date: '2026-04-01',
  notarization_confirmed: true,
  notarization_date: '2026-03-10',
  deadline_met: true,
  days_before_last_day: 21,
  payment_cutoff_met: true,
  cutoff_date: '2026-03-15',
  first_payment_date: '2026-05-01',
  combined_payment: false,
  package_complete: true,
  complete_package_date: '2026-03-12',
  documents: [
    { doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Retirement Application', required: true, status: 'RECEIVED', received_date: '2026-03-10' },
    { doc_type: 'BIRTH_CERT_MEMBER', doc_name: 'Birth Certificate (Member)', required: true, status: 'RECEIVED', received_date: '2026-03-10' },
    { doc_type: 'BIRTH_CERT_SPOUSE', doc_name: 'Birth Certificate (Spouse)', required: true, conditional_on: 'Married', status: 'RECEIVED', received_date: '2026-03-10' },
    { doc_type: 'MARRIAGE_CERT', doc_name: 'Marriage Certificate', required: true, conditional_on: 'Married', status: 'RECEIVED', received_date: '2026-03-10' },
    { doc_type: 'SS_ESTIMATE', doc_name: 'Social Security Benefit Estimate', required: true, conditional_on: 'Tier 1/2, age 62+', status: 'RECEIVED', received_date: '2026-03-12' },
    { doc_type: 'VOIDED_CHECK', doc_name: 'Voided Check / Direct Deposit Form', required: true, status: 'RECEIVED', received_date: '2026-03-10' },
  ],
}

const case2Intake: ApplicationIntake = {
  application_received_date: '2026-04-08',
  last_day_worked: '2026-04-30',
  retirement_effective_date: '2026-05-01',
  notarization_confirmed: true,
  notarization_date: '2026-04-08',
  deadline_met: true,
  days_before_last_day: 22,
  payment_cutoff_met: true,
  cutoff_date: '2026-04-15',
  first_payment_date: '2026-06-01',
  combined_payment: false,
  package_complete: true,
  complete_package_date: '2026-04-08',
  documents: [
    { doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Retirement Application', required: true, status: 'RECEIVED', received_date: '2026-04-08' },
    { doc_type: 'BIRTH_CERT_MEMBER', doc_name: 'Birth Certificate (Member)', required: true, status: 'RECEIVED', received_date: '2026-04-08' },
    { doc_type: 'VOIDED_CHECK', doc_name: 'Voided Check / Direct Deposit Form', required: true, status: 'RECEIVED', received_date: '2026-04-08' },
  ],
}

const case3Intake: ApplicationIntake = {
  application_received_date: '2026-03-12',
  last_day_worked: '2026-03-31',
  retirement_effective_date: '2026-04-01',
  notarization_confirmed: true,
  notarization_date: '2026-03-12',
  deadline_met: true,
  days_before_last_day: 19,
  payment_cutoff_met: true,
  cutoff_date: '2026-03-15',
  first_payment_date: '2026-05-01',
  combined_payment: false,
  package_complete: true,
  complete_package_date: '2026-03-14',
  documents: [
    { doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Retirement Application', required: true, status: 'RECEIVED', received_date: '2026-03-12' },
    { doc_type: 'BIRTH_CERT_MEMBER', doc_name: 'Birth Certificate (Member)', required: true, status: 'RECEIVED', received_date: '2026-03-12' },
    { doc_type: 'BIRTH_CERT_SPOUSE', doc_name: 'Birth Certificate (Spouse)', required: true, conditional_on: 'Married', status: 'RECEIVED', received_date: '2026-03-12' },
    { doc_type: 'MARRIAGE_CERT', doc_name: 'Marriage Certificate', required: true, conditional_on: 'Married', status: 'RECEIVED', received_date: '2026-03-14' },
    { doc_type: 'VOIDED_CHECK', doc_name: 'Voided Check / Direct Deposit Form', required: true, status: 'RECEIVED', received_date: '2026-03-12' },
  ],
}

const case4Intake: ApplicationIntake = {
  ...case1Intake,
  documents: [
    ...case1Intake.documents,
    { doc_type: 'DECREE_DISSOLUTION', doc_name: 'Decree of Dissolution (DRO)', required: true, conditional_on: 'DRO on file', status: 'RECEIVED', received_date: '2026-03-10' },
  ],
}

// ─── Demo Data Registry ──────────────────────────────────────────────────────

const DEMO_MEMBERS: Record<string, Member> = {
  '10001': case1Member,
  '10002': case2Member,
  '10003': case3Member,
  '10004': case1Member,
}

const DEMO_EMPLOYMENT: Record<string, EmploymentEvent[]> = {
  '10001': case1Employment,
  '10002': case2Employment,
  '10003': case3Employment,
  '10004': case1Employment,
}

const DEMO_SERVICE_CREDIT: Record<string, ServiceCreditSummary> = {
  '10001': case1ServiceCredit,
  '10002': case2ServiceCredit,
  '10003': case3ServiceCredit,
  '10004': case1ServiceCredit,
}

const DEMO_AMS: Record<string, AMSResult> = {
  '10001': case1AMS,
  '10002': case2AMS,
  '10003': case3AMS,
  '10004': case1AMS,
}

const DEMO_ELIGIBILITY: Record<string, EligibilityResult> = {
  '10001': case1Eligibility,
  '10002': case2Eligibility,
  '10003': case3Eligibility,
  '10004': case1Eligibility,
}

const DEMO_BENEFIT: Record<string, BenefitResult> = {
  '10001': case1Benefit,
  '10002': case2Benefit,
  '10003': case3Benefit,
  '10004': case1Benefit,
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
}

const DEMO_DROS: Record<string, DRORecord[]> = {
  '10001': [],
  '10002': [],
  '10003': [],
  '10004': case4DRORecords,
}

const DEMO_DRO_RESULT: Record<string, DROResult> = {
  '10004': case4DROResult,
}

const DEMO_INTAKE: Record<string, ApplicationIntake> = {
  '10001': case1Intake,
  '10002': case2Intake,
  '10003': case3Intake,
  '10004': case4Intake,
}

// ─── Scenario Calculator (deterministic rules engine simulation) ──────────
// Computes projected benefit for each requested retirement date using DERP plan
// provisions. Simulates what the Go backend /api/v1/benefit/scenario would return.
// AMS projected with ~3% annual salary growth for future dates.
// Consumed by: ScenarioModeler.tsx via demoApi.calculateScenarios
// Depends on: DEMO_BENEFIT, DEMO_ELIGIBILITY fixtures (for base date exact values)

/** Tier provisions from RMC — multiplier, eligibility thresholds, reduction rates */
const TIER_PROVISIONS: Record<number, {
  multiplier: number
  ruleOfN: number
  minEarlyAge: number
  reductionPerYear: number  // 3% Tiers 1/2 (RMC §18-409(b)), 6% Tier 3
}> = {
  1: { multiplier: 0.02, ruleOfN: 75, minEarlyAge: 55, reductionPerYear: 0.03 },
  2: { multiplier: 0.015, ruleOfN: 75, minEarlyAge: 55, reductionPerYear: 0.03 },
  3: { multiplier: 0.015, ruleOfN: 85, minEarlyAge: 60, reductionPerYear: 0.06 },
}

/** Member data needed for scenario projection — derived from fixture constants above */
const SCENARIO_MEMBER_DATA: Record<string, {
  dob: string; hireDate: string; tier: number
  purchasedService: number; baseAMS: number; baseRetirementDate: string
}> = {
  '10001': { dob: '1963-03-08', hireDate: '1997-06-15', tier: 1, purchasedService: 0, baseAMS: 10639.45, baseRetirementDate: '2026-04-01' },
  '10002': { dob: '1970-06-22', hireDate: '2008-03-01', tier: 2, purchasedService: 3.00, baseAMS: 7347.62, baseRetirementDate: '2026-05-01' },
  '10003': { dob: '1963-02-14', hireDate: '2012-09-01', tier: 3, purchasedService: 0, baseAMS: 6684.52, baseRetirementDate: '2026-04-01' },
  '10004': { dob: '1963-03-08', hireDate: '1997-06-15', tier: 1, purchasedService: 0, baseAMS: 10639.45, baseRetirementDate: '2026-04-01' },
}

/** Age in completed years at a given date */
function ageAt(dob: string, date: string): number {
  const birth = new Date(dob)
  const d = new Date(date)
  let age = d.getFullYear() - birth.getFullYear()
  const mDiff = d.getMonth() - birth.getMonth()
  if (mDiff < 0 || (mDiff === 0 && d.getDate() < birth.getDate())) age--
  return age
}

/** Service credit in years (complete months / 12) from hire to end date */
function earnedServiceYears(hireDate: string, endDate: string): number {
  const s = new Date(hireDate)
  const e = new Date(endDate)
  const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  return Math.round((months / 12) * 100) / 100
}

/** Compute a single scenario result for a given member + retirement date */
function computeScenario(memberId: string, retirementDate: string): ScenarioResult {
  const md = SCENARIO_MEMBER_DATA[memberId]
  if (!md) {
    return { retirement_date: retirementDate, age_at_retirement: 0, eligible: false, retirement_type: 'unknown', reduction_factor: 0, net_monthly_benefit: 0, annual_benefit: 0 }
  }

  const tp = TIER_PROVISIONS[md.tier]
  const age = ageAt(md.dob, retirementDate)
  const earnedSvc = earnedServiceYears(md.hireDate, retirementDate)
  const totalSvcForBenefit = earnedSvc + md.purchasedService
  // Purchased service excluded from Rule of 75/85 — RMC §18-407(c)
  const totalSvcForEligibility = earnedSvc

  // Project AMS with ~3% annual salary growth (bidirectional from base date)
  const yearsDiff = (new Date(retirementDate).getTime() - new Date(md.baseRetirementDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  const projectedAMS = md.baseAMS * Math.pow(1.03, yearsDiff)

  // Vesting check — 5 years earned service required (RMC §18-403)
  if (earnedSvc < 5) {
    return { retirement_date: retirementDate, age_at_retirement: age, eligible: false, retirement_type: 'not_vested', reduction_factor: 0, net_monthly_benefit: 0, annual_benefit: 0 }
  }

  // Eligibility determination — RMC §18-408, §18-409
  let retirementType: string
  let reductionFactor: number
  const ruleOfNValue = age + totalSvcForEligibility

  if (age >= 65) {
    retirementType = 'normal'
    reductionFactor = 1.0
  } else if (ruleOfNValue >= tp.ruleOfN && age >= tp.minEarlyAge) {
    retirementType = md.tier <= 2 ? 'rule_of_75' : 'rule_of_85'
    reductionFactor = 1.0
  } else if (age >= tp.minEarlyAge) {
    retirementType = 'early'
    const yearsUnder65 = 65 - age
    reductionFactor = Math.round((1.0 - yearsUnder65 * tp.reductionPerYear) * 100) / 100
  } else {
    return { retirement_date: retirementDate, age_at_retirement: age, eligible: false, retirement_type: 'not_eligible', reduction_factor: 0, net_monthly_benefit: 0, annual_benefit: 0 }
  }

  // Benefit formula: AMS × multiplier × total_service × reduction — RMC §18-408
  // Round only the final monthly benefit to cents (CLAUDE.md: carry full precision)
  const netMonthly = Math.round(projectedAMS * tp.multiplier * totalSvcForBenefit * reductionFactor * 100) / 100

  return {
    retirement_date: retirementDate,
    age_at_retirement: age,
    eligible: true,
    retirement_type: retirementType,
    reduction_factor: reductionFactor,
    net_monthly_benefit: netMonthly,
    annual_benefit: Math.round(netMonthly * 12 * 100) / 100,
  }
}

// ─── Demo Data API (simulates network delay) ─────────────────────────────────

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export function isDemoMode(): boolean {
  // Demo mode is the default for the POC — opt OUT with ?live query param
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('live')) {
    return false
  }
  return true
}

export const demoApi = {
  getApplicationIntake: (id: string) => {
    const intake = DEMO_INTAKE[id]
    if (!intake) return Promise.reject(new Error(`No demo intake for ${id}`))
    return delay(intake)
  },

  getMember: (id: string) => {
    const m = DEMO_MEMBERS[id]
    if (!m) return Promise.reject(new Error(`Demo member ${id} not found. Try 10001-10004.`))
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
    const md = SCENARIO_MEMBER_DATA[memberId]
    if (!md) return delay([] as ScenarioResult[])

    const results = retirementDates.map((d) => {
      // For the base retirement date, return exact fixture data (penny-accurate)
      if (d === md.baseRetirementDate) {
        const e = DEMO_ELIGIBILITY[memberId]
        const b = DEMO_BENEFIT[memberId]
        if (e && b) {
          return {
            retirement_date: d,
            age_at_retirement: e.age_at_retirement,
            eligible: e.eligible,
            retirement_type: e.retirement_type,
            reduction_factor: b.reduction_factor,
            net_monthly_benefit: b.net_monthly_benefit,
            annual_benefit: Math.round(b.net_monthly_benefit * 12 * 100) / 100,
          }
        }
      }
      // For other dates, compute projected values
      return computeScenario(memberId, d)
    })
    return delay(results)
  },

  calculateDRO: (memberId: string) => {
    const d = DEMO_DRO_RESULT[memberId]
    if (!d) return Promise.reject(new Error(`No DRO for ${memberId}`))
    return delay(d)
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
