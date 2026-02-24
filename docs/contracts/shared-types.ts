/**
 * NoUI Shared Type Definitions — Frontend
 *
 * These TypeScript interfaces correspond 1:1 with the Go types
 * in shared-types.go and the OpenAPI schemas. The frontend
 * consumes these types for all API interactions.
 *
 * Stream S3 — API Contracts (v1, Provisional)
 *
 * CONVENTIONS:
 *   - Monetary values: string with 2 decimal places (never number)
 *   - Dates: string in ISO 8601 format (YYYY-MM-DD)
 *   - Timestamps: string in ISO 8601 with timezone
 *   - Percentages: string decimal representation (0.03 = 3%)
 *   - Service durations: ServiceDuration object
 */

// ============================================================
// RESPONSE ENVELOPE
// ============================================================

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  service: 'connector' | 'intelligence' | 'workspace';
  version: string;
  /** Current system degradation level (0-5) per ADR-007 */
  degradationLevel: number;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface PaginatedResponse<T> {
  data: T;
  pagination: PaginationInfo;
  meta: ResponseMeta;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  source: {
    service: string;
    endpoint: string;
  };
}

export interface ErrorResponse {
  error: ErrorDetail;
  meta: Pick<ResponseMeta, 'requestId' | 'timestamp'>;
}

// ============================================================
// CORE DOMAIN TYPES
// ============================================================

export interface ServiceDuration {
  years: number;
  months: number;
  totalMonths: number;
  /** Decimal representation, e.g., "28.75" */
  decimalYears: string;
}

export type MemberStatus =
  | 'Active'
  | 'Retired'
  | 'Terminated'
  | 'Deceased'
  | 'Deferred'
  | 'Disability';

export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  hireDate: string;
  terminationDate: string | null;
  /** Benefit tier: 1, 2, or 3 (determined by hire date) */
  tier: 1 | 2 | 3;
  status: MemberStatus;
  gender?: string;
  maritalStatus?: MaritalStatus;
  department: string;
  position: string;
  currentEmployment?: EmploymentPeriod;
}

export type EmploymentType = 'Full-Time' | 'Part-Time' | 'Temporary';
export type ActionType = 'Hire' | 'Transfer' | 'Promotion' | 'Separation' | 'Rehire';

export interface EmploymentPeriod {
  effectiveDate: string;
  endDate: string | null;
  department: string;
  position: string;
  employmentType: EmploymentType;
  /** Full-time equivalent (1.0 = full time) */
  fte: number;
  actionType: ActionType;
}

export interface SalaryRecord {
  payPeriodDate: string;
  payPeriodEndDate?: string;
  grossPay: string;
  pensionablePay: string;
  overtime?: string;
  leavePayout?: string;
  furloughDeduction?: string;
  employeeContribution: string;
  employerContribution: string;
  /** Whether this record falls within the AMS calculation window */
  isInAmsWindow: boolean;
}

export interface AMSMonthlyDetail {
  month: string;
  pensionablePay: string;
  leavePayout?: string;
  total: string;
}

export interface AMSCalculation {
  /** Average Monthly Salary (2 decimal places) */
  amount: string;
  /** 36 for Tiers 1/2, 60 for Tier 3 */
  windowMonths: 36 | 60;
  windowStart: string;
  windowEnd: string;
  totalCompensationInWindow: string;
  leavePayoutIncluded: boolean;
  leavePayoutAmount?: string;
  monthlyBreakdown: AMSMonthlyDetail[];
}

export type ServiceCreditType = 'Employment' | 'Purchased' | 'Military' | 'Leave';

export interface ServiceCreditRecord {
  type: ServiceCreditType;
  startDate?: string;
  endDate?: string;
  duration: ServiceDuration;
  /** Cost for purchased service (null for earned) */
  cost: string | null;
  paymentStatus: 'Paid' | 'Partial' | 'Pending' | null;
  countsForBenefit: boolean;
  /** CRITICAL: Purchased service is always false */
  countsForEligibility: boolean;
  countsForIPR: boolean;
}

export interface ServiceCreditSummary {
  earned: ServiceDuration;
  purchased: ServiceDuration;
  military: ServiceDuration;
  leave: ServiceDuration;
  /** All types combined */
  totalForBenefit: ServiceDuration;
  /** Purchased EXCLUDED */
  totalForEligibility: ServiceDuration;
  /** Purchased EXCLUDED */
  totalForIPR: ServiceDuration;
}

