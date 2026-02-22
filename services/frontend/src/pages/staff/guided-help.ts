/**
 * Stage metadata, onboarding content, rule citations, and verification checklists
 * for the guided mode Learning Module. Each stage has three layers: onboarding
 * (teaching narrative), rules (compact citations), and checklist (verification items).
 * Consumed by: GuidedWorkspace (LearningModule rendering), guided-composition.ts
 * Depends on: Nothing (pure data)
 */
import type { ServiceCreditSummary, DRORecord } from '@/types/Member'

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
}

export const STAGE_HELP: StageHelp[] = [
  {
    id: 'member-verify',
    title: 'Member Verification',
    icon: '\uD83D\uDCCB',
    subtitle: 'Confirm member identity and data quality',
    onboarding:
      'The tier classification, set by the member\'s hire date per \u00A718-401, determines everything downstream: ' +
      'the benefit multiplier (2.0% vs 1.5%), the AMS window (36 vs 60 months), and the early retirement ' +
      'reduction rate (3% vs 6% per year). Getting the tier wrong cascades errors through every subsequent stage. ' +
      'Vesting requires 5 years of service (\u00A718-403) regardless of tier \u2014 confirm this before proceeding.',
    rules: [
      { citation: 'RMC \u00A718-401', desc: 'Tier classification by hire date' },
      { citation: 'RMC \u00A718-403', desc: '5-year vesting requirement, all tiers' },
    ],
    checklist: [
      'Member name and ID match records',
      'Tier classification correct for hire date',
      'Employment history is complete',
      'No data quality flags outstanding',
    ],
    confirmLabel: 'Verify Identity',
    nextAction: 'Review service credit breakdown',
  },
  {
    id: 'service-credit',
    title: 'Service Credit Review',
    icon: '\u23F1',
    subtitle: 'Earned vs. purchased service breakdown',
    onboarding:
      'Service credit has a critical split: earned service counts for both eligibility and benefit, but ' +
      'purchased service (\u00A718-404(c)) counts only toward the benefit calculation. This means a member with ' +
      '20 earned years + 3 purchased years has 23 years for the benefit formula but only 20 years for ' +
      'the Rule of 75/85 check. Mixing these up is the #1 source of eligibility errors.',
    rules: [
      { citation: 'RMC \u00A718-404', desc: 'Service credit calculation' },
      { citation: 'RMC \u00A718-404(c)', desc: 'Purchased service: benefit only, not eligibility' },
      { citation: 'RMC \u00A718-403', desc: '5-year vesting requirement' },
    ],
    checklist: [
      'Total service years correct',
      'Earned vs. purchased breakdown accurate',
      'Vesting requirement met (5+ years)',
      'Purchased service excluded from eligibility totals',
    ],
    confirmLabel: 'Approve Service Credit',
    nextAction: 'Set retirement date and check eligibility',
  },
  {
    id: 'eligibility',
    title: 'Retirement Date & Eligibility',
    icon: '\uD83D\uDCC5',
    subtitle: 'Date selection and Rule of N evaluation',
    onboarding:
      'Eligibility hinges on the Rule of N: age plus earned service years must reach 75 (Tiers 1-2, ' +
      'min age 55 per \u00A718-408(b)) or 85 (Tier 3, min age 60 per \u00A718-408(c)). If the rule isn\'t met, ' +
      'the member takes an early retirement reduction \u2014 3% per year under 65 for Tiers 1-2 (\u00A718-409(a)), ' +
      '6% per year for Tier 3 (\u00A718-409(b)). Remember: only earned service counts here, not purchased.',
    rules: [
      { citation: 'RMC \u00A718-408(b)', desc: 'Rule of 75: age + earned service \u2265 75 (min age 55)' },
      { citation: 'RMC \u00A718-408(c)', desc: 'Rule of 85: age + earned service \u2265 85 (min age 60)' },
      { citation: 'RMC \u00A718-409(a)', desc: 'Early reduction: 3% per year under 65 (Tiers 1-2)' },
      { citation: 'RMC \u00A718-409(b)', desc: 'Early reduction: 6% per year under 65 (Tier 3)' },
    ],
    checklist: [
      'Retirement date is correct',
      'Age at retirement calculated correctly',
      'Rule of N evaluation uses earned service only',
      'Reduction factor matches tier and age',
    ],
    confirmLabel: 'Confirm Eligibility',
    nextAction: 'Review salary history and benefit calculation',
  },
  {
    id: 'benefit-calc',
    title: 'Salary & Benefit Calculation',
    icon: '\uD83D\uDCB0',
    subtitle: 'AMS window, salary table, formula, final amount',
    onboarding:
      'The benefit formula is AMS \u00D7 multiplier \u00D7 service years. AMS is the Average Monthly Salary ' +
      'over the highest consecutive 36 months for Tiers 1-2 or 60 months for Tier 3 (\u00A718-401(3)). ' +
      'The multiplier is 2.0% for Tier 1, 1.5% for Tiers 2-3 (\u00A718-408(a)). If the member was hired ' +
      'before January 1, 2010, a sick/vacation leave payout (\u00A718-412) is added to the final month of salary, ' +
      'which can boost the AMS if that month falls within the highest window.',
    rules: [
      { citation: 'RMC \u00A718-401(3)', desc: 'AMS: highest consecutive 36 or 60 months' },
      { citation: 'RMC \u00A718-408(a)', desc: 'Multiplier: 2.0% Tier 1, 1.5% Tiers 2-3' },
      { citation: 'RMC \u00A718-412', desc: 'Leave payout: hired before 2010, Tiers 1-2 only' },
    ],
    checklist: [
      'AMS window period is correct',
      'Salary amounts match payroll records',
      'Leave payout applied correctly (if eligible)',
      'Multiplier matches tier',
      'Final monthly benefit amount is accurate',
    ],
    confirmLabel: 'Approve Benefit Amount',
    nextAction: 'Select payment option',
  },
  {
    id: 'payment-options',
    title: 'Payment Options',
    icon: '\uD83D\uDCB3',
    subtitle: 'Survivor benefit elections and irrevocability',
    onboarding:
      'The member elects one of four payment options (\u00A718-410): Maximum (highest monthly, no survivor benefit), ' +
      'or Joint & Survivor at 100%, 75%, or 50% (reduced monthly, continues payments to the designated ' +
      'beneficiary). Spousal consent is required for non-J&S elections (\u00A718-410(b)). This election is ' +
      'irrevocable once the first payment is received \u2014 the member cannot change their mind later.',
    rules: [
      { citation: 'RMC \u00A718-410', desc: 'Four payment options: Maximum, J&S 100%, 75%, 50%' },
      { citation: 'RMC \u00A718-410(b)', desc: 'Spousal consent required for non-J&S elections' },
    ],
    checklist: [
      'All four option amounts displayed correctly',
      'Survivor benefit amounts calculated',
      'Spousal consent requirement noted',
      'Irrevocability warning displayed',
    ],
    confirmLabel: 'Record Election',
    nextAction: 'Review additional benefits (IPR and death benefit)',
  },
  {
    id: 'supplemental',
    title: 'Additional Benefits',
    icon: '\uD83D\uDEE1',
    subtitle: 'IPR and death benefit amounts',
    onboarding:
      'Two supplemental benefits apply. The Increased Pension Reserve (IPR, \u00A718-414) provides $150 per year ' +
      'of earned service (purchased service excluded) as a pre-Medicare supplement. The death benefit ' +
      '(\u00A718-413(a)) is $5,000 for normal retirement; for early retirement (\u00A718-413(b)), it\'s reduced by $250/year ' +
      '(Tiers 1-2) or $500/year (Tier 3) for each year under age 65.',
    rules: [
      { citation: 'RMC \u00A718-414', desc: 'IPR: $150/year of earned service (purchased excluded)' },
      { citation: 'RMC \u00A718-413(a)', desc: 'Death benefit: $5,000 normal retirement' },
      { citation: 'RMC \u00A718-413(b)', desc: 'Death benefit early reduction: $250 or $500/year under 65' },
    ],
    checklist: [
      'IPR uses earned service only (not purchased)',
      'Death benefit amount correct for retirement type',
      'Early retirement death benefit reduction applied if applicable',
    ],
    confirmLabel: 'Confirm Supplementals',
    nextAction: 'Review DRO impact (if applicable) or proceed to final review',
  },
  {
    id: 'dro',
    title: 'DRO Processing',
    icon: '\u2696',
    subtitle: 'Domestic Relations Order impact',
    onboarding:
      'A Domestic Relations Order (DRO, \u00A718-415) divides the member\'s benefit with a former spouse. The marital ' +
      'fraction is calculated as marital service years (from marriage to divorce) divided by total service ' +
      'years. The alternate payee\'s share is deducted from the member\'s gross benefit before the payment ' +
      'option reduction is applied (\u00A718-415(b)).',
    rules: [
      { citation: 'RMC \u00A718-415', desc: 'DRO marital fraction: marital service / total service' },
      { citation: 'RMC \u00A718-415(b)', desc: 'DRO division applied before payment option reduction' },
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
