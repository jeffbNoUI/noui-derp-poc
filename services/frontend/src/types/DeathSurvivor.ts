/**
 * TypeScript types for the Death & Survivor Benefits domain.
 * Defines interfaces for death records, survivor claims, death benefit
 * elections, overpayment tracking, and the complete death processing summary.
 *
 * Consumed by: death-survivor-demo-data.ts, death stage components
 * Depends on: Member.ts (AuditEntry type)
 */

/** Death record status tracking — follows the death processing workflow */
export type DeathRecordStatus = 'NOTIFIED' | 'VERIFIED' | 'PROCESSED' | 'CLOSED'

/** Survivor claim types */
export type SurvivorClaimType = 'JS_SURVIVOR' | 'CONTRIB_REFUND' | 'SURVIVOR_ANNUITY'

/** Survivor claim status */
export type SurvivorClaimStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'ACTIVE' | 'DENIED' | 'CLOSED'

/** Overpayment recovery status */
export type OverpaymentRecoveryStatus = 'IDENTIFIED' | 'REQUESTED' | 'PARTIAL' | 'RECOVERED' | 'WAIVED' | 'UNCOLLECTABLE'

/** Death record for a member — created upon notification of death */
export interface DeathRecord {
  death_record_id: number
  member_id: string
  death_date: string
  notification_date: string
  notification_source: string
  notification_contact?: string
  certificate_received_date?: string
  certificate_verified_date?: string
  certificate_verified_by?: string
  previous_member_status: string
  current_member_status: string
  status: DeathRecordStatus
  suspend_date?: string
  final_payment_date?: string
  overpayment_detected: boolean
  overpayment_amount: number
}

/** Survivor benefit claim — filed by designated survivor or beneficiary */
export interface SurvivorClaim {
  claim_id: number
  death_record_id: number
  member_id: string
  survivor_first_name: string
  survivor_last_name: string
  survivor_date_of_birth?: string
  survivor_relationship: string
  claim_type: SurvivorClaimType
  js_percentage?: number
  monthly_amount: number
  lump_sum_amount?: number
  effective_date: string
  first_payment_date?: string
  status: SurvivorClaimStatus
  approved_date?: string
  approved_by?: string
}

/** Death benefit installment election — made at retirement */
export interface DeathBenefitElection {
  election_id: number
  member_id: string
  lump_sum_amount: number
  num_installments: number
  installment_amount: number
  effective_date: string
  installments_paid: number
  installments_remaining: number
  remaining_amount: number
  beneficiary_first_name?: string
  beneficiary_last_name?: string
  beneficiary_relationship?: string
  status: string
}

/** Overpayment record — a single post-death overpayment */
export interface OverpaymentRecord {
  overpayment_id: number
  member_id: string
  payment_date: string
  payment_amount: number
  recovery_status: OverpaymentRecoveryStatus
  recovery_amount: number
  recovery_source?: string
}

/** Death benefit status summary — aggregates all death processing info */
export interface DeathBenefitStatus {
  member_id: string
  has_death_record: boolean
  death_record?: DeathRecord
  survivor_claims: SurvivorClaim[]
  death_benefit_election?: DeathBenefitElection
  overpayment_records: OverpaymentRecord[]
  processing_complete: boolean
}

/** Overpayment detection summary from the intelligence engine */
export interface OverpaymentInfo {
  overpayment_count: number
  overpayment_total: number
  valid_payments: number
  payment_details: Array<{
    deposit_date: string
    amount: number
    valid: boolean
    reason: string
  }>
}

/** Survivor benefit calculation result from intelligence engine */
export interface SurvivorBenefitResult {
  survivor_monthly_benefit: number
  survivor_name: string
  js_percentage: number
  effective_date: string
  duration: string
  formula: string
}

/** Death benefit installment calculation result */
export interface InstallmentCalcResult {
  installment_amount: number
  installments_paid: number
  installments_remaining: number
  remaining_total: number
  formula: string
}

/** Active member death determination result */
export interface ActiveMemberDeathResult {
  benefit_type: 'contribution_refund' | 'survivor_annuity'
  vested: boolean
  refund_amount?: number
  survivor_annuity_available: boolean
  formula: string
}

/** Pop-up provision result */
export interface PopUpResult {
  new_benefit: number
  increase_amount: number
  effective_date: string
  new_beneficiary_allowed: boolean
  retroactive: boolean
  formula: string
}

/** Complete death processing summary — the full package from the intelligence engine */
export interface DeathProcessingSummary {
  member_id: string
  notification: {
    benefit_suspended: boolean
    certificate_required: boolean
    status_transition: string
    note: string
  }
  overpayment: OverpaymentInfo
  survivor_benefit?: SurvivorBenefitResult
  death_benefit_installments?: InstallmentCalcResult
  active_member_death?: ActiveMemberDeathResult
  record_transition: {
    status_sequence: string[]
    survivor_record_created: boolean
    benefit_terminated: boolean
  }
  calculation_trace: Array<{
    step: number
    rule_id: string
    rule_name: string
    description: string
    inputs: string
    result: string
    source_reference: string
  }>
}
