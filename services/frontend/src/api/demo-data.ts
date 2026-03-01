/**
 * COPERA demo data fixtures for 3 demonstration cases.
 * These are cached responses matching hand-calculated test fixtures in demo-cases/copera/.
 * Used in demo mode when backend services are not available.
 *
 * Case 1: Maria Garcia — State Division, PERA 1, Rule of 80, unreduced
 * Case 2: James Chen — School Division, PERA 6, early retirement, anti-spiking triggered
 * Case 3: Sarah Williams — DPS Division, DPS 1, Rule of 80, DPS benefit options
 *
 * Consumed by: usePortal.ts hooks, staff workspace, member portal
 * Depends on: Member.ts types
 */
import type {
  Member, EmploymentEvent, SalaryRecord, AMSResult, ServiceCreditSummary,
  Beneficiary, DRORecord, EligibilityResult, BenefitResult,
  PaymentOptionsResult, ScenarioResult, DROResult, ApplicationIntake, ServicePurchaseQuote,
  AntiSpikingYear,
} from '@/types/Member'

// ─── Case 1: Maria Garcia — State Division, PERA 1, Rule of 80 ─────────────

const case1Member: Member = {
  member_id: 'COPERA-001',
  first_name: 'Maria',
  last_name: 'Garcia',
  date_of_birth: '1963-07-20',
  hire_date: '1998-01-01',
  division: 'State',
  has_table: 1,
  has_table_name: 'PERA 1',
  status: 'Active',
  department: 'Department of Revenue',
  position: 'Senior Financial Analyst',
  marital_status: 'Married',
  contribution_rate_ee: 0.105,
  contribution_rate_er: 0.214,
}

const case1Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '1998-01-01', department: 'Department of Revenue', position: 'Financial Analyst I', employer: 'State of Colorado', division: 'State' },
  { event_type: 'promotion', effective_date: '2005-07-01', department: 'Department of Revenue', position: 'Financial Analyst II' },
  { event_type: 'promotion', effective_date: '2013-03-01', department: 'Department of Revenue', position: 'Senior Financial Analyst' },
]

const case1ServiceCredit: ServiceCreditSummary = {
  total_service_years: 28.00,
  earned_service_years: 28.00,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 28.00,
  total_for_benefit: 28.00,
}

const case1AMS: AMSResult = {
  ams_amount: 7652.78,   // Monthly: $91,833.33 / 12
  window_months: 36,
  window_start: '2023-01-01',
  window_end: '2025-12-31',
  monthly_salaries: [],
  anti_spiking_applied: false,
  annual_has: 91833.33,
}

const case1Eligibility: EligibilityResult = {
  member_id: 'COPERA-001',
  retirement_date: '2026-01-01',
  division: 'State',
  has_table: 1,
  has_table_name: 'PERA 1',
  age_at_retirement: 62,
  eligible: true,
  retirement_type: 'normal',
  rule_of_n_value: 90.00,
  rule_of_n_threshold: 80,
  rule_of_n_label: 'Rule of 80',
  reduction_factor: 1.0,
  conditions_met: [
    'Vested: 28.00 years >= 5 years required',
    'Normal retirement: age 62 >= 60 (PERA 1 normal age)',
    'Rule of 80: age 62 + service 28.00 = 90.00 >= 80',
  ],
  conditions_unmet: [],
  audit_trail: [
    { rule_id: 'RULE-HAS-TABLE', rule_name: 'HAS Table', description: 'HAS table from CMPTIER0', result: 'PERA 1 (pre-2007 membership)', source_reference: 'C.R.S. §24-51-602' },
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting requirement', result: 'PASS: 28.00 >= 5.00', source_reference: 'C.R.S. §24-51-401(1.7)' },
    { rule_id: 'RULE-NORMAL', rule_name: 'Normal Retirement', description: 'PERA 1: age >= 60, vested', result: 'PASS: age 62 >= 60', source_reference: 'C.R.S. §24-51-602(1)(a)' },
    { rule_id: 'RULE-RULE-80', rule_name: 'Rule of 80', description: 'Age + earned service >= 80, min age 55', result: 'PASS: 62 + 28.00 = 90.00 >= 80', source_reference: 'C.R.S. §24-51-602(1)(a)' },
  ],
}