export type BeneficiaryType = 'Primary' | 'Contingent';

export interface Beneficiary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  relationship?: 'Spouse' | 'Child' | 'Parent' | 'Sibling' | 'Other';
  type: BeneficiaryType;
  allocationPercentage: number;
  effectiveDate: string;
  supersededDate: string | null;
}

export type DRODivisionMethod = 'Percentage' | 'Amount';
export type DROStatus = 'Active' | 'Pending' | 'Expired';

export interface DRORecord {
  id: string;
  alternatePayee: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  };
  marriageDate: string;
  divorceDate: string;
  divisionMethod: DRODivisionMethod;
  /** Decimal for percentage (e.g., "0.40"), dollar for amount */
  divisionValue: string;
  status: DROStatus;
  courtOrderDate?: string;
  filingDate?: string;
}

export interface ContributionRecord {
  date: string;
  employeeAmount: string;
  employerAmount: string;
  employeeRate: string;
  employerRate: string;
  runningBalance: string;
}

// ============================================================
// CALCULATION TYPES (Intelligence Service responses)
// ============================================================

export type CalculationType = 'benefit' | 'eligibility' | 'paymentOptions' | 'dro';

export interface CalculationStep {
  stepNumber: number;
  label: string;
  /** Rule ID from rules inventory (e.g., "MEMBERSHIP-001") */
  ruleId: string;
  /** Governing document citation (e.g., "RMC 18-403.5(a)") */
  sourceReference: string;
  inputs: Record<string, unknown>;
  formula?: string;
  intermediateValues?: Record<string, unknown>;
  result: unknown;
  notes?: string;
}

export interface CalculationTrace {
  traceId: string;
  calculationType: CalculationType;
  memberId: string;
  retirementDate?: string;
  timestamp: string;
  steps: CalculationStep[];
  finalResult: Record<string, unknown>;
}

export type RetirementPathType =
  | 'normal'
  | 'rule75'
  | 'rule85'
  | 'earlyTier12'
  | 'earlyTier3'
  | 'deferred'
  | 'disability';

export interface EligibilityCondition {
  name: string;
  met: boolean;
  required: string;
  actual: string;
}

export interface EligibilityPath {
  pathType: RetirementPathType;
  displayName: string;
  eligible: boolean;
  applicableToTier: boolean;
  conditions: EligibilityCondition[];
  projectedEligibilityDate: string | null;
  /** Early retirement reduction if this path used (e.g., "0.30") */
  reductionIfUsed: string | null;
}

export interface EligibilityResult {
  memberId: string;
  tier: number;
  evaluationDate: string;
  ageAtDate: number;
  serviceAtDate: {
    earned: string;
    total: string;
  };
  paths: EligibilityPath[];
  trace: CalculationTrace;
}

export interface EarlyRetirementReduction {
  yearsUnder65: number;
  /** 0.03 for Tiers 1/2, 0.06 for Tier 3 (CRITICAL-001) */
  ratePerYear: string;
  totalReduction: string;
  reductionAmount: string;
  exemptReason: string | null;
}

export interface BenefitCalculationResult {
  memberId: string;
  retirementDate: string;
  tier: number;
  retirementType: 'Normal' | 'Rule of 75' | 'Rule of 85' | 'Early Retirement';
  calculation: {
    ams: {
      amount: string;
      windowMonths: number;
      leavePayoutIncluded: boolean;
      leavePayoutAmount?: string;
    };
    serviceYears: {
      forBenefit: string;
      forEligibility: string;
      earned: string;
      purchased: string;
    };
    multiplier: string;
    formula: string;
    grossBenefit: string;
    earlyRetirementReduction: EarlyRetirementReduction | null;
    netBenefit: string;
    lumpSumDeathBenefit: {
      amount: string;
      formula: string;
    };
    ipr: {
      medicareEligible: string;
      nonMedicareEligible: string;
      serviceYearsUsed: string;
    };
  };
  trace: CalculationTrace;
}

export type PaymentOptionType = 'maximum' | 'js100' | 'js75' | 'js50';

export interface PaymentOption {
  optionType: PaymentOptionType;
  displayName: string;
  monthlyAmount: string;
  reductionFactor: string;
  reductionPercentage: string;
  survivorBenefit: string | null;
  /** Amount before DRO split (null if no DRO) */
  preDROAmount: string | null;
}

