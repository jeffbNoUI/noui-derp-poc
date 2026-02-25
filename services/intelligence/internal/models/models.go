// Package models defines the request/response types for the intelligence service.
// Consumed by: handlers, eligibility evaluator, benefit calculator, connector client
// Depends on: nothing (leaf package)
package models

import "time"

// MemberData represents member data fetched from the connector service.
// JSON tags match the connector's camelCase response format (Session 2 CRITICAL-002 update).
type MemberData struct {
	MemberID      string     `json:"memberId"`
	FirstName     string     `json:"firstName"`
	LastName      string     `json:"lastName"`
	DateOfBirth   *time.Time `json:"-"` // Parsed from string in connector client
	HireDate      *time.Time `json:"-"` // Parsed from string in connector client
	TermDate      *time.Time `json:"-"` // Parsed from string in connector client
	Tier          int        `json:"tier"`
	Status        string     `json:"status"`
	Department    string     `json:"department,omitempty"`
	Position      string     `json:"position,omitempty"`
	AnnualSalary  string     `json:"annualSalary,omitempty"` // String per CRITICAL-002
	MaritalStatus string     `json:"maritalStatus,omitempty"`

	// Raw string dates from connector JSON (populated during unmarshal)
	RawDOB      string `json:"dateOfBirth"`
	RawHireDate string `json:"hireDate"`
	RawTermDate string `json:"terminationDate"`
}

// ParseDates converts the raw string date fields to time.Time pointers.
// Called by the connector client after JSON unmarshal.
func (m *MemberData) ParseDates() {
	if m.RawDOB != "" {
		if t, err := time.Parse("2006-01-02", m.RawDOB); err == nil {
			m.DateOfBirth = &t
		}
	}
	if m.RawHireDate != "" {
		if t, err := time.Parse("2006-01-02", m.RawHireDate); err == nil {
			m.HireDate = &t
		}
	}
	if m.RawTermDate != "" {
		if t, err := time.Parse("2006-01-02", m.RawTermDate); err == nil {
			m.TermDate = &t
		}
	}
}

// ServiceCreditSummary from the connector service.
// JSON tags use snake_case — the connector's internal models were not changed to camelCase.
type ServiceCreditSummary struct {
	EarnedYears    float64 `json:"earned_years"`
	PurchasedYears float64 `json:"purchased_years"`
	MilitaryYears  float64 `json:"military_years"`
	LeaveYears     float64 `json:"leave_years"`
	TotalForBenefit float64 `json:"total_for_benefit"`
	TotalForElig   float64 `json:"total_for_eligibility"`
	TotalForIPR    float64 `json:"total_for_ipr"`
}

// AMSResult from the connector service salary endpoint.
// String monetary values per CRITICAL-002.
type AMSResult struct {
	Amount              string `json:"amount"`                   // String: "10639.45"
	WindowMonths        int    `json:"windowMonths"`
	WindowStart         string `json:"windowStart"`
	WindowEnd           string `json:"windowEnd"`
	TotalCompensation   string `json:"totalCompensationInWindow"`
	BaseCompensation    string `json:"baseCompensation"`
	LeavePayoutIncluded bool   `json:"leavePayoutIncluded"`
	LeavePayoutAmount   string `json:"leavePayoutAmount,omitempty"`

	// Parsed AMS as float64 for calculations — populated by connector client
	AMS float64 `json:"-"`
}

// DRORecord from the connector service.
// JSON tags use snake_case — connector's internal DRO model was not changed.
type DRORecord struct {
	DROID            int        `json:"dro_id"`
	MemberID         string     `json:"member_id"`
	AltPayeeName     string     `json:"alternate_payee_name"`
	AltPayeeDOB      *time.Time `json:"alternate_payee_dob,omitempty"`
	AltPayeeRelation string     `json:"alternate_payee_relationship,omitempty"`
	MarriageDate     *time.Time `json:"marriage_date"`
	DivorceDate      *time.Time `json:"divorce_date"`
	DivisionMethod   string     `json:"division_method"`
	DivisionPct      *float64   `json:"division_percentage,omitempty"`
	DivisionAmt      *float64   `json:"division_amount,omitempty"`
	StatusCode       string     `json:"status_code"`
	MaritalService   *float64   `json:"marital_service_years,omitempty"`
	MaritalFraction  *float64   `json:"marital_fraction,omitempty"`
}

