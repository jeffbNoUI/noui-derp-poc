/**
 * Stage metadata, onboarding content, rule citations, and verification checklists
 * for the guided mode Learning Module. Each stage has three layers: onboarding
 * (teaching narrative), rules (compact citations), and checklist (verification items).
 * Consumed by: GuidedWorkspace (LearningModule rendering), guided-composition.ts
 * Depends on: Nothing (pure data)
 */
import type { ServiceCreditSummary, DRORecord } from '@/types/Member'

/** Summary field definition for adaptive card depth — drives StageSummary rendering */
export interface SummaryField {
  label: string
  /** Dot-path into StageProps to extract the value, or a static display string */
  path: string
  /** Format function: 'fmt' (currency), 'years' (Xy), 'text' (raw), 'badge' */
  format: 'fmt' | 'years' | 'text' | 'badge'
  /** Badge color when format is 'badge' */
  badgeColor?: 'success' | 'accent' | 'warn'
}

/** Pre-written "What If?" scenario for the onboarding layer */
export interface WhatIfScenario {
  /** The hypothetical question */
  question: string
  /** The pre-written answer referencing actual demo case numbers */
  answer: string
  /** Direction of the hypothetical change */
  delta: 'increase' | 'decrease' | 'neutral'
}

export interface StageHelp {
  id: string
  title: string
  icon: string
  subtitle: string
  /** Onboarding layer — narrative teaching text with citations woven in */
  onboarding: string
  /** Rules layer — compact citation list */
  rules: { citation: string; desc: string }[]
  /** Checklist layer — interactive verification items */
  checklist: string[]
  /** Stage-specific confirm button label — describes the decision, not just "confirm" */
  confirmLabel: string
  /** What comes next */
  nextAction: string
  /** If present, stage is only shown when this returns true */
  conditional?: (sc: ServiceCreditSummary | undefined, dros: DRORecord[] | undefined) => boolean
  /** Fields to display in summary (compact) mode — undefined means always full (F-1) */
  summaryFields?: SummaryField[]
  /** Pre-written "What If?" scenarios — displayed in onboarding layer */
  whatIf?: WhatIfScenario[]
}

