/**
 * Shared prop interface for all guided mode stage components.
 * Consumed by: Stage1 through Stage8, GuidedWorkspace
 * Depends on: Member types, calculation result types
 */
import type {
  Member, ServiceCreditSummary, EligibilityResult, BenefitResult,
  PaymentOptionsResult, DRORecord, DROResult, ApplicationIntake,
} from '@/types/Member'

export interface StageProps {
  memberId: string
  member: Member
  serviceCredit?: ServiceCreditSummary
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  paymentOptions?: PaymentOptionsResult
  dros?: DRORecord[]
  droCalc?: DROResult
  applicationIntake?: ApplicationIntake
  retirementDate: string
  onRetirementDateChange: (date: string) => void
  electedOption: string
  onElectOption: (option: string) => void
  leavePayout: number
}
