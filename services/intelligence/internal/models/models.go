// Package models defines the request/response types for the intelligence service.
// Consumed by: handlers, eligibility evaluator, benefit calculator, connector client
// Depends on: nothing (leaf package)
//
// COPERA adaptation: Tier replaced by HASTable + Division. Anti-spiking results added.
// Annual increase replaces discretionary COLA. PERACare replaces IPR.
package models

import "time"

// MemberData represents member data fetched from the connector service.
type MemberData struct {
	MemberID      string     `json:"memberId"`
	FirstName     string     `json:"firstName"`
	LastName      string     `json:"lastName"`
	DateOfBirth   *time.Time `json:"-"`
	HireDate      *time.Time `json:"-"`
	TermDate      *time.Time `json:"-"`
	Division      string     `json:"division"`           // State, School, LocalGov, Judicial, DPS
	HASTable      int        `json:"hasTable"`            // 1-9 (PERA), 10-13 (DPS)
	Status        string     `json:"status"`
	Department    string     `json:"department,omitempty"`
	Position      string     `json:"position,omitempty"`
	AnnualSalary  string     `json:"annualSalary,omitempty"`
	MaritalStatus string     `json:"maritalStatus,omitempty"`

	// Raw string dates from connector JSON (populated during unmarshal)
	RawDOB      string `json:"dateOfBirth"`
	RawHireDate string `json:"hireDate"`
	RawTermDate string `json:"terminationDate"`
}

// ParseDates converts the raw string date fields to time.Time pointers.
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
type ServiceCreditSummary struct {
	EarnedYears     float64 `json:"earned_years"`
	PurchasedYears  float64 `json:"purchased_years"`
	MilitaryYears   float64 `json:"military_years"`
	TotalForBenefit float64 `json:"total_for_benefit"`
	TotalForElig    float64 `json:"total_for_eligibility"`
}

// AMSResult from the connector service salary endpoint.
type AMSResult struct {
	Amount            string `json:"amount"`
	WindowMonths      int    `json:"windowMonths"`
	WindowStart       string `json:"windowStart"`
	WindowEnd         string `json:"windowEnd"`
	TotalCompensation string `json:"totalCompensationInWindow"`

	// Anti-spiking results
	AntiSpikingApplied bool              `json:"antiSpikingApplied"`
	AntiSpikingDetail  []AntiSpikingYear `json:"antiSpikingDetail,omitempty"`

	// Parsed AMS as float64 for calculations
	AMS float64 `json:"-"`
}

// AntiSpikingYear captures the anti-spiking check for one year in the HAS window.
type AntiSpikingYear struct {
	Year       int     `json:"year"`
	ActualPay  float64 `json:"actualPay"`
	CapAmount  float64 `json:"capAmount"`  // 108% of prior year (or prior capped amount)
	UsedPay    float64 `json:"usedPay"`    // min(actual, cap)
	CapApplied bool    `json:"capApplied"` // true if actual > cap
}

// DRORecord from the connector service.
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
	RetirementDate string `json:"retirement_date,omitempty"`
}

// BenefitRequest for POST /api/v1/benefit/calculate
type BenefitRequest struct {
	MemberID       string `json:"member_id"`
	RetirementDate string `json:"retirement_date"`
}

// PaymentOptionsRequest for POST /api/v1/benefit/options
type PaymentOptionsRequest struct {
	MemberID       string `json:"member_id"`
	RetirementDate string `json:"retirement_date"`
	BeneficiaryDOB string `json:"beneficiary_dob,omitempty"`
}

// ScenarioRequest for POST /api/v1/benefit/scenario
type ScenarioRequest struct {
	MemberID        string   `json:"member_id"`
	RetirementDates []string `json:"retirement_dates"`
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
	PathType         string                 `json:"pathType"`
	DisplayName      string                 `json:"displayName"`
	Eligible         bool                   `json:"eligible"`
	ApplicableToTable bool                  `json:"applicableToTable"`
	Conditions       []EligibilityCondition `json:"conditions"`
	ReductionPct     float64                `json:"reductionPercent,omitempty"`
	ReductionFactor  float64                `json:"reductionFactor,omitempty"`
}

// EligibilityResult contains the full eligibility evaluation.
type EligibilityResult struct {
	MemberID              string  `json:"memberId"`
	Division              string  `json:"division"`
	HASTable              int     `json:"hasTable"`
	HASTableName          string  `json:"hasTableName"`
	EvaluationDate        string  `json:"evaluationDate"`
	AgeAtRetirement       float64 `json:"ageAtRetirement"`
	TotalServiceYears     float64 `json:"totalServiceYears"`
	EarnedServiceYears    float64 `json:"earnedServiceYears"`
	PurchasedServiceYears float64 `json:"purchasedServiceYears,omitempty"`

	ServiceAtDate struct {
		Earned string `json:"earned"`
		Total  string `json:"total"`
	} `json:"serviceAtDate"`

	Vested bool `json:"vested"`

	// Normal retirement
	NormalRetirementEligible bool `json:"normalRetirementEligible"`

	// Rule of N (80/85/88/90 depending on HAS table)
	RuleOfNApplicable string  `json:"ruleOfNApplicable"` // "80", "85", "88", "90"
	RuleOfNSum        float64 `json:"ruleOfNSum"`
	RuleOfNQualifies  bool    `json:"ruleOfNQualifies"`
	RuleOfNMinAgeMet  bool    `json:"ruleOfNMinAgeMet"`

	// Early retirement
	EarlyRetirementEligible     bool    `json:"earlyRetirementEligible"`
	EarlyRetirementReductionPct float64 `json:"earlyRetirementReductionPercent"`
	ReductionFactor             float64 `json:"reductionFactor"`
	YearsUnder65                int     `json:"yearsUnder65"`

	// Overall
	RetirementType string            `json:"retirementType"` // "normal", "rule_of_80", "rule_of_85", "rule_of_90", "early", "deferred"
	Paths          []EligibilityPath `json:"paths"`
	Trace          *CalculationTrace `json:"trace,omitempty"`
}