export const STAGE_HELP: StageHelp[] = [
  {
    id: 'application-intake',
    title: 'Application Intake',
    icon: '\uD83D\uDCC2',
    subtitle: 'Document completeness and application timeline',
    onboarding:
      'Before any eligibility check or benefit calculation, the retirement application ' +
      'and all required supporting documents must be in hand. The application must be filed within 30 calendar ' +
      'days of the member\'s last day worked (C.R.S. \u00A724-51-602). The complete package must arrive by the 15th ' +
      'of the month before the effective date to ensure on-time first payment. The retirement effective date ' +
      'is always the first of the month following separation.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-602', desc: 'Application within 30 days of last day worked' },
      { citation: 'C.R.S. \u00A724-51-602', desc: 'Notarized signature required on application' },
      { citation: 'COPERA Policy', desc: 'Package by 15th of month before effective date for on-time payment' },
      { citation: 'C.R.S. \u00A724-51-602', desc: 'Effective date: first of month following separation' },
    ],
    checklist: [
      'Notarized application received',
      'Application filed within 30-day deadline',
      'All required documents received',
      'Payment cutoff date verified',
    ],
    confirmLabel: 'Confirm Intake Complete',
    nextAction: 'Verify member identity and data quality',
    summaryFields: [
      { label: 'Package', path: 'applicationIntake.package_complete', format: 'badge', badgeColor: 'success' },
      { label: 'Received', path: 'applicationIntake.application_received_date', format: 'text' },
      { label: 'Cutoff', path: 'applicationIntake.payment_cutoff_met', format: 'badge', badgeColor: 'success' },
    ],
  },
  {
    id: 'member-verify',
    title: 'Member Verification',
    icon: '\uD83D\uDCCB',
    subtitle: 'Confirm member identity and data quality',
    onboarding:
      'The HAS (Highest Average Salary) table, set by the member\'s hire date and division per C.R.S. \u00A724-51-101, determines everything downstream: ' +
      'the benefit multiplier, the HAS window (36 or 60 months), and the early retirement ' +
      'reduction rate. Getting the HAS table wrong cascades errors through every subsequent stage. ' +
      'Vesting requires 5 years of service (C.R.S. \u00A724-51-602) regardless of table \u2014 confirm this before proceeding.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-101', desc: 'HAS table classification by hire date and division' },
      { citation: 'C.R.S. \u00A724-51-602', desc: '5-year vesting requirement, all tables' },
    ],
    checklist: [
      'Member name and ID match records',
      'HAS table classification correct for hire date',
      'Employment history is complete',
      'No data quality flags outstanding',
    ],
    confirmLabel: 'Verify Identity',
    nextAction: 'Review service credit breakdown',
    summaryFields: [
      { label: 'Member', path: 'member.first_name', format: 'text' },
      { label: 'HAS Table', path: 'member.has_table_name', format: 'badge', badgeColor: 'accent' },
      { label: 'Vested', path: 'serviceCredit.total_for_eligibility', format: 'years' },
    ],
  },
  {
    id: 'service-credit',
    title: 'Service Credit Review',
    icon: '\u23F1',
    subtitle: 'Earned vs. purchased service breakdown',
    onboarding:
      'Service credit has a critical split: earned service counts for both eligibility and benefit, but ' +
      'purchased service (C.R.S. \u00A724-51-505) counts only toward the benefit calculation. This means a member with ' +
      '20 earned years + 3 purchased years has 23 years for the benefit formula but only 20 years for ' +
      'the Rule of N check. Mixing these up is the #1 source of eligibility errors.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-601', desc: 'Service credit calculation' },
      { citation: 'C.R.S. \u00A724-51-505', desc: 'Purchased service: benefit only, not eligibility' },
      { citation: 'C.R.S. \u00A724-51-602', desc: '5-year vesting requirement' },
    ],
    checklist: [
      'Total service years correct',
      'Earned vs. purchased breakdown accurate',
      'Vesting requirement met (5+ years)',
      'Purchased service excluded from eligibility totals',
    ],
    confirmLabel: 'Approve Service Credit',
    nextAction: 'Set retirement date and check eligibility',
    summaryFields: [
      { label: 'Earned', path: 'serviceCredit.earned_service_years', format: 'years' },
      { label: 'Purchased', path: 'serviceCredit.purchased_service_years', format: 'years' },
      { label: 'For Benefit', path: 'serviceCredit.total_for_benefit', format: 'years' },
    ],
  },
  {
    id: 'eligibility',
    title: 'Retirement Date & Eligibility',
    icon: '\uD83D\uDCC5',
    subtitle: 'Date selection and Rule of N evaluation',
    onboarding:
      'Eligibility hinges on the Rule of N: age plus earned service years must reach the threshold for the ' +
      'member\'s HAS table (80, 85, or 90 depending on hire date per C.R.S. \u00A724-51-602). If the rule isn\'t met, ' +
      'the member takes an early retirement reduction based on years under age 65 ' +
      '(C.R.S. \u00A724-51-604). Remember: only earned service counts here, not purchased.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-602', desc: 'Rule of 80/85/90: age + earned service >= threshold (varies by HAS table)' },
      { citation: 'C.R.S. \u00A724-51-604', desc: 'Early retirement reduction based on years under 65' },
      { citation: 'C.R.S. \u00A724-51-602', desc: 'Minimum retirement age varies by HAS table' },
    ],
    checklist: [
      'Retirement date is correct',
      'Age at retirement calculated correctly',
      'Rule of N evaluation uses earned service only',
      'Reduction factor matches HAS table and age',
    ],
    confirmLabel: 'Confirm Eligibility',
    nextAction: 'Review salary history and benefit calculation',
    summaryFields: [
      { label: 'Type', path: 'eligibility.retirement_type', format: 'badge', badgeColor: 'accent' },
      { label: 'Reduction', path: 'eligibility.reduction_factor', format: 'text' },
      { label: 'Rule of N', path: 'eligibility.rule_of_n_value', format: 'text' },
    ],
    whatIf: [
      {
        question: 'What if Maria retired 2 years later at age 67?',
        answer: 'Normal retirement age met at 65, so no benefit change from waiting. Additional service would increase the benefit formula result.',
        delta: 'neutral',
      },
      {
        question: 'What if James had 5 more years of earned service?',
        answer: 'Rule of 85 might be met depending on age, eliminating the early retirement reduction and significantly increasing the monthly benefit.',
        delta: 'increase',
      },
    ],
  },
  {
    id: 'benefit-calc',
    title: 'Salary & Benefit Calculation',
    icon: '\uD83D\uDCB0',
    subtitle: 'AMS window, salary table, formula, final amount',
    onboarding:
      'The benefit formula is HAS \u00D7 multiplier \u00D7 service years. HAS (Highest Average Salary) is the average monthly salary ' +
      'over the highest consecutive 36 months (older HAS tables) or 60 months (newer tables) per C.R.S. \u00A724-51-101(24.5). ' +
      'The multiplier varies by HAS table (2.5% for PERA 1, 2.0% for DPS, etc.) per C.R.S. \u00A724-51-604. ' +
      'Anti-spiking provisions (C.R.S. \u00A724-51-101(24.5)) limit salary spikes that could inflate the HAS.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-101(24.5)', desc: 'HAS: highest consecutive 36 or 60 months, anti-spiking' },
      { citation: 'C.R.S. \u00A724-51-604', desc: 'Multiplier varies by HAS table and division' },
      { citation: 'C.R.S. \u00A724-51-101(24.5)', desc: 'Anti-spiking: salary increases capped at inflation threshold' },
    ],
    checklist: [
      'HAS window period is correct',
      'Salary amounts match payroll records',
      'Anti-spiking reviewed (if applicable)',
      'Multiplier matches HAS table',
      'Final monthly benefit amount is accurate',
    ],
    confirmLabel: 'Approve Benefit Amount',
    nextAction: 'Select payment option',
    summaryFields: [
      { label: 'Net Monthly', path: 'benefit.net_monthly_benefit', format: 'fmt' },
      { label: 'AMS', path: 'benefit.ams', format: 'fmt' },
      { label: 'Service Years', path: 'benefit.service_years_for_benefit', format: 'years' },
    ],
    whatIf: [
      {
        question: 'What if the member had a large salary increase in the final year?',
        answer: 'Anti-spiking provisions would cap the included amount. Only salary increases within the inflation threshold are included in the HAS calculation.',
        delta: 'decrease',
      },
    ],
  },
  {
    id: 'payment-options',
    title: 'Payment Options',
    icon: '\uD83D\uDCB3',
    subtitle: 'Survivor benefit elections and irrevocability',
    onboarding:
      'The member elects a payment option per C.R.S. \u00A724-51-604. PERA divisions offer Options 1 (Maximum), 2, and 3. ' +
      'DPS offers Options A (Maximum), B (Modified), P2, and P3. Survivor benefit options reduce the monthly amount but ' +
      'continue payments to the designated beneficiary. Spousal consent is required for certain elections. This election is ' +
      'irrevocable once the first payment is received \u2014 the member cannot change their mind later.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-604', desc: 'Payment options: PERA (1, 2, 3), DPS (A, B, P2, P3)' },
      { citation: 'C.R.S. \u00A724-51-604', desc: 'Spousal consent required for certain elections' },
    ],
    checklist: [
      'All four option amounts displayed correctly',
      'Survivor benefit amounts calculated',
      'Spousal consent requirement noted',
      'Irrevocability warning displayed',
    ],
    confirmLabel: 'Record Election',
    nextAction: 'Review additional benefits (IPR and death benefit)',
    summaryFields: [
      { label: 'Elected', path: 'electedOption', format: 'text' },
      { label: 'Monthly', path: 'benefit.net_monthly_benefit', format: 'fmt' },
    ],
    whatIf: [
      {
        question: 'What if the member chose a survivor option instead of Maximum?',
        answer: 'Monthly benefit is reduced by the survivor factor, but the designated beneficiary receives continued payments for life.',
        delta: 'decrease',
      },
    ],
  },
  {
    id: 'supplemental',
    title: 'Additional Benefits',
    icon: '\uD83D\uDEE1',
    subtitle: 'IPR and death benefit amounts',
    onboarding:
      'Two supplemental benefits apply. The Annual Increase (C.R.S. \u00A724-51-1002) provides a compound ' +
      'annual adjustment (1.0% or 1.5% depending on HAS table) starting March 1 of the second year after retirement. ' +
      'The death benefit (C.R.S. \u00A724-51-607) provides survivor payments based on the member\'s retirement type ' +
      'and elected payment option.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-1002', desc: 'Annual Increase: 1.0-1.5% compound, starts second year' },
      { citation: 'C.R.S. \u00A724-51-607', desc: 'Death benefit provisions for retirees' },
    ],
    checklist: [
      'Annual increase rate correct for HAS table',
      'Death benefit amount correct for retirement type',
      'First eligible date for annual increase verified',
    ],
    confirmLabel: 'Confirm Supplementals',
    nextAction: 'Review DRO impact (if applicable) or proceed to final review',
    summaryFields: [
      { label: 'Annual Increase', path: 'benefit.annual_increase.rate', format: 'text' },
      { label: 'Death Benefit', path: 'benefit.death_benefit.amount', format: 'fmt' },
    ],
  },
  {
    id: 'dro',
    title: 'DRO Processing',
    icon: '\u2696',
    subtitle: 'Domestic Relations Order impact',
    onboarding:
      'A Domestic Relations Order (DRO, C.R.S. \u00A724-51-606) divides the member\'s benefit with a former spouse. The marital ' +
      'fraction is calculated as marital service years (from marriage to divorce) divided by total service ' +
      'years. The alternate payee\'s share is deducted from the member\'s gross benefit before the payment ' +
      'option reduction is applied.',
    rules: [
      { citation: 'C.R.S. \u00A724-51-606', desc: 'DRO marital fraction: marital service / total service' },
      { citation: 'C.R.S. \u00A724-51-606', desc: 'DRO division applied before payment option reduction' },
    ],
    checklist: [
      'Marital fraction calculated correctly',
      'Alternate payee amount accurate',
      'Member net benefit after DRO correct',
      'DRO applied before payment option election',
    ],
    confirmLabel: 'Approve DRO Split',
    nextAction: 'Proceed to final review and certification',
    conditional: (_sc, dros) => !!dros && dros.length > 0,
  },
  {
    id: 'review-certify',
    title: 'Review & Certify',
    icon: '\u2705',
    subtitle: 'Final summary and submission',
    onboarding:
      'This is the final check before submission. The system shows its work \u2014 every calculation is ' +
      'transparent and verifiable (Governing Principle 2). Review all confirmed values from each stage ' +
      'against the source data. Once submitted, a case record is created for human review. No calculation ' +
      'or decision is made without human visibility.',
    rules: [
      { citation: 'Governing Principle 2', desc: 'Trust through transparency: every output verified by human' },
    ],
    checklist: [
      'All stage values match expectations',
      'Payment option election is correct',
      'Member and analyst signatures obtained',
      'Application ready for submission',
    ],
    confirmLabel: 'Certify Application',
    nextAction: 'Submit retirement application for processing',
  },
]