const case1Benefit: BenefitResult = {
  member_id: 'COPERA-001',
  retirement_date: '2026-01-01',
  division: 'State',
  has_table: 1,
  has_table_name: 'PERA 1',
  ams: 7652.78,
  ams_window_months: 36,
  annual_has: 91833.33,
  service_years_for_benefit: 28.00,
  multiplier: 0.025,
  gross_annual_benefit: 64283.33,
  gross_monthly_benefit: 5356.94,
  reduction_factor: 1.0,
  retirement_type: 'normal',
  net_monthly_benefit: 5356.94,
  formula_display: '($91,833.33 × 2.5% × 28.00 years) / 12 = $5,356.94/month',
  anti_spiking_applied: false,
  annual_increase: {
    rate: 0.015,
    first_eligible_date: '2028-03-01',
    compound_method: 'compound',
    note: 'Annual increase of 1.5% compound, effective March 1 of second calendar year after retirement. Source: C.R.S. §24-51-1002.',
  },
  death_benefit: { amount: 5000, has_table: 1, retirement_type: 'normal', description: 'Statutory survivor benefits per C.R.S. §24-51-701' },
  audit_trail: [
    { rule_id: 'RULE-HAS-CALC', rule_name: 'HAS Calculation', description: 'Highest 36 consecutive months (PERA 1)', result: '$91,833.33 annual / $7,652.78 monthly', source_reference: 'C.R.S. §24-51-101(25.5)' },
    { rule_id: 'RULE-ANTISPIKE', rule_name: 'Anti-Spiking Check', description: '108% cascading cap — base year method', result: 'No adjustment needed (all years within 108% cap)', source_reference: 'C.R.S. §24-51-101(25.5)' },
    { rule_id: 'RULE-MULT-001', rule_name: 'Multiplier', description: 'COPERA universal multiplier', result: '2.5%', source_reference: 'C.R.S. §24-51-603' },
    { rule_id: 'RULE-BENEFIT', rule_name: 'Benefit Formula', description: 'HAS × 2.5% × service years', result: '$91,833.33 × 0.025 × 28.00 = $64,283.33/yr = $5,356.94/mo', source_reference: 'C.R.S. §24-51-603' },
  ],
}

const case1PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 5356.94,
  division: 'State',
  options: [
    { option_name: 'option_1', option_type: 'maximum', display_name: 'Option 1 (Maximum)', monthly_amount: 5356.94, reduction_factor: 1.0, description: 'Single life annuity — maximum monthly benefit, no survivor benefit' },
    { option_name: 'option_2', option_type: 'js_50', display_name: 'Option 2 (J&S 50%)', monthly_amount: 5062.31, reduction_factor: 0.945, survivor_pct: 50, survivor_amount: 2531.16, description: 'Joint & survivor — 50% of reduced benefit continues to co-benefit recipient' },
    { option_name: 'option_3', option_type: 'js_100', display_name: 'Option 3 (J&S 100%)', monthly_amount: 4740.89, reduction_factor: 0.885, survivor_pct: 100, survivor_amount: 4740.89, description: 'Joint & survivor — 100% of reduced benefit continues to co-benefit recipient' },
  ],
}

// ─── Case 2: James Chen — School Division, PERA 6, Early Retirement, Anti-Spiking ───

const case2Member: Member = {
  member_id: 'COPERA-002',
  first_name: 'James',
  last_name: 'Chen',
  date_of_birth: '1968-11-15',
  hire_date: '2008-01-01',
  division: 'School',
  has_table: 6,
  has_table_name: 'PERA 6',
  status: 'Active',
  department: 'Denver Public Schools',
  position: 'IT Director',
  marital_status: 'Single',
  contribution_rate_ee: 0.105,
  contribution_rate_er: 0.214,
}

const case2Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '2008-01-01', department: 'Denver Public Schools', position: 'Systems Administrator', employer: 'Denver Public Schools', division: 'School' },
  { event_type: 'promotion', effective_date: '2015-07-01', department: 'Denver Public Schools', position: 'IT Manager' },
  { event_type: 'promotion', effective_date: '2022-01-01', department: 'Denver Public Schools', position: 'IT Director' },
]

