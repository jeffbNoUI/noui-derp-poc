/**
 * Shared prop interface for all guided mode stage components.
 * Consumed by: Stage1 through Stage8, GuidedWorkspace
 * Depends on: Member types, calculation result types
 */
import type {
  Member, ServiceCreditSummary, EligibilityResult, BenefitResult,
  PaymentOptionsResult, DRORecord, DROResult, ApplicationIntake,
} from '@/types/Member'
import type { AnalystInputs } from '../guided-types'

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
  /** Analyst-entered fields from the application (F-4) */
  analystInputs?: AnalystInputs
  /** Callback to update analyst input fields */
  onUpdateAnalystInput?: (field: keyof AnalystInputs, value: string | number | boolean) => void
}
