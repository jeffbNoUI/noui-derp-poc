/**
 * Shared prop interface for death processing stage components.
 * Consumed by: DeathNotification, SurvivorDetermination, SurvivorBenefitCalc,
 *   OverpaymentReview, DeathBenefitContinuation, DeathProcessingReview
 * Depends on: DeathSurvivor types, Member type
 */
import type { Member } from '@/types/Member.ts'
import type {
  DeathRecord,
  SurvivorClaim,
  DeathBenefitElection,
  OverpaymentInfo,
  SurvivorBenefitResult,
  InstallmentCalcResult,
  ActiveMemberDeathResult,
  DeathProcessingSummary,
} from '@/types/DeathSurvivor.ts'

export interface DeathStageProps {
  member: Member
  deathRecord?: DeathRecord
  survivorClaims?: SurvivorClaim[]
  deathBenefitElection?: DeathBenefitElection
  overpaymentInfo?: OverpaymentInfo
  survivorBenefit?: SurvivorBenefitResult
  installments?: InstallmentCalcResult
  activeMemberDeath?: ActiveMemberDeathResult
  processingSummary?: DeathProcessingSummary
}