const case2ServiceCredit: ServiceCreditSummary = {
  total_service_years: 18.00,
  earned_service_years: 18.00,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 18.00,
  total_for_benefit: 18.00,
}

const case2AntiSpiking: AntiSpikingYear[] = [
  { year: 2023, actual_pay: 67000, cap_amount: 69120, used_pay: 67000, cap_applied: false },
  { year: 2024, actual_pay: 74000, cap_amount: 72360, used_pay: 72360, cap_applied: true },
  { year: 2025, actual_pay: 78000, cap_amount: 78148.80, used_pay: 78000, cap_applied: false },
]

const case2AMS: AMSResult = {
  ams_amount: 6037.78,   // $72,453.33 / 12
  window_months: 36,
  window_start: '2023-01-01',
  window_end: '2025-12-31',
  monthly_salaries: [],
  anti_spiking_applied: true,
  anti_spiking_detail: case2AntiSpiking,
  annual_has: 72453.33,
}

const case2Eligibility: EligibilityResult = {
  member_id: 'COPERA-002',
  retirement_date: '2026-01-01',
  division: 'School',
  has_table: 6,
  has_table_name: 'PERA 6',
  age_at_retirement: 57,
  eligible: true,
  retirement_type: 'early',
  rule_of_n_value: 75.00,
  rule_of_n_threshold: 85,
  rule_of_n_label: 'Rule of 85',
  reduction_factor: 0.68,
  conditions_met: [
    'Vested: 18.00 years >= 5 years required',
    'Early retirement: age 57 >= 55 (PERA 6 min early age)',
  ],
  conditions_unmet: [
    'Normal retirement: age 57 < 65 (PERA 6 normal age)',
    'Rule of 85: age 57 + service 18.00 = 75.00 < 85',
  ],
  audit_trail: [
    { rule_id: 'RULE-HAS-TABLE', rule_name: 'HAS Table', description: 'HAS table from CMPTIER0', result: 'PERA 6 (post-2011, vested before 2020)', source_reference: 'C.R.S. §24-51-602' },
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting', result: 'PASS: 18.00 >= 5.00', source_reference: 'C.R.S. §24-51-401(1.7)' },
    { rule_id: 'RULE-NORMAL', rule_name: 'Normal Retirement', description: 'PERA 6: age >= 65', result: 'FAIL: 57 < 65', source_reference: 'C.R.S. §24-51-602(2)' },
    { rule_id: 'RULE-RULE-85', rule_name: 'Rule of 85', description: 'Age + earned >= 85, min 55', result: 'FAIL: 57 + 18.00 = 75.00 < 85', source_reference: 'C.R.S. §24-51-602(2)' },
    { rule_id: 'RULE-EARLY', rule_name: 'Early Retirement', description: 'PERA 6: age >= 55, vested', result: 'PASS: 57 >= 55. Reduction: 32% (8 years × 4%/yr)', source_reference: 'C.R.S. §24-51-605(3)' },
  ],
}

const case2Benefit: BenefitResult = {
  member_id: 'COPERA-002',
  retirement_date: '2026-01-01',
  division: 'School',
  has_table: 6,
  has_table_name: 'PERA 6',
  ams: 6037.78,
  ams_window_months: 36,
  annual_has: 72453.33,
  service_years_for_benefit: 18.00,
  multiplier: 0.025,
  gross_annual_benefit: 32604.00,
  gross_monthly_benefit: 2717.00,
  reduction_factor: 0.68,
  retirement_type: 'early',
  net_monthly_benefit: 1847.56,
  formula_display: '($72,453.33 × 2.5% × 18.00 years) / 12 = $2,717.00/mo × 0.68 = $1,847.56/month',
  anti_spiking_applied: true,
  anti_spiking_detail: case2AntiSpiking,
  annual_increase: {
    rate: 0.010,
    first_eligible_date: '2028-03-01',
    compound_method: 'compound',
    note: 'Annual increase of 1.0% compound, effective March 1 of second calendar year after retirement. Source: C.R.S. §24-51-1002(1.5).',
  },
  death_benefit: { amount: 5000, has_table: 6, retirement_type: 'early', description: 'Statutory survivor benefits per C.R.S. §24-51-701' },
  audit_trail: [
    { rule_id: 'RULE-HAS-CALC', rule_name: 'HAS Calculation', description: '36-month window (vested before 2020)', result: '$72,453.33 annual (after anti-spiking)', source_reference: 'C.R.S. §24-51-101(25.5)' },
    { rule_id: 'RULE-ANTISPIKE', rule_name: 'Anti-Spiking', description: '108% cascading cap applied', result: '2024 salary capped: $74,000 → $72,360 (108% of $67,000)', source_reference: 'C.R.S. §24-51-101(25.5)' },
    { rule_id: 'RULE-BENEFIT', rule_name: 'Benefit Formula', description: 'HAS × 2.5% × service', result: '$72,453.33 × 0.025 × 18 = $32,604.00/yr = $2,717.00/mo', source_reference: 'C.R.S. §24-51-603' },
    { rule_id: 'RULE-REDUCE', rule_name: 'Early Reduction', description: '4%/year under 65 (PERA 6)', result: '$2,717.00 × 0.68 = $1,847.56/mo', source_reference: 'C.R.S. §24-51-605(3)' },
  ],
}

