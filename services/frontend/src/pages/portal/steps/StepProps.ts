/**
 * Shared prop type for all wizard step components.
 * Consumed by: Step1–Step7 wizard step components
 * Depends on: PortalTheme, ApplicationDraft, Member types
 */
import type { PortalTheme } from '@/theme'
import type { ApplicationDraft } from '@/types/Portal'
import type { Member, ServiceCreditSummary, EligibilityResult, BenefitResult, PaymentOptionsResult } from '@/types/Member'

export interface StepProps {
  T: PortalTheme
  draft: ApplicationDraft
  onUpdate: (payload: Partial<ApplicationDraft>) => void
  member?: Member
  service?: ServiceCreditSummary
  elig?: EligibilityResult
  ben?: BenefitResult
  opts?: PaymentOptionsResult
}
