/**
 * Barrel export for death processing stage components.
 * Consumed by: future DeathWorkspace
 * Depends on: All death stage component files
 */
export { DeathNotification } from './DeathNotification.tsx'
export { SurvivorDetermination } from './SurvivorDetermination.tsx'
export { SurvivorBenefitCalc } from './SurvivorBenefitCalc.tsx'
export { OverpaymentReview } from './OverpaymentReview.tsx'
export { DeathBenefitContinuation } from './DeathBenefitContinuation.tsx'
export { DeathProcessingReview } from './DeathProcessingReview.tsx'
export type { DeathStageProps } from './DeathStageProps.ts'