const case2PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 1847.56,
  division: 'School',
  options: [
    { option_name: 'option_1', option_type: 'maximum', display_name: 'Option 1 (Maximum)', monthly_amount: 1847.56, reduction_factor: 1.0, description: 'Single life annuity' },
    { option_name: 'option_2', option_type: 'js_50', display_name: 'Option 2 (J&S 50%)', monthly_amount: 1745.94, reduction_factor: 0.945, survivor_pct: 50, survivor_amount: 872.97, description: 'Joint & survivor 50%' },
    { option_name: 'option_3', option_type: 'js_100', display_name: 'Option 3 (J&S 100%)', monthly_amount: 1635.09, reduction_factor: 0.885, survivor_pct: 100, survivor_amount: 1635.09, description: 'Joint & survivor 100%' },
  ],
}

// ─── Case 3: Sarah Williams — DPS Division, DPS 1, Rule of 80, DPS Options ─────

const case3Member: Member = {
  member_id: 'COPERA-003',
  first_name: 'Sarah',
  last_name: 'Williams',
  date_of_birth: '1966-02-28',
  hire_date: '2000-01-01',
  division: 'DPS',
  has_table: 10,
  has_table_name: 'DPS 1',
  status: 'Active',
  department: 'Denver Police Department',
  position: 'Police Sergeant',
  marital_status: 'Married',
  contribution_rate_ee: 0.12,
  contribution_rate_er: 0.195,
}

const case3Employment: EmploymentEvent[] = [
  { event_type: 'hire', effective_date: '2000-01-01', department: 'Denver Police Department', position: 'Police Officer', employer: 'City of Denver', division: 'DPS' },
  { event_type: 'promotion', effective_date: '2008-06-01', department: 'Denver Police Department', position: 'Police Corporal' },
  { event_type: 'promotion', effective_date: '2015-01-01', department: 'Denver Police Department', position: 'Police Sergeant' },
]

const case3ServiceCredit: ServiceCreditSummary = {
  total_service_years: 26.00,
  earned_service_years: 26.00,
  purchased_service_years: 0,
  military_service_years: 0,
  total_for_eligibility: 26.00,
  total_for_benefit: 26.00,
}

const case3AMS: AMSResult = {
  ams_amount: 9083.33,
  window_months: 36,
  window_start: '2023-01-01',
  window_end: '2025-12-31',
  monthly_salaries: [],
  anti_spiking_applied: false,
  annual_has: 109000.00,
}

