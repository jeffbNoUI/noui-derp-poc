// Package domain defines the shared type definitions used across all
// NoUI services. These types form the data contracts between the
// Data Connector, Intelligence, and Workspace services.
//
// CONVENTIONS:
//   - All monetary values use string with exactly 2 decimal places
//     to avoid floating-point precision errors. Internally, services
//     use big.Rat or scaled integers for calculation, then serialize
//     to string for transport.
//   - All dates use ISO 8601 (YYYY-MM-DD) represented as string.
//   - All timestamps use ISO 8601 with timezone (RFC 3339).
//   - Percentages are string decimal representation ("0.03" = 3%).
//   - Service durations use ServiceDuration with years, months,
//     total months, and a decimal-years convenience field.
//   - All enum values use lowercase (e.g., "active", not "Active").
//
// Stream S3 — API Contracts (v1)
// CRITICAL-002: Conflict resolutions applied (CON-01, CON-02, CON-03)
package domain

import "time"

// ============================================================
// RESPONSE ENVELOPE (CON-03 resolution: merged S1 + S3)
// ============================================================

// ResponseMeta is included in every API response for tracing and
// system health awareness. The DegradationLevel field enables the
// frontend to display status indicators per ADR-007. The Source
// field (from S1) identifies the upstream data origin for audit.
type ResponseMeta struct {
	RequestID        string    `json:"requestId"`
	Timestamp        time.Time `json:"timestamp"`
	Service          string    `json:"service"`          // "connector", "intelligence", "workspace"
	Version          string    `json:"version"`          // "v1"
	DegradationLevel int       `json:"degradationLevel"` // 0-5 per ADR-007
	Source           string    `json:"source,omitempty"` // e.g., "legacy_derp_db" (CON-03)
}

// DataQualityFlag surfaces data quality issues discovered by the
// Connector or Intelligence service. Included at the top level of
// every API response so the frontend can render DQ indicators.
type DataQualityFlag struct {
	Code          string  `json:"code"`                    // e.g., "DQ-001", "DQ-006"
	Severity      string  `json:"severity"`                // "critical", "high", "medium", "low"
	Entity        string  `json:"entity,omitempty"`        // "member", "salary", "service_credit"
	Field         string  `json:"field"`                   // Affected field name
	Message       string  `json:"message"`                 // Human-readable description
	StoredValue   any     `json:"storedValue,omitempty"`   // What the database says
	ExpectedValue any     `json:"expectedValue,omitempty"` // What it should be
	Rule          string  `json:"rule,omitempty"`          // Business rule reference
	Impact        string  `json:"impact,omitempty"`        // Impact description
}

// ApiResponse is the standard envelope for all successful responses.
// CON-03: data + dataQualityFlags at top level, meta for tracing.
type ApiResponse[T any] struct {
	Data             T                `json:"data"`
	DataQualityFlags []DataQualityFlag `json:"dataQualityFlags"`
	Meta             ResponseMeta     `json:"meta"`
}

// PaginatedResponse extends ApiResponse with pagination info.
type PaginatedResponse[T any] struct {
	Data             T                `json:"data"`
	DataQualityFlags []DataQualityFlag `json:"dataQualityFlags"`
	Pagination       PaginationInfo   `json:"pagination"`
	Meta             ResponseMeta     `json:"meta"`
}

// PaginationInfo is included in collection responses that support paging.
type PaginationInfo struct {
	Total   int  `json:"total"`
	Limit   int  `json:"limit"`
	Offset  int  `json:"offset"`
	HasMore bool `json:"hasMore"`
}

// ErrorDetail is the standard error response structure. All services
// use this format regardless of the error type.
type ErrorDetail struct {
	Code    string         `json:"code"`    // SCREAMING_SNAKE_CASE
	Message string         `json:"message"` // Human-readable
	Details map[string]any `json:"details,omitempty"`
	Source  ErrorSource    `json:"source"`
}

