/**
 * FORM_REGISTRY — barrel export mapping formId to FormDefinition for all 20 forms.
 * Consumed by: FormWizard, LifeEventFlow, form-registry tests
 * Depends on: all f01-f20 definition files
 */
import type { FormDefinition } from '@/types/FormDefinition'
import { f01RetirementApplication } from './f01-retirement-application'
import { f02SpousalConsentRetirement } from './f02-spousal-consent-retirement'
import { f03SpousalConsentPreRetirement } from './f03-spousal-consent-pre-retirement'
import { f04DroAgreement } from './f04-dro-agreement'
import { f05DroCourtForm } from './f05-dro-court-form'
import { f06DroPartiesInfo } from './f06-dro-parties-info'
import { f07DroReleaseMember } from './f07-dro-release-member'
import { f08DroReleaseFormerSpouse } from './f08-dro-release-former-spouse'
import { f09DroBenefitAltPayee } from './f09-dro-benefit-alt-payee'
import { f10SurvivorBenefit } from './f10-survivor-benefit'
import { f11LumpSumDeathBenefit } from './f11-lump-sum-death-benefit'
import { f12UnpaidBenefit } from './f12-unpaid-benefit'
import { f13HealthInsuranceElection } from './f13-health-insurance-election'
import { f14HealthInsuranceDisenrollment } from './f14-health-insurance-disenrollment'
import { f15DirectWithdrawal } from './f15-direct-withdrawal'
import { f16DisabilityApplication } from './f16-disability-application'
import { f17DisabilityAuthorization } from './f17-disability-authorization'
import { f18InfoRelease } from './f18-info-release'
import { f19CommonLawAffidavit } from './f19-common-law-affidavit'
import { f20DropStatement } from './f20-drop-statement'

export const FORM_REGISTRY: Record<string, FormDefinition> = {
  F01: f01RetirementApplication,
  F02: f02SpousalConsentRetirement,
  F03: f03SpousalConsentPreRetirement,
  F04: f04DroAgreement,
  F05: f05DroCourtForm,
  F06: f06DroPartiesInfo,
  F07: f07DroReleaseMember,
  F08: f08DroReleaseFormerSpouse,
  F09: f09DroBenefitAltPayee,
  F10: f10SurvivorBenefit,
  F11: f11LumpSumDeathBenefit,
  F12: f12UnpaidBenefit,
  F13: f13HealthInsuranceElection,
  F14: f14HealthInsuranceDisenrollment,
  F15: f15DirectWithdrawal,
  F16: f16DisabilityApplication,
  F17: f17DisabilityAuthorization,
  F18: f18InfoRelease,
  F19: f19CommonLawAffidavit,
  F20: f20DropStatement,
}

export {
  f01RetirementApplication, f02SpousalConsentRetirement, f03SpousalConsentPreRetirement,
  f04DroAgreement, f05DroCourtForm, f06DroPartiesInfo,
  f07DroReleaseMember, f08DroReleaseFormerSpouse, f09DroBenefitAltPayee,
  f10SurvivorBenefit, f11LumpSumDeathBenefit, f12UnpaidBenefit,
  f13HealthInsuranceElection, f14HealthInsuranceDisenrollment, f15DirectWithdrawal,
  f16DisabilityApplication, f17DisabilityAuthorization, f18InfoRelease,
  f19CommonLawAffidavit, f20DropStatement,
}
