export interface Member {
  member_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  hire_date: string
  tier: number
  status: string
  department: string
  position: string
  termination_date?: string
}

export interface EmploymentEvent {
  event_type: string
  effective_date: string
  department: string
  position: string
  notes?: string
}

export interface SalaryRecord {
  pay_period_end: string
  base_pay: number
  pensionable_pay: number
  overtime?: number
  leave_payout?: number
  furlough_days?: number
}

export interface AMSResult {
  ams_amount: number
  window_months: number
  window_start: string
  window_end: string
  monthly_salaries: number[]
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
  tier: number
  age_at_retirement: number
  eligible: boolean
  retirement_type: string
  rule_of_n_value?: number
  rule_of_n_threshold?: number
  reduction_factor: number
  conditions_met: string[]
  conditions_unmet: string[]
  audit_trail: AuditEntry[]
}

export interface BenefitResult {
  member_id: string
  retirement_date: string
  tier: number
  ams: number
  ams_window_months: number
  service_years_for_benefit: number
  multiplier: number
  gross_annual_benefit: number
  gross_monthly_benefit: number
  reduction_factor: number
  retirement_type: string
  net_monthly_benefit: number
  formula_display: string
  ipr?: IPRResult
  death_benefit?: DeathBenefitResult
  audit_trail: AuditEntry[]
}

export interface IPRResult {
  annual_amount: number
  monthly_amount: number
  rate_per_year: number
  eligible_service_years: number
  medicare_eligible: boolean
}

export interface DeathBenefitResult {
  amount: number
  tier: number
  retirement_type: string
}

export interface PaymentOption {
  option_name: string
  option_type: string
  monthly_amount: number
  reduction_factor: number
  survivor_pct?: number
  description: string
}

export interface PaymentOptionsResult {
  base_monthly_benefit: number
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
