/**
 * COPERA member domain types — members, employment, salary, eligibility, benefits, payment options.
 * Consumed by: demo-data.ts, all workspace and portal components
 * Depends on: nothing (leaf types)
 *
 * Key structural notes (COPERA model):
 *   - tier: number → has_table: number + division: string
 *   - IPR → removed (replaced by PERACare, out of POC scope)
 *   - COLA → annual_increase (compound, not discretionary)
 *   - Payment options: 1/2/3 for PERA, A/B/P2/P3 for DPS
 *   - Anti-spiking fields added to AMS
 */

export interface Member {
  member_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  hire_date: string
  division: string        // State, School, LocalGov, Judicial, DPS
  has_table: number       // 1-9 (PERA), 10-13 (DPS)
  has_table_name: string  // "PERA 1", "DPS 1", etc.
  status: string
  department: string
  position: string
  termination_date?: string
  marital_status?: string
  contribution_rate_ee?: number  // Employee contribution rate
  contribution_rate_er?: number  // Employer contribution rate
}

export interface EmploymentEvent {
  event_type: string
  effective_date: string
  department: string
  position: string
  employer?: string
  division?: string
  notes?: string
}

export interface SalaryRecord {
  pay_period_end: string
  base_pay: number
  pensionable_pay: number
  overtime?: number
}

export interface AntiSpikingYear {
  year: number
  actual_pay: number
  cap_amount: number
  used_pay: number
  cap_applied: boolean
}

export interface AMSResult {
  ams_amount: number
  window_months: number
  window_start: string
  window_end: string
  monthly_salaries: number[]
  anti_spiking_applied: boolean
  anti_spiking_detail?: AntiSpikingYear[]
  annual_has: number                      // Annual HAS (before dividing by 12)
}

export interface ServiceCreditSummary {
  total_service_years: number
  earned_service_years: number
  purchased_service_years: number
  military_service_years: number
  total_for_eligibility: number
  total_for_benefit: number
}

export interface Beneficiary {
  name: string
  relationship: string
  allocation_pct: number
  date_of_birth?: string
}

export interface DRORecord {
  dro_id: string
  case_number: string
  alternate_payee_name: string
  division_method: string
  division_pct?: number
  division_amount?: number
  marriage_date: string
  divorce_date: string
  status: string
}

export interface EligibilityResult {
  member_id: string
  retirement_date: string
  division: string
  has_table: number
  has_table_name: string
  age_at_retirement: number
  eligible: boolean
  retirement_type: string
  rule_of_n_value?: number
  rule_of_n_threshold?: number
  rule_of_n_label?: string    // "Rule of 80", "Rule of 85", etc.
  reduction_factor: number
  conditions_met: string[]
  conditions_unmet: string[]
  audit_trail: AuditEntry[]
}

export interface AnnualIncreaseInfo {
  rate: number                // 0.015 or 0.010
  first_eligible_date: string // March 1 of second year after retirement
  compound_method: string     // "compound"
  note: string
}

export interface BenefitResult {
  member_id: string
  retirement_date: string
  division: string
  has_table: number
  has_table_name: string
  ams: number
  ams_window_months: number
  annual_has: number
  service_years_for_benefit: number
  multiplier: number
  gross_annual_benefit: number
  gross_monthly_benefit: number
  reduction_factor: number
  retirement_type: string
  net_monthly_benefit: number
  formula_display: string
  anti_spiking_applied: boolean
  anti_spiking_detail?: AntiSpikingYear[]
  annual_increase?: AnnualIncreaseInfo
  death_benefit?: DeathBenefitResult
  audit_trail: AuditEntry[]
}

export interface DeathBenefitResult {
  amount: number
  has_table: number
  retirement_type: string
  description: string
}

export interface PaymentOption {
  option_name: string
  option_type: string
  display_name: string
  monthly_amount: number
  reduction_factor: number
  survivor_pct?: number
  survivor_amount?: number
  pop_up_feature?: boolean    // DPS Pop-Up options
  description: string
}

export interface PaymentOptionsResult {
  base_monthly_benefit: number
  division: string
  options: PaymentOption[]
}

export interface ScenarioResult {
  retirement_date: string
  age_at_retirement: number
  eligible: boolean
  retirement_type: string
  reduction_factor: number
  net_monthly_benefit: number
  annual_benefit: number
}

export interface DROResult {
  dro_id: string
  total_service_years: number
  marital_service_years: number
  marital_fraction: number
  member_gross_benefit: number
  marital_share: number
  alternate_payee_amount: number
  member_net_after_dro: number
  division_method: string
  alternate_payee_name: string
  audit_trail: AuditEntry[]
}

export interface RetirementElectionResult {
  member_id: string
  case_id: number
  status: string
  message: string
  retirement_date: string
  payment_option: string
}

export interface AuditEntry {
  rule_id: string
  rule_name: string
  description: string
  result: string
  source_reference?: string
}

export interface IntakeDocument {
  doc_type: string
  doc_name: string
  required: boolean
  conditional_on?: string
  status: 'RECEIVED' | 'PENDING' | 'WAIVED' | 'NOT_APPLICABLE'
  received_date: string | null
}

export interface ApplicationIntake {
  application_received_date: string
  last_day_worked: string
  retirement_effective_date: string
  notarization_confirmed: boolean
  notarization_date: string | null
  deadline_met: boolean
  days_before_last_day: number
  payment_cutoff_met: boolean
  cutoff_date: string
  first_payment_date: string
  combined_payment: boolean
  documents: IntakeDocument[]
  package_complete: boolean
  complete_package_date: string | null
}

export interface APIResponse<T> {
  data: T
  meta: {
    request_id: string
    timestamp: string
  }
}

export interface APIError {
  error: {
    code: string
    message: string
    request_id: string
  }
}

// ─── Service Purchase Domain Types ──────────────────────────────────────────

export interface ServicePurchaseQuote {
  quote_date: string
  expiration_date: string
  member_age: number
  has_table: number
  service_type: 'governmental' | 'military' | 'leave_of_absence' | 'furlough'
  years_requested: number
  prior_employer: string
  prior_employment_start: string
  prior_employment_end: string
  cost_factor: number
  current_annual_salary: number
  cost_per_year: number
  total_cost: number
  payment_options: {
    lump_sum: { amount: number; interest: number; total: number }
    payroll_deduction: {
      monthly_payment: number
      number_of_payments: number
      annual_interest_rate: number
      total_paid: number
      interest_cost: number
    }
    rollover: { amount: number; tax_impact: string }
  }
  benefit_impact: {
    current_monthly: number
    projected_monthly: number
    monthly_increase: number
    annual_increase: number
    breakeven_months: number
    breakeven_years: number
  }
  eligibility_exclusion: {
    rule_of_n_sum_without: number
    rule_of_n_sum_with: number
    purchased_excluded: boolean
  }
  valid: boolean
  governing_rules: string[]
  audit_trail: AuditEntry[]
}
