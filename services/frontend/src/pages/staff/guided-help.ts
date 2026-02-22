/**
 * Stage metadata, contextual help text, rule citations, and verification checklists
 * for the guided mode workspace. Each stage has structured help content that appears
 * in the right-hand help panel.
 * Consumed by: GuidedWorkspace (help panel rendering)
 * Depends on: Nothing (pure data)
 */
import type { ServiceCreditSummary, DRORecord } from '@/types/Member'

export interface StageHelpRule {
  ruleId: string
  citation: string
  desc: string
}

export interface StageHelp {
  id: string
  title: string
  icon: string
  subtitle: string
  helpText: string
  keyRules: StageHelpRule[]
  whatToVerify: string[]
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
    helpText:
      'Verify the member\'s identity, tier classification, employment history, and data quality. ' +
      'The tier determines the benefit formula, AMS window, and reduction rates. ' +
      'Flag any data quality issues before proceeding.',
    keyRules: [
      { ruleId: 'RULE-TIER-001', citation: 'RMC \u00A718-401', desc: 'Tier classification by hire date' },
      { ruleId: 'RULE-VEST-001', citation: 'RMC \u00A718-403', desc: '5-year vesting requirement, all tiers' },
    ],
    whatToVerify: [
      'Member name and ID match records',
      'Tier classification correct for hire date',
      'Employment history is complete',
      'No data quality flags outstanding',
    ],
    nextAction: 'Review service credit breakdown',
  },
  {
    id: 'service-credit',
    title: 'Service Credit Review',
    icon: '\u23F1',
    subtitle: 'Earned vs. purchased service breakdown',
    helpText:
      'Review the member\'s total service credit, broken down by earned, purchased, and military service. ' +
      'Purchased service counts toward the benefit calculation (increases the benefit amount) but does NOT ' +
      'count toward Rule of 75, Rule of 85, or IPR eligibility.',
    keyRules: [
      { ruleId: 'RULE-SVC-001', citation: 'RMC \u00A718-404', desc: 'Service credit calculation' },
      { ruleId: 'RULE-SVC-PURCH', citation: 'RMC \u00A718-404(c)', desc: 'Purchased service: benefit only, not eligibility' },
      { ruleId: 'RULE-VEST-001', citation: 'RMC \u00A718-403', desc: '5-year vesting requirement' },
    ],
    whatToVerify: [
      'Total service years correct',
      'Earned vs. purchased breakdown accurate',
      'Vesting requirement met (5+ years)',
      'Purchased service excluded from eligibility totals',
    ],
    nextAction: 'Set retirement date and check eligibility',
  },
  {
    id: 'eligibility',
    title: 'Retirement Date & Eligibility',
    icon: '\uD83D\uDCC5',
    subtitle: 'Date selection and Rule of N evaluation',
    helpText:
      'Select the retirement date and evaluate eligibility. The rules engine checks Rule of 75 (Tiers 1-2) ' +
      'or Rule of 85 (Tier 3). If the rule is not met, an early retirement reduction applies: ' +
      '3% per year under 65 for Tiers 1-2, 6% per year under 65 for Tier 3.',
    keyRules: [
      { ruleId: 'RULE-ELIG-075', citation: 'RMC \u00A718-408(b)', desc: 'Rule of 75: age + earned service \u2265 75 (min age 55)' },
      { ruleId: 'RULE-ELIG-085', citation: 'RMC \u00A718-408(c)', desc: 'Rule of 85: age + earned service \u2265 85 (min age 60)' },
      { ruleId: 'RULE-RED-T12', citation: 'RMC \u00A718-409(a)', desc: 'Early reduction: 3% per year under 65 (Tiers 1-2)' },
      { ruleId: 'RULE-RED-T3', citation: 'RMC \u00A718-409(b)', desc: 'Early reduction: 6% per year under 65 (Tier 3)' },
    ],
    whatToVerify: [
      'Retirement date is correct',
      'Age at retirement calculated correctly',
      'Rule of N evaluation uses earned service only',
      'Reduction factor matches tier and age',
    ],
    nextAction: 'Review salary history and benefit calculation',
  },
  {
    id: 'benefit-calc',
    title: 'Salary & Benefit Calculation',
    icon: '\uD83D\uDCB0',
    subtitle: 'AMS window, salary table, formula, final amount',
    helpText:
      'The benefit formula: AMS \u00D7 multiplier \u00D7 service years. ' +
      'AMS is the Average Monthly Salary over the highest consecutive 36 months (Tiers 1-2) or 60 months (Tier 3). ' +
      'Leave payout, if eligible, is added to the final month of salary within the AMS window.',
    keyRules: [
      { ruleId: 'RULE-AMS-001', citation: 'RMC \u00A718-401(3)', desc: 'AMS: highest consecutive 36 or 60 months' },
      { ruleId: 'RULE-MULT-001', citation: 'RMC \u00A718-408(a)', desc: 'Multiplier: 2.0% Tier 1, 1.5% Tiers 2-3' },
      { ruleId: 'RULE-LEAVE-001', citation: 'RMC \u00A718-412', desc: 'Leave payout: hired before 2010, Tiers 1-2 only' },
    ],
    whatToVerify: [
      'AMS window period is correct',
      'Salary amounts match payroll records',
      'Leave payout applied correctly (if eligible)',
      'Multiplier matches tier',
      'Final monthly benefit amount is accurate',
    ],
    nextAction: 'Select payment option',
  },
  {
    id: 'payment-options',
    title: 'Payment Options',
    icon: '\uD83D\uDCB3',
    subtitle: 'Survivor benefit elections and irrevocability',
    helpText:
      'The member must elect one of four payment options. The Maximum option provides the highest monthly ' +
      'amount with no survivor benefit. Joint & Survivor options reduce the monthly benefit but continue ' +
      'payments to the designated beneficiary. This election is irrevocable once the first payment is received.',
    keyRules: [
      { ruleId: 'RULE-PAY-001', citation: 'RMC \u00A718-410', desc: 'Four payment options: Maximum, J&S 100%, 75%, 50%' },
      { ruleId: 'RULE-PAY-002', citation: 'RMC \u00A718-410(b)', desc: 'Spousal consent required for non-J&S elections' },
    ],
    whatToVerify: [
      'All four option amounts displayed correctly',
      'Survivor benefit amounts calculated',
      'Spousal consent requirement noted',
      'Irrevocability warning displayed',
    ],
    nextAction: 'Review additional benefits (IPR and death benefit)',
  },
  {
    id: 'supplemental',
    title: 'Additional Benefits',
    icon: '\uD83D\uDEE1',
    subtitle: 'IPR and death benefit amounts',
    helpText:
      'The Increased Pension Reserve (IPR) provides a supplemental annual benefit based on earned service ' +
      'years only (purchased service excluded). The death benefit is $5,000 for normal retirement; ' +
      'for early retirement, it is reduced by $250/year (Tiers 1-2) or $500/year (Tier 3) under age 65.',
    keyRules: [
      { ruleId: 'RULE-IPR-001', citation: 'RMC \u00A718-414', desc: 'IPR: $150/year of earned service (purchased excluded)' },
      { ruleId: 'RULE-DB-001', citation: 'RMC \u00A718-413(a)', desc: 'Death benefit: $5,000 normal retirement' },
      { ruleId: 'RULE-DB-002', citation: 'RMC \u00A718-413(b)', desc: 'Death benefit early reduction: $250 or $500/year under 65' },
    ],
    whatToVerify: [
      'IPR uses earned service only (not purchased)',
      'Death benefit amount correct for retirement type',
      'Early retirement death benefit reduction applied if applicable',
    ],
    nextAction: 'Review DRO impact (if applicable) or proceed to final review',
  },
  {
    id: 'dro',
    title: 'DRO Processing',
    icon: '\u2696',
    subtitle: 'Domestic Relations Order impact',
    helpText:
      'A Domestic Relations Order (DRO) divides the member\'s benefit with a former spouse. ' +
      'The marital fraction is calculated as marital service years divided by total service years. ' +
      'The alternate payee\'s share is deducted from the member\'s gross benefit before other calculations.',
    keyRules: [
      { ruleId: 'RULE-DRO-001', citation: 'RMC \u00A718-415', desc: 'DRO marital fraction: marital service / total service' },
      { ruleId: 'RULE-DRO-002', citation: 'RMC \u00A718-415(b)', desc: 'DRO division applied before payment option reduction' },
    ],
    whatToVerify: [
      'Marital fraction calculated correctly',
      'Alternate payee amount accurate',
      'Member net benefit after DRO correct',
      'DRO applied before payment option election',
    ],
    nextAction: 'Proceed to final review and certification',
    conditional: (_sc, dros) => !!dros && dros.length > 0,
  },
  {
    id: 'review-certify',
    title: 'Review & Certify',
    icon: '\u2705',
    subtitle: 'Final summary and submission',
    helpText:
      'Review all confirmed values from each stage. The system shows its work \u2014 every calculation is ' +
      'transparent and verifiable. Verify all values are correct before submitting the retirement application ' +
      'for processing. This creates a case record for human review.',
    keyRules: [
      { ruleId: 'RULE-AUDIT-001', citation: 'Governing Principle 2', desc: 'Trust through transparency: every output verified by human' },
    ],
    whatToVerify: [
      'All stage values match expectations',
      'Payment option election is correct',
      'Member and analyst signatures obtained',
      'Application ready for submission',
    ],
    nextAction: 'Submit retirement application for processing',
  },
]