type ErrorSource struct {
	Service  string `json:"service"`
	Endpoint string `json:"endpoint"`
}

type ErrorResponse struct {
	Error ErrorDetail  `json:"error"`
	Meta  ResponseMeta `json:"meta"`
}

// ============================================================
// CORE DOMAIN TYPES
// ============================================================

// ServiceDuration represents a period of service credit as both
// discrete (years, months) and continuous (decimal years) values.
// Both representations are provided to avoid rounding disagreements
// between services.
type ServiceDuration struct {
	Years        int    `json:"years"`
	Months       int    `json:"months"`
	TotalMonths  int    `json:"totalMonths"`
	DecimalYears string `json:"decimalYears"` // e.g., "28.75"
}

// Member is the core member profile. Fields are mapped from the
// legacy MEMBER_MASTER table by the Data Connector.
type Member struct {
	ID                string            `json:"id"`              // Mapped from MBR_ID
	FirstName         string            `json:"firstName"`       // Mapped from FIRST_NM
	LastName          string            `json:"lastName"`        // Mapped from LAST_NM
	MiddleName        string            `json:"middleName,omitempty"`
	DateOfBirth       string            `json:"dateOfBirth"`     // ISO 8601 date
	HireDate          string            `json:"hireDate"`        // Determines tier
	TerminationDate   *string           `json:"terminationDate"` // Null if active
	Tier              int               `json:"tier"`            // 1, 2, or 3
	Status            MemberStatus      `json:"status"`
	Gender            string            `json:"gender,omitempty"`
	MaritalStatus     MaritalStatus     `json:"maritalStatus,omitempty"`
	Department        string            `json:"department"`
	Position          string            `json:"position"`
	CurrentEmployment *EmploymentPeriod `json:"currentEmployment,omitempty"`
}

// CON-02 resolution: lowercase enum values, canonical set from S1 + disability
type MemberStatus string

const (
	StatusActive     MemberStatus = "active"
	StatusRetired    MemberStatus = "retired"
	StatusTerminated MemberStatus = "terminated"
	StatusDeferred   MemberStatus = "deferred"
	StatusDeceased   MemberStatus = "deceased"
	StatusDisability MemberStatus = "disability"
)

type MaritalStatus string

const (
	MaritalSingle   MaritalStatus = "single"
	MaritalMarried  MaritalStatus = "married"
	MaritalDivorced MaritalStatus = "divorced"
	MaritalWidowed  MaritalStatus = "widowed"
)

// EmploymentPeriod represents a single employment event/period.
// Mapped from EMPLOYMENT_HIST.
type EmploymentPeriod struct {
	EffectiveDate  string         `json:"effectiveDate"`
	EndDate        *string        `json:"endDate"`
	Department     string         `json:"department"`
	Position       string         `json:"position"`
	EmploymentType EmploymentType `json:"employmentType"`
	FTE            float64        `json:"fte"`
	ActionType     ActionType     `json:"actionType"`
}

type EmploymentType string

const (
	EmploymentFullTime  EmploymentType = "full_time"
	EmploymentPartTime  EmploymentType = "part_time"
	EmploymentTemporary EmploymentType = "temporary"
)

type ActionType string

const (
	ActionHire       ActionType = "hire"
	ActionTransfer   ActionType = "transfer"
	ActionPromotion  ActionType = "promotion"
	ActionSeparation ActionType = "separation"
	ActionRehire     ActionType = "rehire"
)

// SalaryRecord represents a single pay period record.
// Mapped from SALARY_HIST.
type SalaryRecord struct {
	PayPeriodDate        string `json:"payPeriodDate"`
	PayPeriodEndDate     string `json:"payPeriodEndDate,omitempty"`
	GrossPay             string `json:"grossPay"`             // 2 decimal places
	PensionablePay       string `json:"pensionablePay"`       // 2 decimal places
	Overtime             string `json:"overtime,omitempty"`
	LeavePayout          string `json:"leavePayout,omitempty"`
	FurloughDeduction    string `json:"furloughDeduction,omitempty"`
	EmployeeContribution string `json:"employeeContribution"` // 2 decimal places
	EmployerContribution string `json:"employerContribution"` // 2 decimal places
	IsInAMSWindow        bool   `json:"isInAmsWindow"`
}