export interface PaymentOptionsResult {
  memberId: string;
  grossBenefit: string;
  options: PaymentOption[];
  spousalConsentRequired: boolean;
  droApplied: boolean;
  droImpact: {
    alternatePayeeAmount: string;
    memberRetainedAmount: string;
  } | null;
  trace: CalculationTrace;
}

export interface ScenarioResult {
  retirementDate: string;
  ageAtRetirement: number;
  serviceAtRetirement: string;
  eligible: boolean;
  retirementType: string;
  grossBenefit: string;
  reductionPercentage: string | null;
  netBenefit: string;
  changeFromPrevious: {
    amount: string;
    percentage: string;
  } | null;
}

export interface ThresholdCrossing {
  date: string;
  event: string;
  benefitImpact: string;
}

export interface DROImpactResult {
  memberId: string;
  dro: {
    alternatePayeeFirstName: string;
    alternatePayeeLastName: string;
    marriageDate: string;
    divorceDate: string;
    divisionMethod: string;
    divisionValue: string;
  };
  maritalFraction: {
    serviceDuringMarriage: string;
    totalService: string;
    fraction: string;
    formula: string;
  };
  maritalShare: { amount: string; formula: string };
  alternatePayeeAmount: { amount: string; formula: string };
  memberRetainedBenefit: string;
  trace: CalculationTrace;
}

// ============================================================
// WORKSPACE TYPES (Workspace Service responses)
// ============================================================

export type ComponentType =
  | 'MemberBanner'
  | 'AlertBar'
  | 'EmploymentTimeline'
  | 'SalaryTable'
  | 'ServiceCreditSummary'
  | 'BenefitCalculationPanel'
  | 'PaymentOptionsComparison'
  | 'DROImpactPanel'
  | 'ScenarioModeler'
  | 'LeavePayoutCalculator'
  | 'EarlyRetirementReductionCalculator'
  | 'IPRCalculator'
  | 'DataQualityDashboard'
  | 'TransactionAnalysisDashboard';

export type AlertSeverity = 'info' | 'warning' | 'error';

export interface WorkspaceAlert {
  alertId: string;
  severity: AlertSeverity;
  message: string;
  details?: string;
  actionable: boolean;
  actionLabel?: string;
}

export interface DataSource {
  service: 'connector' | 'intelligence';
  endpoint: string;
  method: 'GET' | 'POST';
  body?: Record<string, unknown>;
}

export interface WorkspaceComponent {
  componentId: string;
  componentType: ComponentType;
  visible: boolean;
  expanded: boolean;
  dataSource?: DataSource;
  parameters?: Record<string, unknown>;
  /** Which composition tier added this component (1, 2, or 3) */
  compositionTier: 1 | 2 | 3;
}

export interface WorkspaceZone {
  zoneId: 'banner' | 'alerts' | 'primary' | 'secondary' | 'analysis' | 'actions';
  name: string;
  componentIds: string[];
  layout: 'stack' | 'grid-2col' | 'grid-3col' | 'tabs';
}

export interface CompositionMeta {
  tier1Components: string[];
  tier2Components: string[];
  tier2Removals: string[];
  tier3Components: string[];
  tier3Used: boolean;
  tier3FellBack: boolean;
  compositionRules: Array<{
    rule: string;
    trigger: string;
    action: string;
  }>;
}

export interface WorkspaceDefinition {
  workspaceId: string;
  memberId: string;
  processType: string;
  processStage: string;
  layout: { zones: WorkspaceZone[] };
  components: WorkspaceComponent[];
  alerts: WorkspaceAlert[];
  compositionMeta: CompositionMeta;
}

export type HubCardType =
  | 'OpenTasks'
  | 'RecentActivity'
  | 'BenefitEstimate'
  | 'ServiceCredit'
  | 'Contributions'
  | 'BeneficiaryInfo'
  | 'Contact'
  | 'Documents'
  | 'DRO'
  | 'SurvivorWorkflow'
  | 'RefundEligibility'
  | 'ScenarioModeler';

export interface HubCard {
  cardId: string;
  cardType: HubCardType;
  title: string;
  visible: boolean;
  order: number;
  expanded: boolean;
  highlighted: boolean;
  badge: string | null;
  dataSource?: DataSource;
}