// --- Benefit Response Types ---

// BenefitResult contains the complete benefit calculation worksheet.
type BenefitResult struct {
	MemberID       string `json:"memberId"`
	RetirementDate string `json:"retirementDate"`
	Division       string `json:"division"`
	HASTable       int    `json:"hasTable"`
	HASTableName   string `json:"hasTableName"`
	RetirementType string `json:"retirementType"`

	// AMS/HAS
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

	// Annual increase (replaces DERP's discretionary COLA)
	AnnualIncrease *AnnualIncreaseInfo `json:"annualIncrease,omitempty"`

	// Death benefit
	DeathBenefit *DeathBenefitResult `json:"deathBenefit,omitempty"`

	// Calculation trace
	Trace *CalculationTrace `json:"trace,omitempty"`
}

// AnnualIncreaseInfo contains the annual increase (COLA equivalent) details.
// COPERA uses compound annual increase, not discretionary board-approved COLA.
// Source: C.R.S. §24-51-1002 (as amended by SB 18-200)
type AnnualIncreaseInfo struct {
	Rate              float64 `json:"rate"`              // 0.015 (1.5%) or 0.010 (1.0%)
	FirstEligibleDate string  `json:"firstEligibleDate"` // March 1 of second year after retirement
	CompoundMethod    string  `json:"compoundMethod"`    // "compound"
	Note              string  `json:"note"`
}

// DeathBenefitResult contains statutory survivor benefit information.
type DeathBenefitResult struct {
	RetirementType string  `json:"retirementType"`
	HASTable       int     `json:"hasTable"`
	Description    string  `json:"description"`
	LumpSumAmount  float64 `json:"lumpSumAmount,omitempty"`
}

// PaymentOption represents a single payment option.
type PaymentOption struct {
	Name            string  `json:"name"`
	DisplayName     string  `json:"displayName,omitempty"`
	Factor          float64 `json:"factor"`
	MonthlyBenefit  float64 `json:"monthlyBenefit"`
	SurvivorBenefit float64 `json:"survivorBenefit,omitempty"`
	PopUpFeature    bool    `json:"popUpFeature,omitempty"` // DPS Pop-Up options
}

// PaymentOptionsResult contains all payment options.
type PaymentOptionsResult struct {
	MemberID       string          `json:"memberId"`
	Division       string          `json:"division"`
	BaseBenefit    float64         `json:"baseBenefit"`
	Options        []PaymentOption `json:"options"`
	SpousalConsent *SpousalConsentInfo `json:"spousalConsent,omitempty"`
	Assumption     string          `json:"assumption,omitempty"`
}

// SpousalConsentInfo indicates whether spousal consent is required.
type SpousalConsentInfo struct {
	Required bool   `json:"required"`
	Reason   string `json:"reason,omitempty"`
}

// ScenarioResult contains results for one scenario date.
type ScenarioResult struct {
	RetirementDate string            `json:"retirementDate"`
	IsEstimate     bool              `json:"isEstimate"`
	Eligibility    EligibilityResult `json:"eligibility"`
	Benefit        *BenefitResult    `json:"benefit,omitempty"`
}

// ScenarioComparison contains comparison metrics between scenarios.
type ScenarioComparison struct {
	CurrentBenefit  float64 `json:"currentMonthlyBenefit"`
	WhatIfBenefit   float64 `json:"whatIfMonthlyBenefit"`
	MonthlyDiff     float64 `json:"monthlyDifference"`
	PercentIncrease float64 `json:"percentIncrease"`
	BreakevenMonths int     `json:"breakevenMonths"`
	MonthsToWait    int     `json:"monthsToWait"`
	Note            string  `json:"note,omitempty"`
}

// ThresholdProximity identifies how close a member is to a key threshold.
type ThresholdProximity struct {
	ThresholdName   string  `json:"thresholdName"`
	CurrentValue    float64 `json:"currentValue"`
	ThresholdValue  float64 `json:"thresholdValue"`
	Gap             float64 `json:"gap"`
	EstMonthsToMeet int     `json:"estimatedMonthsToMeet,omitempty"`
	Impact          string  `json:"impact,omitempty"`
}

// ScenarioResponse wraps the full scenario modeling output.
type ScenarioResponse struct {
	MemberID     string               `json:"memberId"`
	Current      *ScenarioResult      `json:"current"`
	Scenarios    []ScenarioResult     `json:"scenarios"`
	Comparisons  []ScenarioComparison `json:"comparisons,omitempty"`
	Thresholds   []ThresholdProximity `json:"thresholdProximity,omitempty"`
	SalaryGrowth float64              `json:"salaryGrowthAssumption"`
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
type CalculationTrace struct {
	TraceID          string            `json:"traceId"`
	MemberID         string            `json:"memberId"`
	CalculationType  string            `json:"calculationType"`
	EngineVersion    string            `json:"engineVersion"`
	Steps            []CalculationStep `json:"steps"`
	FinalResult      map[string]string `json:"finalResult"`
	Assumptions      []string          `json:"assumptions,omitempty"`
	DataQualityFlags []string          `json:"dataQualityFlags,omitempty"`
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