// AMSCalculation is the Average Monthly Salary calculation result.
// This is the most computationally significant function in the system.
type AMSCalculation struct {
	Amount                    string             `json:"amount"`       // 2 decimal places
	WindowMonths              int                `json:"windowMonths"` // 36 or 60
	WindowStart               string             `json:"windowStart"`
	WindowEnd                 string             `json:"windowEnd"`
	TotalCompensationInWindow string             `json:"totalCompensationInWindow"`
	LeavePayoutIncluded       bool               `json:"leavePayoutIncluded"`
	LeavePayoutAmount         string             `json:"leavePayoutAmount,omitempty"`
	MonthlyBreakdown          []AMSMonthlyDetail `json:"monthlyBreakdown"`
}

type AMSMonthlyDetail struct {
	Month          string `json:"month"`
	PensionablePay string `json:"pensionablePay"`
	LeavePayout    string `json:"leavePayout,omitempty"`
	Total          string `json:"total"`
}

// ServiceCreditRecord represents a single service credit entry.
// Mapped from SVC_CREDIT. CRITICAL: The CountsFor flags distinguish
// how each type of credit is used across different calculations.
type ServiceCreditRecord struct {
	Type                 ServiceCreditType `json:"type"`
	StartDate            string            `json:"startDate,omitempty"`
	EndDate              string            `json:"endDate,omitempty"`
	Duration             ServiceDuration   `json:"duration"`
	Cost                 *string           `json:"cost"`          // Null for earned
	PaymentStatus        *PaymentStatus    `json:"paymentStatus"` // Null for earned
	CountsForBenefit     bool              `json:"countsForBenefit"`
	CountsForEligibility bool              `json:"countsForEligibility"` // CRITICAL: false for purchased
	CountsForIPR         bool              `json:"countsForIPR"`
}

type ServiceCreditType string

const (
	CreditEmployment ServiceCreditType = "employment"
	CreditPurchased  ServiceCreditType = "purchased"
	CreditMilitary   ServiceCreditType = "military"
	CreditLeave      ServiceCreditType = "leave"
)

type PaymentStatus string

const (
	PaymentPaid    PaymentStatus = "paid"
	PaymentPartial PaymentStatus = "partial"
	PaymentPending PaymentStatus = "pending"
)

// ServiceCreditSummary aggregates service credit by type and purpose.
type ServiceCreditSummary struct {
	Earned             ServiceDuration `json:"earned"`
	Purchased          ServiceDuration `json:"purchased"`
	Military           ServiceDuration `json:"military"`
	Leave              ServiceDuration `json:"leave"`
	TotalForBenefit    ServiceDuration `json:"totalForBenefit"`    // All types
	TotalForEligibility ServiceDuration `json:"totalForEligibility"` // Purchased EXCLUDED
	TotalForIPR        ServiceDuration `json:"totalForIPR"`        // Purchased EXCLUDED
}

// Beneficiary represents a named beneficiary on the member's account.
type Beneficiary struct {
	ID                   string          `json:"id"`
	FirstName            string          `json:"firstName"`
	LastName             string          `json:"lastName"`
	DateOfBirth          string          `json:"dateOfBirth,omitempty"`
	Relationship         string          `json:"relationship,omitempty"` // "spouse", "child", etc.
	Type                 BeneficiaryType `json:"type"`
	AllocationPercentage string          `json:"allocationPercentage"` // CON-01: string
	EffectiveDate        string          `json:"effectiveDate"`
	SupersededDate       *string         `json:"supersededDate"`
}

