/**
 * Explicit API interface — the contract that demoApi, liveApi, and agentApi must satisfy.
 * Consumed by: client.ts (resolveApi), hooks (useMember, useCalculations)
 * Depends on: types/Member.ts (domain types)
 */
import type {
  Member,
  EmploymentEvent,
  SalaryRecord,
  AMSResult,
  ServiceCreditSummary,
  Beneficiary,
  DRORecord,
  EligibilityResult,
  BenefitResult,
  PaymentOptionsResult,
  ScenarioResult,
  DROResult,
  RetirementElectionResult,
  ApplicationIntake,
  ServicePurchaseQuote,
} from '@/types/Member'

export interface ApiInterface {
  getApplicationIntake: (memberId: string) => Promise<ApplicationIntake>
  getMember: (memberId: string) => Promise<Member>
  getEmployment: (memberId: string) => Promise<EmploymentEvent[]>
  getSalary: (memberId: string) => Promise<{ records: SalaryRecord[]; ams: AMSResult }>
  getServiceCredit: (memberId: string) => Promise<ServiceCreditSummary>
  getBeneficiaries: (memberId: string) => Promise<Beneficiary[]>
  getDROs: (memberId: string) => Promise<DRORecord[]>
  evaluateEligibility: (memberId: string, retirementDate: string) => Promise<EligibilityResult>
  calculateBenefit: (memberId: string, retirementDate: string) => Promise<BenefitResult>
  calculatePaymentOptions: (memberId: string, retirementDate: string) => Promise<PaymentOptionsResult>
  calculateScenarios: (memberId: string, retirementDates: string[]) => Promise<ScenarioResult[]>
  calculateDRO: (memberId: string, retirementDate?: string) => Promise<DROResult>
  getPurchaseQuote: (memberId: string) => Promise<ServicePurchaseQuote>
  saveElection: (election: {
    member_id: string; retirement_date: string; payment_option: string
    monthly_benefit: number; gross_benefit: number; reduction_factor: number
    dro_deduction?: number; ipr_amount?: number; death_benefit_amount?: number
  }) => Promise<RetirementElectionResult>
}

export type ApiMode = 'demo' | 'live' | 'agent'
