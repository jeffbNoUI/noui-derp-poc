/**
 * NoUI Frontend Component Interfaces
 * ===================================
 * Stream S4 Output — Parallel Design Strategy
 * DERP POC — February 2026
 *
 * These interfaces define the contract between the Workspace Composition
 * Engine and the React components.
 *
 * CRITICAL-002 resolutions applied:
 *   CON-01: All monetary values are STRINGS with 2 decimal places (not numbers).
 *           Display formatting via utility function, never parseFloat.
 *   CON-02: MemberStatus and ServiceCreditType aligned with S1 canonical enums.
 *
 * All dates are ISO 8601 strings. Service years are strings (e.g., "28.75").
 *
 * Design system: noui-design-system.css
 * Composition rules: noui-s4-frontend-architecture.docx Section 3
 * Accessibility: noui-s4-frontend-architecture.docx Section 4
 */

// ═══════════════════════════════════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════════════════════════════════

// CON-02: Canonical MemberStatus from S1 domain entity specs + disability
export type MemberStatus =
  | 'active'
  | 'retired'
  | 'terminated'
  | 'deferred'
  | 'deceased'
  | 'disability';

export type InteractionType = 'static' | 'drillable' | 'explainable';

export type ProcessStage =
  | 'application_review'
  | 'employment_verification'
  | 'salary_verification'
  | 'eligibility_determination'
  | 'benefit_calculation'
  | 'payment_option_selection'
  | 'final_certification';

export type EligibilityType = 'normal' | 'rule_of' | 'early' | 'not_eligible';

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export type PaymentOptionType = 'maximum' | 'js100' | 'js75' | 'js50';

// CON-02: Aligned with S1/S3 ServiceCreditType
export type ServiceCreditType = 'employment' | 'purchased' | 'military' | 'leave';

export interface DataQualityFlag {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  field: string;
  proposedCorrection?: string;
}

export interface StatuteRef {
  /** e.g., '§18-401(a)' */
  section: string;
  /** e.g., 'Benefit multiplier' */
  description: string;
}

// ═══════════════════════════════════════════════════════════════════
// WORKSPACE COMPOSITION
// ═══════════════════════════════════════════════════════════════════

export interface WorkspaceDefinition {
  memberId: string;
  processType: 'service_retirement';
  processStage: ProcessStage;
  /** Highest composition tier used (1 = deterministic only, 2 = rule-based, 3 = AI) */
  compositionTier: 1 | 2 | 3;
  components: ComponentSlot[];
  /** Per ADR-007 graceful degradation hierarchy */
  degradationLevel: 0 | 1 | 2 | 3 | 4 | 5;
  composedAt: string;
}