type BeneficiaryType string

const (
	BenePrimary    BeneficiaryType = "primary"
	BeneContingent BeneficiaryType = "contingent"
)

// DRORecord represents a Domestic Relations Order.
type DRORecord struct {
	ID              string           `json:"id"`
	AlternatePayee  DROPayee         `json:"alternatePayee"`
	MarriageDate    string           `json:"marriageDate"`
	DivorceDate     string           `json:"divorceDate"`
	DivisionMethod  DRODivisionMethod `json:"divisionMethod"`
	DivisionValue   string           `json:"divisionValue"` // Decimal for pct, dollar for amount
	Status          DROStatus        `json:"status"`
	CourtOrderDate  string           `json:"courtOrderDate,omitempty"`
	FilingDate      string           `json:"filingDate,omitempty"`
}

type DROPayee struct {
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	DateOfBirth string `json:"dateOfBirth,omitempty"`
}

type DRODivisionMethod string

const (
	DROPercentage DRODivisionMethod = "percentage"
	DROAmount     DRODivisionMethod = "amount"
)

type DROStatus string

const (
	DROActive  DROStatus = "active"
	DROPending DROStatus = "pending"
	DROExpired DROStatus = "expired"
)

// ContributionRecord represents a single contribution period.
type ContributionRecord struct {
	Date             string `json:"date"`
	EmployeeAmount   string `json:"employeeAmount"`
	EmployerAmount   string `json:"employerAmount"`
	EmployeeRate     string `json:"employeeRate"`
	EmployerRate     string `json:"employerRate"`
	RunningBalance   string `json:"runningBalance"`
}

// ============================================================
// CALCULATION TYPES (Intelligence Service responses)
// ============================================================

type CalculationType string

const (
	CalcBenefit        CalculationType = "benefit"
	CalcEligibility    CalculationType = "eligibility"
	CalcPaymentOptions CalculationType = "paymentOptions"
	CalcDRO            CalculationType = "dro"
)

// CalculationStep is one step in a transparent calculation trace.
// Every step references its governing document provision.
type CalculationStep struct {
	StepNumber         int            `json:"stepNumber"`
	Label              string         `json:"label"`
	RuleID             string         `json:"ruleId"`             // From rules inventory
	SourceReference    string         `json:"sourceReference"`    // RMC citation
	Inputs             map[string]any `json:"inputs"`
	Formula            string         `json:"formula,omitempty"`
	IntermediateValues map[string]any `json:"intermediateValues,omitempty"`
	Result             any            `json:"result"`
	Notes              string         `json:"notes,omitempty"`
}

// CalculationTrace is the complete audit trail for a calculation.
type CalculationTrace struct {
	TraceID         string            `json:"traceId"`
	CalculationType CalculationType   `json:"calculationType"`
	MemberID        string            `json:"memberId"`
	RetirementDate  string            `json:"retirementDate,omitempty"`
	Timestamp       string            `json:"timestamp"`
	Steps           []CalculationStep `json:"steps"`
	FinalResult     map[string]any    `json:"finalResult"`
}

// EligibilityPath represents one possible retirement pathway.
type EligibilityPath struct {
	PathType                 RetirementPathType     `json:"pathType"`
	DisplayName              string                 `json:"displayName"`
	Eligible                 bool                   `json:"eligible"`
	ApplicableToTier         bool                   `json:"applicableToTier"`
	Conditions               []EligibilityCondition `json:"conditions"`
	ProjectedEligibilityDate *string                `json:"projectedEligibilityDate"`
	ReductionIfUsed          *string                `json:"reductionIfUsed"`
}

type RetirementPathType string

const (
	PathNormal      RetirementPathType = "normal"
	PathRule75      RetirementPathType = "rule75"
	PathRule85      RetirementPathType = "rule85"
	PathEarlyTier12 RetirementPathType = "earlyTier12"
	PathEarlyTier3  RetirementPathType = "earlyTier3"
	PathDeferred    RetirementPathType = "deferred"
	PathDisability  RetirementPathType = "disability"
)

