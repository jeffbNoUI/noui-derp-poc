// Package models defines the request/response types for the intelligence service.
package models

import "time"

// MemberData represents member data fetched from the connector service.
type MemberData struct {
	MemberID      string     `json:"member_id"`
	FirstName     string     `json:"first_name"`
	LastName      string     `json:"last_name"`
	DateOfBirth   *time.Time `json:"date_of_birth"`
	HireDate      *time.Time `json:"hire_date"`
	TermDate      *time.Time `json:"termination_date,omitempty"`
	Tier          int        `json:"tier"`
	StatusCode    string     `json:"status_code"`
	Department    string     `json:"department,omitempty"`
	Position      string     `json:"position,omitempty"`
	AnnualSalary  float64    `json:"annual_salary,omitempty"`
	MaritalStatus string     `json:"marital_status,omitempty"`
}

// ServiceCreditSummary from the connector service.
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
type AMSResult struct {
	WindowMonths      int     `json:"window_months"`
	WindowStart       string  `json:"window_start"`
	WindowEnd         string  `json:"window_end"`
	BaseCompensation  float64 `json:"base_compensation"`
	LeavePayoutAdded  float64 `json:"leave_payout_added"`
	TotalCompensation float64 `json:"total_compensation"`
	AMS               float64 `json:"ams"`
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

// --- Response types ---

// EligibilityResult contains the full eligibility evaluation.
type EligibilityResult struct {
	MemberID             string  `json:"member_id"`
	Tier                 int     `json:"tier"`
	AgeAtRetirement      float64 `json:"age_at_retirement"`
	TotalServiceYears    float64 `json:"total_service_years"`
	EarnedServiceYears   float64 `json:"earned_service_years"`
	PurchasedServiceYears float64 `json:"purchased_service_years,omitempty"`
	Vested               bool    `json:"vested"`

	// Normal retirement
	NormalRetirementEligible bool `json:"normal_retirement_eligible"`

	// Rule of 75/85
	RuleOfNApplicable    string  `json:"rule_of_n_applicable"` // "75" or "85"
	RuleOfNSum           float64 `json:"rule_of_n_sum"`
	RuleOfNQualifies     bool    `json:"rule_of_n_qualifies"`
	RuleOfNMinAgeMet     bool    `json:"rule_of_n_min_age_met"`

	// Early retirement
	EarlyRetirementEligible   bool    `json:"early_retirement_eligible"`
	EarlyRetirementReductionPct float64 `json:"early_retirement_reduction_percent"`
	ReductionFactor            float64 `json:"reduction_factor"`
	YearsUnder65               int     `json:"years_under_65"`

	// Leave payout
	LeavePayoutEligible bool   `json:"leave_payout_eligible"`
	LeavePayoutNote     string `json:"leave_payout_note,omitempty"`

	// Overall
	RetirementType string `json:"retirement_type"` // "normal", "rule_of_75", "rule_of_85", "early", "deferred"
}

// BenefitResult contains the complete benefit calculation worksheet.
type BenefitResult struct {
	MemberID       string  `json:"member_id"`
	RetirementDate string  `json:"retirement_date"`
	Tier           int     `json:"tier"`
	RetirementType string  `json:"retirement_type"`

	// AMS
	AMS            AMSResult `json:"ams_calculation"`

	// Benefit formula
	Multiplier            float64 `json:"multiplier"`
	ServiceYearsForBenefit float64 `json:"service_years_for_benefit"`
	Formula               string  `json:"formula"`
	UnreducedBenefit      float64 `json:"unreduced_monthly_benefit"`

	// Reduction
	ReductionPercent float64 `json:"reduction_percent"`
	ReductionFactor  float64 `json:"reduction_factor"`
	ReducedBenefit   float64 `json:"reduced_monthly_benefit"`

	// Final
	MaximumMonthlyBenefit float64 `json:"maximum_monthly_benefit"`

	// IPR
	IPR *IPRResult `json:"ipr,omitempty"`

	// Death benefit
	DeathBenefit *DeathBenefitResult `json:"death_benefit,omitempty"`
}

// IPRResult contains the Insurance Premium Reimbursement calculation.
type IPRResult struct {
	ServiceYearsForIPR float64 `json:"service_years_for_ipr"`
	PreMedicareRate    float64 `json:"pre_medicare_rate"`
	PostMedicareRate   float64 `json:"post_medicare_rate"`
	PreMedicareMonthly float64 `json:"pre_medicare_monthly"`
	PostMedicareMonthly float64 `json:"post_medicare_monthly"`
}

// DeathBenefitResult contains the death benefit calculation.
type DeathBenefitResult struct {
	RetirementType string  `json:"retirement_type"`
	Tier           int     `json:"tier"`
	BaseAmount     float64 `json:"base_amount"`
	Reduction      float64 `json:"reduction,omitempty"`
	LumpSumAmount  float64 `json:"lump_sum_amount"`
	Installment50  float64 `json:"installment_50"`
	Installment100 float64 `json:"installment_100"`
}

// PaymentOption represents a single payment option.
type PaymentOption struct {
	Name           string  `json:"name"`
	Factor         float64 `json:"factor"`
	MonthlyBenefit float64 `json:"monthly_benefit"`
	SurvivorBenefit float64 `json:"survivor_benefit,omitempty"`
}

// PaymentOptionsResult contains all payment options.
type PaymentOptionsResult struct {
	MemberID        string         `json:"member_id"`
	BaseBenefit     float64        `json:"base_benefit"`
	Maximum         PaymentOption  `json:"maximum"`
	JointSurvivor100 *PaymentOption `json:"joint_survivor_100,omitempty"`
	JointSurvivor75  *PaymentOption `json:"joint_survivor_75,omitempty"`
	JointSurvivor50  *PaymentOption `json:"joint_survivor_50,omitempty"`
}

// ScenarioResult contains results for one scenario date.
type ScenarioResult struct {
	RetirementDate  string           `json:"retirement_date"`
	Eligibility     EligibilityResult `json:"eligibility"`
	Benefit         *BenefitResult    `json:"benefit,omitempty"`
}

// DROResult contains the DRO impact calculation.
type DROResult struct {
	MemberID               string  `json:"member_id"`
	TotalServiceYears      float64 `json:"total_service_years"`
	MarriageStart          string  `json:"marriage_start"`
	MarriageEnd            string  `json:"marriage_end"`
	ServiceDuringMarriage  float64 `json:"service_during_marriage_years"`
	MaritalFraction        float64 `json:"marital_fraction"`
	MaximumBenefit         float64 `json:"maximum_benefit"`
	MaritalShareOfBenefit  float64 `json:"marital_share_of_benefit"`
	DROPercentage          float64 `json:"dro_percentage"`
	AlternatePayeeShare    float64 `json:"alternate_payee_share"`
	MemberRemainingBenefit float64 `json:"member_remaining_benefit"`
	AltPayeeName           string  `json:"alternate_payee_name"`
}
