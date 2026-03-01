/**
 * Smart nudge rule definitions — behavior-based hints for common analyst patterns.
 * Consumed by: useNudges.ts
 * Depends on: nudge-types.ts
 */
import type { NudgeRule } from './nudge-types'

export const NUDGE_RULES: NudgeRule[] = [
  {
    id: 'idle-benefit-calc',
    trigger: { type: 'idle', stageId: 'benefit-calc', delayMs: 30000 },
    message: 'Taking time on the benefit calculation?',
    hint: 'The Learning Module rules layer shows the exact formula and C.R.S. citations. Toggle it on with the Rules pill button.',
  },
  {
    id: 'idle-eligibility',
    trigger: { type: 'idle', stageId: 'eligibility', delayMs: 30000 },
    message: 'Need help verifying eligibility?',
    hint: 'Check the What If scenarios in the onboarding layer to see how different retirement dates would affect this member.',
  },
  {
    id: 'out-of-order-elig-before-salary',
    trigger: { type: 'out-of-order', confirmedBefore: 'eligibility', notVisited: 'service-credit' },
    message: 'Service credit not reviewed yet',
    hint: 'Confirming eligibility before reviewing service credit may miss purchased service that affects the Rule of 75/85 calculation.',
    maxCases: 10,  // Rec #3: skip for experienced analysts (0% effectiveness beyond 10 cases)
  },
  {
    id: 'out-of-order-payment-before-benefit',
    trigger: { type: 'out-of-order', confirmedBefore: 'payment-options', notVisited: 'benefit-calc' },
    message: 'Benefit not yet calculated',
    hint: 'Payment options depend on the base benefit amount. Review the benefit calculation stage first for accurate comparison.',
    maxCases: 10,  // Rec #2: skip for experienced analysts (0% effectiveness beyond 10 cases)
  },
]