type EligibilityCondition struct {
	Name     string `json:"name"`     // e.g., "Minimum Age"
	Met      bool   `json:"met"`
	Required string `json:"required"` // Required value
	Actual   string `json:"actual"`   // Member's value
}

// BenefitCalculation holds the complete benefit calculation result.
type BenefitCalculation struct {
	AMS                      AMSResult                 `json:"ams"`
	ServiceYears             ServiceYearsBreakdown     `json:"serviceYears"`
	Multiplier               string                    `json:"multiplier"`    // e.g., "0.02"
	Formula                  string                    `json:"formula"`       // Human-readable
	GrossBenefit             string                    `json:"grossBenefit"`  // 2 decimal places
	EarlyRetirementReduction *EarlyRetirementReduction `json:"earlyRetirementReduction"`
	NetBenefit               string                    `json:"netBenefit"`
	LumpSumDeathBenefit      LumpSumDeathBenefit       `json:"lumpSumDeathBenefit"`
	IPR                      IPRCalculation            `json:"ipr"`
}

type AMSResult struct {
	Amount              string `json:"amount"`
	WindowMonths        int    `json:"windowMonths"`
	LeavePayoutIncluded bool   `json:"leavePayoutIncluded"`
	LeavePayoutAmount   string `json:"leavePayoutAmount,omitempty"`
}

type ServiceYearsBreakdown struct {
	ForBenefit     string `json:"forBenefit"`     // Earned + purchased
	ForEligibility string `json:"forEligibility"` // Earned only
	Earned         string `json:"earned"`
	Purchased      string `json:"purchased"`
}

// EarlyRetirementReduction represents the reduction applied to
// early retirement benefits. CRITICAL-001: Rates differ by tier.
type EarlyRetirementReduction struct {
	YearsUnder65    int    `json:"yearsUnder65"`
	RatePerYear     string `json:"ratePerYear"`     // "0.03" for T1/T2, "0.06" for T3
	TotalReduction  string `json:"totalReduction"`  // Percentage as string
	ReductionAmount string `json:"reductionAmount"` // Dollar amount as string
	ExemptReason    *string `json:"exemptReason"`   // "Rule of 75 met", etc.
}

type LumpSumDeathBenefit struct {
	Amount  string `json:"amount"`
	Formula string `json:"formula"`
}

type IPRCalculation struct {
	MedicareEligible    string `json:"medicareEligible"`    // Monthly amount
	NonMedicareEligible string `json:"nonMedicareEligible"` // Monthly amount
	ServiceYearsUsed    string `json:"serviceYearsUsed"`    // Earned only
}

// PaymentOption represents one of the four payment options.
type PaymentOption struct {
	OptionType          PaymentOptionType `json:"optionType"`
	DisplayName         string            `json:"displayName"`
	MonthlyAmount       string            `json:"monthlyAmount"`
	ReductionFactor     string            `json:"reductionFactor"`
	ReductionPercentage string            `json:"reductionPercentage"`
	SurvivorBenefit     *string           `json:"survivorBenefit"`
	PreDROAmount        *string           `json:"preDROAmount"`
}

type PaymentOptionType string

const (
	OptionMaximum PaymentOptionType = "maximum"
	OptionJS100   PaymentOptionType = "js100"
	OptionJS75    PaymentOptionType = "js75"
	OptionJS50    PaymentOptionType = "js50"
)

// DROImpact holds the complete DRO calculation result.
type DROImpact struct {
	MaritalFraction       MaritalFraction  `json:"maritalFraction"`
	MaritalShare          MoneyWithFormula  `json:"maritalShare"`
	AlternatePayeeAmount  MoneyWithFormula  `json:"alternatePayeeAmount"`
	MemberRetainedBenefit string           `json:"memberRetainedBenefit"`
}

