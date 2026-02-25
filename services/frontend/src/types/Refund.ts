/**
 * TypeScript types for the Contribution Refund domain.
 * Defines interfaces for refund eligibility, calculation, contribution history, and interest.
 *
 * Consumed by: api/refund-demo-data.ts, pages/staff/stages/refund/*.tsx
 * Depends on: types/Member.ts (AuditEntry)
 */

import type { AuditEntry } from './Member'

/** Refund eligibility determination result. */
export interface RefundEligibility {
  eligible: boolean
  reason: string
  vested: boolean
  service_years: number
  forfeiture_required: boolean
  waiting_period_met: boolean
  days_since_termination: number
  earliest_application_date: string
  audit_trail: AuditEntry[]
}

/** A single month's contribution detail for the accumulation trace. */
export interface ContributionDetail {
  year: number
  month: number
  pensionable_pay: number
  contribution: number
  running_total: number
}

/** Result of the contribution accumulation calculation. */
export interface ContributionAccumulation {
  total_contributions: number
  month_count: number
  monthly_detail: ContributionDetail[]
  formula: string
}

/** A single annual interest compounding event. */
export interface InterestCreditEntry {
  date: string
  balance_before: number
  interest_amount: number
  balance_after: number
}

/** Result of the interest compounding calculation. */
export interface InterestSchedule {
  total_interest: number
  interest_rate: number
  credits: InterestCreditEntry[]
  formula: string
}

/** Tax withholding calculation for a distribution election. */
export interface TaxWithholdingResult {
  gross_refund: number
  election_type: 'direct_payment' | 'direct_rollover' | 'partial_rollover'
  withholding_rate: number
  withholding_amount: number
  rollover_amount?: number
  net_payment: number
  formula: string
}

/** Comparison of refund vs deferred pension for vested members. */
export interface DeferredComparison {
  refund_gross: number
  deferred_monthly_at_65: number
  deferred_annual_at_65: number
  years_to_age_65: number
  breakeven_years_after_65: number
  lifetime_value_at_85: number
  formula: string
}

/** Complete refund calculation result. */
export interface RefundCalculation {
  member_id: string
  eligibility: RefundEligibility
  contributions: ContributionAccumulation
  interest: InterestSchedule
  gross_refund: number
  tax_options: TaxWithholdingResult[]
  deferred_comparison?: DeferredComparison
  audit_trail: AuditEntry[]
}

/** Contribution history entry for display (monthly). */
export interface ContributionHistoryEntry {
  ledger_month: string
  pensionable_salary: number
  employee_contribution: number
  employer_contribution: number
  running_balance: number
}

/** Full contribution history response from connector. */
export interface ContributionHistoryResponse {
  member_id: string
  contribution_ledger: ContributionHistoryEntry[]
  interest_credits: InterestCreditEntry[]
  total_contributions: number
  total_interest: number
  record_count: number
}