const case3Eligibility: EligibilityResult = {
  member_id: 'COPERA-003',
  retirement_date: '2026-01-01',
  division: 'DPS',
  has_table: 10,
  has_table_name: 'DPS 1',
  age_at_retirement: 59,
  eligible: true,
  retirement_type: 'rule_of_80',
  rule_of_n_value: 85.00,
  rule_of_n_threshold: 80,
  rule_of_n_label: 'Rule of 80',
  reduction_factor: 1.0,
  conditions_met: [
    'Vested: 26.00 years >= 5 years required',
    'Rule of 80: age 59 + service 26.00 = 85.00 >= 80',
    'Minimum age met: 59 >= 55',
  ],
  conditions_unmet: [
    'Normal retirement: age 59 < 60 (DPS 1 normal age)',
  ],
  audit_trail: [
    { rule_id: 'RULE-HAS-TABLE', rule_name: 'HAS Table', description: 'HAS table from CMPTIER0', result: 'DPS 1 (pre-2005 DPS membership)', source_reference: 'C.R.S. §24-51-602' },
    { rule_id: 'RULE-VEST-001', rule_name: 'Vesting', description: 'Check 5-year vesting', result: 'PASS: 26.00 >= 5.00', source_reference: 'C.R.S. §24-51-401(1.7)' },
    { rule_id: 'RULE-NORMAL', rule_name: 'Normal Retirement', description: 'DPS 1: age >= 60', result: 'FAIL: 59 < 60', source_reference: 'C.R.S. §24-51-602(1)(a)' },
    { rule_id: 'RULE-RULE-80', rule_name: 'Rule of 80', description: 'Age + earned >= 80, min 55', result: 'PASS: 59 + 26.00 = 85.00 >= 80', source_reference: 'C.R.S. §24-51-602(1)(a)' },
  ],
}

const case3Benefit: BenefitResult = {
  member_id: 'COPERA-003',
  retirement_date: '2026-01-01',
  division: 'DPS',
  has_table: 10,
  has_table_name: 'DPS 1',
  ams: 9083.33,
  ams_window_months: 36,
  annual_has: 109000.00,
  service_years_for_benefit: 26.00,
  multiplier: 0.025,
  gross_annual_benefit: 70850.00,
  gross_monthly_benefit: 5904.17,
  reduction_factor: 1.0,
  retirement_type: 'rule_of_80',
  net_monthly_benefit: 5904.17,
  formula_display: '($109,000.00 × 2.5% × 26.00 years) / 12 = $5,904.17/month',
  anti_spiking_applied: false,
  annual_increase: {
    rate: 0.015,
    first_eligible_date: '2028-03-01',
    compound_method: 'compound',
    note: 'Annual increase of 1.5% compound, effective March 1 of second calendar year after retirement. Source: C.R.S. §24-51-1002.',
  },
  death_benefit: { amount: 5000, has_table: 10, retirement_type: 'rule_of_80', description: 'Statutory survivor benefits per C.R.S. §24-51-701' },
  audit_trail: [
    { rule_id: 'RULE-HAS-CALC', rule_name: 'HAS Calculation', description: '36-month window (DPS 1)', result: '$109,000.00 annual / $9,083.33 monthly', source_reference: 'C.R.S. §24-51-101(25.5)' },
    { rule_id: 'RULE-ANTISPIKE', rule_name: 'Anti-Spiking', description: '108% cascading cap check', result: 'No adjustment needed', source_reference: 'C.R.S. §24-51-101(25.5)' },
    { rule_id: 'RULE-BENEFIT', rule_name: 'Benefit Formula', description: 'HAS × 2.5% × service', result: '$109,000 × 0.025 × 26 = $70,850/yr = $5,904.17/mo', source_reference: 'C.R.S. §24-51-603' },
  ],
}

// DPS uses Options A/B/P2/P3, not 1/2/3
const case3PaymentOptions: PaymentOptionsResult = {
  base_monthly_benefit: 5904.17,
  division: 'DPS',
  options: [
    { option_name: 'option_a', option_type: 'maximum', display_name: 'Option A (Maximum)', monthly_amount: 5904.17, reduction_factor: 1.0, description: 'Single life annuity — maximum monthly benefit' },
    { option_name: 'option_b', option_type: 'modified_half', display_name: 'Option B (Modified Half)', monthly_amount: 5579.44, reduction_factor: 0.945, survivor_pct: 50, survivor_amount: 2789.72, description: '50% continues to co-benefit recipient after death' },
    { option_name: 'pop_up_2', option_type: 'popup_75', display_name: 'Pop-Up 2 (J&S 75%)', monthly_amount: 5402.32, reduction_factor: 0.915, survivor_pct: 75, survivor_amount: 4051.74, pop_up_feature: true, description: '75% survivor; returns to full benefit if beneficiary predeceases retiree' },
    { option_name: 'pop_up_3', option_type: 'popup_100', display_name: 'Pop-Up 3 (J&S 100%)', monthly_amount: 5225.19, reduction_factor: 0.885, survivor_pct: 100, survivor_amount: 5225.19, pop_up_feature: true, description: '100% survivor; returns to full benefit if beneficiary predeceases retiree' },
  ],
}