type MaritalFraction struct {
	ServiceDuringMarriage string `json:"serviceDuringMarriage"` // Decimal years
	TotalService          string `json:"totalService"`          // Decimal years
	Fraction              string `json:"fraction"`              // e.g., "0.6348"
	Formula               string `json:"formula"`               // e.g., "18.25 / 28.75"
}

type MoneyWithFormula struct {
	Amount  string `json:"amount"`
	Formula string `json:"formula"`
}

// ScenarioResult represents one retirement date scenario.
type ScenarioResult struct {
	RetirementDate      string        `json:"retirementDate"`
	AgeAtRetirement     int           `json:"ageAtRetirement"`
	ServiceAtRetirement string        `json:"serviceAtRetirement"`
	Eligible            bool          `json:"eligible"`
	RetirementType      string        `json:"retirementType"`
	GrossBenefit        string        `json:"grossBenefit"`
	ReductionPercentage *string       `json:"reductionPercentage"`
	NetBenefit          string        `json:"netBenefit"`
	ChangeFromPrevious  *ChangeDetail `json:"changeFromPrevious"`
}

type ChangeDetail struct {
	Amount     string `json:"amount"`
	Percentage string `json:"percentage"`
}

// ============================================================
// WORKSPACE TYPES (Workspace Service)
// ============================================================

// WorkspaceComponent defines a single component in a composed workspace.
type WorkspaceComponent struct {
	ComponentID     string         `json:"componentId"`
	ComponentType   ComponentType  `json:"componentType"`
	Visible         bool           `json:"visible"`
	Expanded        bool           `json:"expanded"`
	DataSource      *DataSource    `json:"dataSource,omitempty"`
	Parameters      map[string]any `json:"parameters,omitempty"`
	CompositionTier int            `json:"compositionTier"` // 1, 2, or 3
}

type ComponentType string

const (
	CompMemberBanner             ComponentType = "MemberBanner"
	CompAlertBar                 ComponentType = "AlertBar"
	CompEmploymentTimeline       ComponentType = "EmploymentTimeline"
	CompSalaryTable              ComponentType = "SalaryTable"
	CompServiceCreditSummary     ComponentType = "ServiceCreditSummary"
	CompBenefitCalculationPanel  ComponentType = "BenefitCalculationPanel"
	CompPaymentOptionsComparison ComponentType = "PaymentOptionsComparison"
	CompDROImpactPanel           ComponentType = "DROImpactPanel"
	CompScenarioModeler          ComponentType = "ScenarioModeler"
	CompLeavePayoutCalculator    ComponentType = "LeavePayoutCalculator"
	CompEarlyRetirementReduction ComponentType = "EarlyRetirementReductionCalculator"
	CompIPRCalculator            ComponentType = "IPRCalculator"
	CompDataQualityDashboard     ComponentType = "DataQualityDashboard"
	CompTransactionAnalysis      ComponentType = "TransactionAnalysisDashboard"
)

type DataSource struct {
	Service  string         `json:"service"`  // "connector" or "intelligence"
	Endpoint string         `json:"endpoint"` // Full path with {id} placeholder
	Method   string         `json:"method"`   // "GET" or "POST"
	Body     map[string]any `json:"body,omitempty"`
}

// WorkspaceAlert defines an alert for the AlertBar component.
type WorkspaceAlert struct {
	AlertID     string        `json:"alertId"`
	Severity    AlertSeverity `json:"severity"`
	Message     string        `json:"message"`
	Details     string        `json:"details,omitempty"`
	Actionable  bool          `json:"actionable"`
	ActionLabel *string       `json:"actionLabel,omitempty"`
}

type AlertSeverity string

const (
	AlertInfo    AlertSeverity = "info"
	AlertWarning AlertSeverity = "warning"
	AlertError   AlertSeverity = "error"
)