// BeneficiaryInfo for payment option calculations.
type BeneficiaryInfo struct {
	Name         string     `json:"name"`
	Relationship string     `json:"relationship"`
	DateOfBirth  *time.Time `json:"date_of_birth,omitempty"`
}

// --- Request types ---

// EligibilityRequest for POST /api/v1/eligibility/evaluate
type EligibilityRequest struct {
	MemberID       string `json:"member_id"`
	RetirementDate string `json:"retirement_date,omitempty"` // YYYY-MM-DD, defaults to today
}

// BenefitRequest for POST /api/v1/benefit/calculate
type BenefitRequest struct {
	MemberID       string `json:"member_id"`
	RetirementDate string `json:"retirement_date"` // YYYY-MM-DD
}

// PaymentOptionsRequest for POST /api/v1/benefit/options
type PaymentOptionsRequest struct {
	MemberID       string `json:"member_id"`
	RetirementDate string `json:"retirement_date"`
	BeneficiaryDOB string `json:"beneficiary_dob,omitempty"` // For J&S calculations
}

// ScenarioRequest for POST /api/v1/benefit/scenario
type ScenarioRequest struct {
	MemberID        string   `json:"member_id"`
	RetirementDates []string `json:"retirement_dates"` // Array of YYYY-MM-DD
}

// DRORequest for POST /api/v1/dro/calculate
type DRORequest struct {
	MemberID       string `json:"member_id"`
	RetirementDate string `json:"retirement_date"`
}

// --- Eligibility Response Types ---

// EligibilityCondition represents a single condition check within a pathway.
type EligibilityCondition struct {
	Name     string `json:"name"`
	Met      bool   `json:"met"`
	Required string `json:"required"`
	Actual   string `json:"actual"`
}

// EligibilityPath represents one evaluated eligibility pathway.
type EligibilityPath struct {
	PathType        string                 `json:"pathType"`
	DisplayName     string                 `json:"displayName"`
	Eligible        bool                   `json:"eligible"`
	ApplicableToTier bool                  `json:"applicableToTier"`
	Conditions      []EligibilityCondition `json:"conditions"`
	ReductionPct    float64                `json:"reductionPercent,omitempty"`
	ReductionFactor float64                `json:"reductionFactor,omitempty"`
}

// EligibilityResult contains the full eligibility evaluation.
type EligibilityResult struct {
	MemberID             string  `json:"memberId"`
	Tier                 int     `json:"tier"`
	EvaluationDate       string  `json:"evaluationDate"`
	AgeAtRetirement      float64 `json:"ageAtRetirement"`
	TotalServiceYears    float64 `json:"totalServiceYears"`
	EarnedServiceYears   float64 `json:"earnedServiceYears"`
	PurchasedServiceYears float64 `json:"purchasedServiceYears,omitempty"`

	ServiceAtDate struct {
		Earned string `json:"earned"`
		Total  string `json:"total"`
	} `json:"serviceAtDate"`

	Vested               bool    `json:"vested"`

	// Normal retirement
	NormalRetirementEligible bool `json:"normalRetirementEligible"`

	// Rule of 75/85
	RuleOfNApplicable    string  `json:"ruleOfNApplicable"` // "75" or "85"
	RuleOfNSum           float64 `json:"ruleOfNSum"`
	RuleOfNQualifies     bool    `json:"ruleOfNQualifies"`
	RuleOfNMinAgeMet     bool    `json:"ruleOfNMinAgeMet"`

	// Early retirement
	EarlyRetirementEligible     bool    `json:"earlyRetirementEligible"`
	EarlyRetirementReductionPct float64 `json:"earlyRetirementReductionPercent"`
	ReductionFactor             float64 `json:"reductionFactor"`
	YearsUnder65                int     `json:"yearsUnder65"`

	// Leave payout
	LeavePayoutEligible bool   `json:"leavePayoutEligible"`
	LeavePayoutNote     string `json:"leavePayoutNote,omitempty"`

	// Overall
	RetirementType string            `json:"retirementType"` // "normal", "rule_of_75", "rule_of_85", "early", "deferred"
	Paths          []EligibilityPath `json:"paths"`
	Trace          *CalculationTrace `json:"trace,omitempty"`
}