// ─── Beneficiaries ──────────────────────────────────────────────────────────

const case1Beneficiaries: Beneficiary[] = [
  { name: 'Carlos Garcia', relationship: 'Spouse', allocation_pct: 100, date_of_birth: '1965-02-14' },
]

const case2Beneficiaries: Beneficiary[] = [
  { name: 'Linda Chen', relationship: 'Mother', allocation_pct: 100, date_of_birth: '1940-04-22' },
]

const case3Beneficiaries: Beneficiary[] = [
  { name: 'David Williams', relationship: 'Spouse', allocation_pct: 100, date_of_birth: '1964-09-10' },
]

// ─── Application Intake (simplified for COPERA demo) ──────────────────────

const defaultIntake: ApplicationIntake = {
  application_received_date: '2025-10-15',
  last_day_worked: '2025-12-31',
  retirement_effective_date: '2026-01-01',
  notarization_confirmed: true,
  notarization_date: '2025-10-14',
  deadline_met: true,
  days_before_last_day: 77,
  payment_cutoff_met: true,
  cutoff_date: '2025-12-15',
  first_payment_date: '2026-01-31',
  combined_payment: false,
  documents: [
    { doc_type: 'RETIREMENT_APP', doc_name: 'Application for Retirement', required: true, status: 'RECEIVED', received_date: '2025-10-15' },
    { doc_type: 'BIRTH_CERT', doc_name: 'Birth Certificate', required: true, status: 'RECEIVED', received_date: '2025-10-15' },
    { doc_type: 'MARRIAGE_CERT', doc_name: 'Marriage Certificate', required: true, conditional_on: 'marital_status:Married', status: 'RECEIVED', received_date: '2025-10-15' },
    { doc_type: 'BENEFICIARY_FORM', doc_name: 'Beneficiary Designation', required: true, status: 'RECEIVED', received_date: '2025-10-15' },
  ],
  package_complete: true,
  complete_package_date: '2025-10-15',
}

// ─── Lookup maps ─────────────────────────────────────────────────────────────

const DEMO_MEMBERS: Record<string, Member> = {
  'COPERA-001': case1Member,
  'COPERA-002': case2Member,
  'COPERA-003': case3Member,
}

const DEMO_EMPLOYMENT: Record<string, EmploymentEvent[]> = {
  'COPERA-001': case1Employment,
  'COPERA-002': case2Employment,
  'COPERA-003': case3Employment,
}

const DEMO_SERVICE_CREDIT: Record<string, ServiceCreditSummary> = {
  'COPERA-001': case1ServiceCredit,
  'COPERA-002': case2ServiceCredit,
  'COPERA-003': case3ServiceCredit,
}

const DEMO_AMS: Record<string, AMSResult> = {
  'COPERA-001': case1AMS,
  'COPERA-002': case2AMS,
  'COPERA-003': case3AMS,
}

const DEMO_BENEFICIARIES: Record<string, Beneficiary[]> = {
  'COPERA-001': case1Beneficiaries,
  'COPERA-002': case2Beneficiaries,
  'COPERA-003': case3Beneficiaries,
}

const DEMO_DROS: Record<string, DRORecord[]> = {}

const DEMO_ELIGIBILITY: Record<string, EligibilityResult> = {
  'COPERA-001': case1Eligibility,
  'COPERA-002': case2Eligibility,
  'COPERA-003': case3Eligibility,
}

const DEMO_BENEFIT: Record<string, BenefitResult> = {
  'COPERA-001': case1Benefit,
  'COPERA-002': case2Benefit,
  'COPERA-003': case3Benefit,
}

const DEMO_PAYMENT_OPTIONS: Record<string, PaymentOptionsResult> = {
  'COPERA-001': case1PaymentOptions,
  'COPERA-002': case2PaymentOptions,
  'COPERA-003': case3PaymentOptions,
}

const DEMO_DRO_RESULT: Record<string, DROResult> = {}
const DEMO_PURCHASE_QUOTES: Record<string, ServicePurchaseQuote> = {}