export interface ComponentSlot {
  /** e.g., 'benefit-calculation-panel' */
  componentId: string;
  initialState: 'expanded' | 'collapsed' | 'summary';
  /** Display ordering — supports fractional for Tier 2 insertion (e.g., 5.3, 5.5) */
  order: number;
  /** Tier-specific configuration passed to the component */
  contextParams: Record<string, unknown>;
  /** Which composition tier added this component */
  compositionTier: 1 | 2;
  /** If false, user can dismiss/hide this component */
  required: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// COMPONENT PROPS
// ═══════════════════════════════════════════════════════════════════

// ── MemberBanner ──────────────────────────────────────────────────

export interface MemberBannerProps {
  member: MemberIdentity;
  /** Collapsed mode for constrained layouts */
  compact?: boolean;
  onExpandToggle?: () => void;
}

export interface MemberIdentity {
  memberId: string;
  firstName: string;
  lastName: string;
  /** ISO 8601 */
  dateOfBirth: string;
  /** Computed for the context date (e.g., retirement date) */
  ageAtDate: number;
  tier: 1 | 2 | 3;
  /** Human-readable tier label */
  tierLabel: string;
  status: MemberStatus;
  department: string;
  position: string;
  hireDate: string;
  /** CON-01: string, e.g. "28.75" */
  totalServiceYears: string;
  totalServiceMonths: number;
  /** CON-01: string */
  earnedServiceYears: string;
  /** CON-01: string */
  purchasedServiceYears: string;
  /** Masked — last 4 digits only */
  ssnLast4?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
  hasDRO: boolean;
  hasDataQualityIssues: boolean;
}

// ── AlertBar ──────────────────────────────────────────────────────

export interface AlertBarProps {
  alerts: Alert[];
  onDismiss?: (alertId: string) => void;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  /** Rule ID that generated this alert, e.g., 'RULE-SVC-PURCH-EXCL' */
  source?: string;
  /** e.g., 'RMC §18-406(c)' */
  statuteRef?: string;
  dismissible: boolean;
  actionLabel?: string;
  actionHref?: string;
}

// ── EmploymentTimeline ────────────────────────────────────────────

export interface EmploymentTimelineProps {
  periods: EmploymentPeriod[];
  gaps: EmploymentGap[];
  totalRecords: number;
  /** For completeness indicator: "Showing X of Y records" */
  displayedRecords: number;
  onPeriodSelect?: (periodId: string) => void;
  onDrillDown?: (periodId: string) => void;
}

export interface EmploymentPeriod {
  id: string;
  startDate: string;
  /** null = current employment */
  endDate: string | null;
  department: string;
  position: string;
  /** Full-time equivalent: 0.0 - 1.0 */
  fte: number;
  employmentType: 'full_time' | 'part_time' | 'seasonal';
  dataQualityFlags?: DataQualityFlag[];
}

export interface EmploymentGap {
  startDate: string;
  endDate: string;
  durationDays: number;
  type: 'explained' | 'unexplained';
  explanation?: string;
}

// ── SalaryTable ───────────────────────────────────────────────────

export interface SalaryTableProps {
  salaryRecords: SalaryRecord[];
  amsWindow: AMSWindow;
  /** null/undefined when leave payout is not applicable */
  leavePayout?: LeavePayoutSummary;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  onRecordDrillDown?: (recordId: string) => void;
}

export interface SalaryRecord {
  id: string;
  year: number;
  month: number;
  /** CON-01: string with 2 decimal places */
  grossSalary: string;
  /** CON-01: string with 2 decimal places */
  pensionableSalary: string;
  isInAMSWindow: boolean;
  includesLeavePayout: boolean;
  interactionType: InteractionType;
  dataQualityFlags?: DataQualityFlag[];
}

export interface AMSWindow {
  /** Tier 1/2 = 36, Tier 3 = 60 */
  months: 36 | 60;
  startDate: string;
  endDate: string;
  /** CON-01: string with 2 decimal places */
  totalSalary: string;
  /** CON-01: string with 2 decimal places */
  averageMonthlySalary: string;
  /** CON-01: string with 2 decimal places */
  averageWithoutLeavePayout?: string;
}

export interface LeavePayoutSummary {
  eligible: boolean;
  /** CON-01: string with 2 decimal places */
  amount: string;
  /** ISO month the payout is applied to salary */
  monthApplied: string;
  /** CON-01: string — dollar delta to AMS */
  amsImpact: string;
}

// ── BenefitCalculationPanel ───────────────────────────────────────

export interface BenefitCalculationPanelProps {
  calculation: BenefitCalculation;
  /** Whether to show expanded formula derivation */
  showDerivation?: boolean;
  onToggleDerivation?: () => void;
  /** Called when user clicks an explainable input value */
  onInputExplain?: (field: string) => void;
}

export interface BenefitCalculation {
  tier: 1 | 2 | 3;
  /** CON-01: string, e.g. "0.020" for Tier 1, "0.015" for Tier 2/3 */
  multiplier: string;
  /** e.g., 'RMC §18-407(a)' */
  multiplierSource: string;
  /** CON-01: string with 2 decimal places */
  ams: string;
  amsWindowMonths: 36 | 60;
  /** CON-01: string — total credited service years (earned + purchased) */
  serviceYears: string;
  /** CON-01: string with 2 decimal places */
  unreducedMonthlyBenefit: string;
  /** CON-01: string with 2 decimal places */
  unreducedAnnualBenefit: string;
  reductionApplied: boolean;
  /** CON-01: string, e.g. "0.30" for 30%. "0" if no reduction. */
  reductionPercent: string;
  reductionSource?: string;
  /** CON-01: string with 2 decimal places */
  reducedMonthlyBenefit?: string;
  /** CON-01: string with 2 decimal places */
  reducedAnnualBenefit?: string;
  /** Human-readable formula, e.g., '2.0% × $10,639.45 × 28.75' */
  formulaDisplay: string;
  statuteRefs: StatuteRef[];
  verificationStatus: 'verified' | 'pending' | 'discrepancy';
  calculationTimestamp: string;
}

// ── PaymentOptionsComparison ──────────────────────────────────────

export interface PaymentOptionsComparisonProps {
  options: PaymentOption[];
  selectedOptionId?: string;
  spousalConsentRequired: boolean;
  beneficiary?: Beneficiary;
  onSelect?: (optionId: string) => void;
  /** CON-01: string with 2 decimal places */
  lumpSumDeathBenefit: string;
}

export interface PaymentOption {
  id: string;
  type: PaymentOptionType;
  /** e.g., 'Maximum (Single Life)' */
  label: string;
  /** CON-01: string, e.g. "0.9150" for 75% J&S */
  factor: string;
  /** CON-01: string with 2 decimal places */
  monthlyAmount: string;
  /** CON-01: string with 2 decimal places */
  annualAmount: string;
  /** CON-01: string — "0.00" for maximum (single life) */
  survivorMonthlyAmount: string;
  /** 0, 50, 75, or 100 */
  survivorPercent: number;
}

export interface Beneficiary {
  name: string;
  relationship: string;
  dateOfBirth: string;
  age: number;
}

// ── ScenarioModeler ───────────────────────────────────────────────

export interface ScenarioModelerProps {
  memberId: string;
  /** The member's actual planned retirement scenario */
  currentScenario: ScenarioResult;
  /** Additional hypothetical scenarios for comparison */
  scenarios: ScenarioResult[];
  onAddScenario?: (retirementDate: string) => void;
  onRemoveScenario?: (scenarioId: string) => void;
  isLoading?: boolean;
}

export interface ScenarioResult {
  id: string;
  retirementDate: string;
  ageAtRetirement: number;
  /** CON-01: string */
  serviceYears: string;
  /** age + earned service */
  ruleOfScore: number;
  /** 75 for Tier 1/2, 85 for Tier 3 */
  ruleOfThreshold: 75 | 85;
  ruleOfMet: boolean;
  eligibilityType: EligibilityType;
  /** CON-01: string, e.g. "0.30" */
  reductionPercent: string;
  /** CON-01: string with 2 decimal places */
  estimatedAMS: string;
  /** CON-01: string with 2 decimal places */
  unreducedMonthly: string;
  /** CON-01: string — same as unreduced if no reduction */
  reducedMonthly: string;
  thresholdProximity?: ThresholdProximity;
}

export interface ThresholdProximity {
  /** How many points away from Rule of 75/85 */
  pointsAway: number;
  /** Projected date when threshold would be met */
  dateThresholdMet: string;
  /** CON-01: string — estimated monthly benefit if they wait until threshold */
  benefitAtThreshold: string;
  /** CON-01: string — monthly dollar increase from waiting */
  monthlyDelta: string;
  /** Percentage increase (e.g., 54 for Case 2's ~54% increase) */
  percentIncrease: number;
}

// ── DROImpactPanel ────────────────────────────────────────────────

export interface DROImpactPanelProps {
  droRecord: DRORecord;
  benefitCalculation: BenefitCalculation;
  selectedPaymentOption?: PaymentOption;
}

export interface DRORecord {
  id: string;
  caseNumber: string;
  alternatePayee: {
    name: string;
    relationship: 'former_spouse';
  };
  marriageDate: string;
  divorceDate: string;
  /** CON-01: string — years of service at marriage date */
  serviceAtMarriage: string;
  /** CON-01: string — years of service at divorce date */
  serviceAtDivorce: string;
  /** CON-01: string — serviceDuringMarriage = serviceAtDivorce - serviceAtMarriage */
  serviceDuringMarriage: string;
  /** CON-01: string */
  totalServiceAtRetirement: string;
  /** CON-01: string — serviceDuringMarriage / totalServiceAtRetirement */
  maritalFraction: string;
  awardType: 'percentage' | 'fixed_amount';
  /** CON-01: string, e.g. "0.40" for 40% */
  awardPercentage?: string;
  /** CON-01: string with 2 decimal places */
  awardFixedAmount?: string;
  /** CON-01: string — grossBenefit × maritalFraction */
  maritalShareOfBenefit: string;
  /** CON-01: string — maritalShare × awardPercentage */
  alternatePayeeAmount: string;
  /** CON-01: string — grossBenefit - alternatePayeeAmount */
  memberNetBenefit: string;
  effectiveDate: string;
  status: 'approved' | 'pending_review' | 'rejected';
}

// ── ServiceCreditSummary ──────────────────────────────────────────

export interface ServiceCreditSummaryProps {
  serviceCredit: ServiceCreditBreakdown;
  /** True when purchased service exists — triggers exclusion warning */
  showPurchasedServiceWarning: boolean;
  onDrillDown?: (category: string) => void;
}

export interface ServiceCreditBreakdown {
  /** CON-01: string — all service for benefit calculation */
  totalCredited: string;
  /** CON-01: string — for Rule of 75/85 eligibility (excludes purchased) */
  totalEarned: string;
  /** CON-01: string */
  totalPurchased: string;
  categories: ServiceCreditCategory[];
}

export interface ServiceCreditCategory {
  type: ServiceCreditType;
  label: string;
  /** CON-01: string */
  years: string;
  months: number;
  /** Always true — all categories count for benefit */
  countsForBenefit: boolean;
  /** False for purchased service */
  countsForEligibility: boolean;
  purchaseDate?: string;
  /** CON-01: string with 2 decimal places */
  purchaseCost?: string;
  interactionType: InteractionType;
}

// ── LeavePayoutCalculator ─────────────────────────────────────────

export interface LeavePayoutCalculatorProps {
  leavePayout: LeavePayoutDetail;
  /** CON-01: string — AMS computed without leave payout */
  amsWithout: string;
  /** CON-01: string — AMS computed with leave payout */
  amsWith: string;
  /** CON-01: string — monthly benefit without payout */
  benefitWithout: string;
  /** CON-01: string — monthly benefit with payout */
  benefitWith: string;
}

export interface LeavePayoutDetail {
  /** True for Tier 1/2 members hired before Jan 1, 2010 */
  eligible: boolean;
  /** Statutory basis for eligibility */
  eligibilityReason: string;
  sickLeaveHours: number;
  vacationLeaveHours: number;
  /** CON-01: string with 2 decimal places */
  hourlyRate: string;
  /** CON-01: string with 2 decimal places */
  totalPayoutAmount: string;
  /** ISO month the payout is added to salary */
  payoutMonth: string;
  /** e.g., 'RMC §18-401.5' */
  statuteRef: string;
}

// ── EarlyRetirementReductionCalculator ────────────────────────────

export interface EarlyRetirementReductionProps {
  tier: 1 | 2 | 3;
  ageAtRetirement: number;
  yearsUnder65: number;
  /** CON-01: string, "0.03" for Tier 1/2, "0.06" for Tier 3 */
  reductionRatePerYear: string;
  /** CON-01: string — yearsUnder65 × reductionRatePerYear */
  totalReductionPercent: string;
  /** CON-01: string with 2 decimal places */
  unreducedBenefit: string;
  /** CON-01: string with 2 decimal places */
  reducedBenefit: string;
  /** CON-01: string — unreducedBenefit - reducedBenefit */
  reductionAmount: string;
  /** Tier-specific RMC section */
  statuteRef: string;
}

// ── IPRCalculator ─────────────────────────────────────────────────

export interface IPRCalculatorProps {
  /** CON-01: string — earned service only */
  serviceYearsForIPR: string;
  /** CON-01: string — "$12.50" per year */
  preMedicareRate: string;
  /** CON-01: string — "$6.25" per year */
  postMedicareRate: string;
  /** CON-01: string — serviceYearsForIPR × preMedicareRate */
  preMedicareAmount: string;
  /** CON-01: string — serviceYearsForIPR × postMedicareRate */
  postMedicareAmount: string;
  /** Always 65 */
  medicareEligibilityAge: number;
  memberAge: number;
  isMedicareEligible: boolean;
  /** CON-01: string — based on current Medicare status */
  currentAmount: string;
  /** e.g., 'RMC §18-412' */
  statuteRef: string;
}