// --- Benefit Response Types ---

// BenefitResult contains the complete benefit calculation worksheet.
type BenefitResult struct {
	MemberID       string `json:"memberId"`
	RetirementDate string `json:"retirementDate"`
	Tier           int    `json:"tier"`
	RetirementType string `json:"retirementType"`

	// AMS
	AMS AMSResult `json:"amsCalculation"`

	// Benefit formula
	Multiplier             float64 `json:"multiplier"`
	ServiceYearsForBenefit float64 `json:"serviceYearsForBenefit"`
	Formula                string  `json:"formula"`
	UnreducedBenefit       float64 `json:"unreducedMonthlyBenefit"`

	// Reduction
	ReductionPercent float64 `json:"reductionPercent"`
	ReductionFactor  float64 `json:"reductionFactor"`
	ReducedBenefit   float64 `json:"reducedMonthlyBenefit"`

	// Final
	MaximumMonthlyBenefit float64 `json:"maximumMonthlyBenefit"`

	// IPR
	IPR *IPRResult `json:"ipr,omitempty"`

	// Death benefit
	DeathBenefit *DeathBenefitResult `json:"deathBenefit,omitempty"`

	// COLA eligibility
	COLA *COLAEligibility `json:"cola,omitempty"`

	// Calculation trace
	Trace *CalculationTrace `json:"trace,omitempty"`
}

// IPRResult contains the Insurance Premium Reimbursement calculation.
type IPRResult struct {
	ServiceYearsForIPR  float64 `json:"serviceYearsForIpr"`
	PreMedicareRate     float64 `json:"preMedicareRate"`
	PostMedicareRate    float64 `json:"postMedicareRate"`
	PreMedicareMonthly  float64 `json:"preMedicareMonthly"`
	PostMedicareMonthly float64 `json:"postMedicareMonthly"`
}

// DeathBenefitResult contains the death benefit calculation.
type DeathBenefitResult struct {
	RetirementType string  `json:"retirementType"`
	Tier           int     `json:"tier"`
	BaseAmount     float64 `json:"baseAmount"`
	Reduction      float64 `json:"reduction,omitempty"`
	LumpSumAmount  float64 `json:"lumpSumAmount"`
	Installment50  float64 `json:"installment50"`
	Installment100 float64 `json:"installment100"`
}

// PaymentOption represents a single payment option.
type PaymentOption struct {
	Name            string  `json:"name"`
	Factor          float64 `json:"factor"`
	MonthlyBenefit  float64 `json:"monthlyBenefit"`
	SurvivorBenefit float64 `json:"survivorBenefit,omitempty"`
}

// PaymentOptionsResult contains all payment options.
type PaymentOptionsResult struct {
	MemberID         string         `json:"memberId"`
	BaseBenefit      float64        `json:"baseBenefit"`
	Maximum          PaymentOption  `json:"maximum"`
	JointSurvivor100 *PaymentOption `json:"jointSurvivor100,omitempty"`
	JointSurvivor75  *PaymentOption `json:"jointSurvivor75,omitempty"`
	JointSurvivor50  *PaymentOption `json:"jointSurvivor50,omitempty"`
	SpousalConsent   *SpousalConsentInfo `json:"spousalConsent,omitempty"`
	Assumption       string         `json:"assumption,omitempty"` // Q-CALC-04 tag
}

// SpousalConsentInfo indicates whether spousal consent is required.
// Per RULE-SPOUSAL-CONSENT: required when married member elects Maximum (single life)
// or designates a non-spouse as beneficiary. Notarized consent form required.
type SpousalConsentInfo struct {
	Required bool   `json:"required"`
	Reason   string `json:"reason,omitempty"`
}

// COLAEligibility contains COLA (Cost of Living Adjustment) information.
// COLA is discretionary and board-approved — no automatic formula.
// First eligible: January 1 of second year after retirement.
type COLAEligibility struct {
	FirstEligibleDate string `json:"firstEligibleDate"` // YYYY-MM-DD
	Status            string `json:"status"`             // "pending_board_action"
	Note              string `json:"note"`
}