const DEMO_INTAKE: Record<string, ApplicationIntake> = {
  'COPERA-001': { ...defaultIntake },
  'COPERA-002': { ...defaultIntake, documents: defaultIntake.documents.filter(d => d.conditional_on !== 'marital_status:Married') },
  'COPERA-003': { ...defaultIntake },
}

// Scenario data for what-if comparisons
const SCENARIO_MEMBER_DATA: Record<string, { baseRetirementDate: string; ams: number; multiplier: number; serviceYears: number; reductionFactor: number; earnedYears: number; age: number; hasTable: number }> = {
  'COPERA-001': { baseRetirementDate: '2026-01-01', ams: 7652.78, multiplier: 0.025, serviceYears: 28.00, reductionFactor: 1.0, earnedYears: 28.00, age: 62, hasTable: 1 },
  'COPERA-002': { baseRetirementDate: '2026-01-01', ams: 6037.78, multiplier: 0.025, serviceYears: 18.00, reductionFactor: 0.68, earnedYears: 18.00, age: 57, hasTable: 6 },
  'COPERA-003': { baseRetirementDate: '2026-01-01', ams: 9083.33, multiplier: 0.025, serviceYears: 26.00, reductionFactor: 1.0, earnedYears: 26.00, age: 59, hasTable: 10 },
}

function computeScenario(memberId: string, date: string): ScenarioResult {
  const md = SCENARIO_MEMBER_DATA[memberId]
  if (!md) return { retirement_date: date, age_at_retirement: 0, eligible: false, retirement_type: 'unknown', reduction_factor: 0, net_monthly_benefit: 0, annual_benefit: 0 }

  const baseDate = new Date(md.baseRetirementDate)
  const targetDate = new Date(date)
  const monthsDiff = (targetDate.getFullYear() - baseDate.getFullYear()) * 12 + (targetDate.getMonth() - baseDate.getMonth())
  const yearsDiff = monthsDiff / 12

  const projectedAge = md.age + yearsDiff
  const projectedService = md.serviceYears + yearsDiff
  const projectedAms = md.ams * Math.pow(1.03, yearsDiff)

  const unreduced = projectedAms * md.multiplier * projectedService
  const factor = md.reductionFactor < 1.0 ? Math.min(1.0, md.reductionFactor + yearsDiff * 0.04) : 1.0
  const benefit = Math.round(unreduced * factor * 100) / 100

  return {
    retirement_date: date,
    age_at_retirement: Math.floor(projectedAge),
    eligible: projectedService >= 5,
    retirement_type: factor >= 1.0 ? 'normal' : 'early',
    reduction_factor: Math.round(factor * 100) / 100,
    net_monthly_benefit: benefit,
    annual_benefit: Math.round(benefit * 12 * 100) / 100,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export function isDemoMode(): boolean {
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
    if (!m) return Promise.reject(new Error(`Demo member ${id} not found. Try COPERA-001, COPERA-002, or COPERA-003.`))
    return delay(m)
  },

  getEmployment: (id: string) => delay(DEMO_EMPLOYMENT[id] ?? []),

  getSalary: (id: string) => {
    const ams = DEMO_AMS[id]
    return delay({
      records: [] as SalaryRecord[],
      ams: ams ?? { ams_amount: 0, window_months: 0, window_start: '', window_end: '', monthly_salaries: [], anti_spiking_applied: false, annual_has: 0 },
    })
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
      return computeScenario(memberId, d)
    })
    return delay(results)
  },

  calculateDRO: (memberId: string, _retirementDate?: string) => {
    const d = DEMO_DRO_RESULT[memberId]
    if (!d) return Promise.reject(new Error(`No DRO for ${memberId}`))
    return delay(d)
  },

  getPurchaseQuote: (memberId: string) => {
    const q = DEMO_PURCHASE_QUOTES[memberId]
    if (!q) return Promise.reject(new Error(`No purchase quote for ${memberId}.`))
    return delay(q)
  },

  saveElection: (election: {
    member_id: string; retirement_date: string; payment_option: string
    monthly_benefit: number; gross_benefit: number; reduction_factor: number
    dro_deduction?: number; annual_increase_rate?: number; death_benefit_amount?: number
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