// ScenarioResult contains results for one scenario date.
type ScenarioResult struct {
	RetirementDate string            `json:"retirementDate"`
	IsEstimate     bool              `json:"isEstimate"` // True for future "what-if" scenarios
	Eligibility    EligibilityResult `json:"eligibility"`
	Benefit        *BenefitResult    `json:"benefit,omitempty"`
}

// ScenarioComparison contains comparison metrics between current and what-if scenarios.
type ScenarioComparison struct {
	CurrentBenefit   float64 `json:"currentMonthlyBenefit"`
	WhatIfBenefit    float64 `json:"whatIfMonthlyBenefit"`
	MonthlyDiff      float64 `json:"monthlyDifference"`
	PercentIncrease  float64 `json:"percentIncrease"`
	BreakevenMonths  int     `json:"breakevenMonths"`
	MonthsToWait     int     `json:"monthsToWait"`
	Note             string  `json:"note,omitempty"`
}

// ThresholdProximity identifies how close a member is to a key threshold.
type ThresholdProximity struct {
	ThresholdName   string  `json:"thresholdName"`   // "rule_of_75", "rule_of_85", "normal_retirement_age"
	CurrentValue    float64 `json:"currentValue"`
	ThresholdValue  float64 `json:"thresholdValue"`
	Gap             float64 `json:"gap"`              // Distance to threshold
	EstMonthsToMeet int     `json:"estimatedMonthsToMeet,omitempty"`
	Impact          string  `json:"impact,omitempty"` // What happens when threshold is met
}

// ScenarioResponse wraps the full scenario modeling output.
type ScenarioResponse struct {
	MemberID      string               `json:"memberId"`
	Current       *ScenarioResult      `json:"current"`
	Scenarios     []ScenarioResult     `json:"scenarios"`
	Comparisons   []ScenarioComparison `json:"comparisons,omitempty"`
	Thresholds    []ThresholdProximity  `json:"thresholdProximity,omitempty"`
	SalaryGrowth  float64              `json:"salaryGrowthAssumption"` // 0.03 = 3% per XS-29
}

// DROResult contains the DRO impact calculation.
type DROResult struct {
	MemberID               string  `json:"memberId"`
	TotalServiceYears      float64 `json:"totalServiceYears"`
	MarriageStart          string  `json:"marriageStart"`
	MarriageEnd            string  `json:"marriageEnd"`
	ServiceDuringMarriage  float64 `json:"serviceDuringMarriageYears"`
	MaritalFraction        float64 `json:"maritalFraction"`
	MaximumBenefit         float64 `json:"maximumBenefit"`
	MaritalShareOfBenefit  float64 `json:"maritalShareOfBenefit"`
	DROPercentage          float64 `json:"droPercentage"`
	AlternatePayeeShare    float64 `json:"alternatePayeeShare"`
	MemberRemainingBenefit float64 `json:"memberRemainingBenefit"`
	AltPayeeName           string  `json:"alternatePayeeName"`
}

// --- Calculation Trace Types ---

// CalculationTrace captures the full audit trail of a calculation.
// Core value proposition: shows DERP leadership that every calculation is traceable
// to the Revised Municipal Code.
type CalculationTrace struct {
	TraceID          string              `json:"traceId"`
	MemberID         string              `json:"memberId"`
	CalculationType  string              `json:"calculationType"` // "eligibility" or "benefit"
	EngineVersion    string              `json:"engineVersion"`
	Steps            []CalculationStep   `json:"steps"`
	FinalResult      map[string]string   `json:"finalResult"`
	Assumptions      []string            `json:"assumptions,omitempty"`
	DataQualityFlags []string            `json:"dataQualityFlags,omitempty"`
}

// CalculationStep represents one step in a calculation trace.
type CalculationStep struct {
	StepNumber         int               `json:"stepNumber"`
	RuleID             string            `json:"ruleId"`
	RuleName           string            `json:"ruleName"`
	SourceReference    string            `json:"sourceReference"`
	Description        string            `json:"description"`
	Formula            string            `json:"formula,omitempty"`
	Substitution       string            `json:"substitution,omitempty"`
	IntermediateValues map[string]string  `json:"intermediateValues,omitempty"`
	Result             string            `json:"result"`
	Notes              string            `json:"notes,omitempty"`
}
