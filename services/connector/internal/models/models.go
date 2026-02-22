// Package models defines the domain model types for the DERP connector service.
// These types map legacy database columns to clean domain objects.
package models

import (
	"time"
)

// Member represents a DERP plan member mapped from MEMBER_MASTER.
type Member struct {
	MemberID      string     `json:"member_id"`
	FirstName     string     `json:"first_name"`
	LastName      string     `json:"last_name"`
	MiddleName    string     `json:"middle_name,omitempty"`
	Suffix        string     `json:"suffix,omitempty"`
	DateOfBirth   *time.Time `json:"date_of_birth"`
	Gender        string     `json:"gender,omitempty"`
	HireDate      *time.Time `json:"hire_date"`
	TermDate      *time.Time `json:"termination_date,omitempty"`
	RehireDate    *time.Time `json:"rehire_date,omitempty"`
	OrigHireDate  *time.Time `json:"original_hire_date,omitempty"`
	Tier          int        `json:"tier"`
	StatusCode    string     `json:"status_code"`
	Department    string     `json:"department,omitempty"`
	Position      string     `json:"position,omitempty"`
	AnnualSalary  float64    `json:"annual_salary,omitempty"`
	MaritalStatus string     `json:"marital_status,omitempty"`
}

// EmploymentEvent represents a single employment history event from EMPLOYMENT_HIST.
type EmploymentEvent struct {
	MemberID   string     `json:"member_id"`
	EventType  string     `json:"event_type"`
	EventDate  time.Time  `json:"event_date"`
	FromDept   string     `json:"from_department,omitempty"`
	ToDept     string     `json:"to_department,omitempty"`
	FromPos    string     `json:"from_position,omitempty"`
	ToPos      string     `json:"to_position,omitempty"`
	FromSalary *float64   `json:"from_salary,omitempty"`
	ToSalary   *float64   `json:"to_salary,omitempty"`
	SepReason  string     `json:"separation_reason,omitempty"`
	Notes      string     `json:"notes,omitempty"`
}

// SalaryRecord represents a single pay period record from SALARY_HIST.
type SalaryRecord struct {
	MemberID       string     `json:"member_id"`
	PayPeriodEnd   time.Time  `json:"pay_period_end"`
	PayPeriodNum   *int       `json:"pay_period_number,omitempty"`
	BasePay        float64    `json:"base_pay"`
	OvertimePay    float64    `json:"overtime_pay"`
	PensionablePay float64    `json:"pensionable_pay"`
	SupplPay       float64    `json:"supplemental_pay"`
	LeavePayoutAmt *float64   `json:"leave_payout_amount,omitempty"`
	LeavePayoutTyp string     `json:"leave_payout_type,omitempty"`
	FurloughHrs    *float64   `json:"furlough_hours,omitempty"`
	FurloughDeduct *float64   `json:"furlough_deduction,omitempty"`
	AnnualSalary   *float64   `json:"annual_salary,omitempty"`
	ProcessDate    *time.Time `json:"process_date,omitempty"`
}

// MonthlySalary represents aggregated monthly salary (from biweekly records).
type MonthlySalary struct {
	Year           int     `json:"year"`
	Month          int     `json:"month"`
	PensionablePay float64 `json:"pensionable_pay"`
	LeavePayoutAmt float64 `json:"leave_payout_amount"`
	TotalPay       float64 `json:"total_pay"`
	RecordCount    int     `json:"record_count"`
}

// AMSCalculation represents the result of an AMS computation.
type AMSCalculation struct {
	WindowMonths      int              `json:"window_months"`
	WindowStart       string           `json:"window_start"`
	WindowEnd         string           `json:"window_end"`
	BaseCompensation  float64          `json:"base_compensation"`
	LeavePayoutAdded  float64          `json:"leave_payout_added"`
	TotalCompensation float64          `json:"total_compensation"`
	AMS               float64          `json:"ams"`
	MonthlyDetail     []MonthlySalary  `json:"monthly_detail,omitempty"`
}

// ServiceCredit represents a service credit record from SVC_CREDIT.
type ServiceCredit struct {
	MemberID       string     `json:"member_id"`
	ServiceType    string     `json:"service_type"`
	StartDate      *time.Time `json:"start_date,omitempty"`
	EndDate        *time.Time `json:"end_date,omitempty"`
	YearsCredit    float64    `json:"years_credit"`
	MonthsCredit   int        `json:"months_credit"`
	PurchaseCost   *float64   `json:"purchase_cost,omitempty"`
	PurchaseDate   *time.Time `json:"purchase_date,omitempty"`
	PurchaseStatus string     `json:"purchase_status,omitempty"`
	PurchaseType   string     `json:"purchase_type,omitempty"`
	InclBenefit    bool       `json:"include_in_benefit"`
	InclElig       bool       `json:"include_in_eligibility"`
	InclIPR        bool       `json:"include_in_ipr"`
}

// ServiceCreditSummary provides the separated service totals needed by the rules engine.
type ServiceCreditSummary struct {
	EarnedYears       float64 `json:"earned_years"`
	PurchasedYears    float64 `json:"purchased_years"`
	MilitaryYears     float64 `json:"military_years"`
	LeaveYears        float64 `json:"leave_years"`
	TotalForBenefit   float64 `json:"total_for_benefit"`
	TotalForElig      float64 `json:"total_for_eligibility"`
	TotalForIPR       float64 `json:"total_for_ipr"`
}

// Beneficiary represents a beneficiary record from BENEFICIARY.
type Beneficiary struct {
	BeneficiaryID  int        `json:"beneficiary_id"`
	MemberID       string     `json:"member_id"`
	FirstName      string     `json:"first_name,omitempty"`
	LastName       string     `json:"last_name,omitempty"`
	DateOfBirth    *time.Time `json:"date_of_birth,omitempty"`
	Relationship   string     `json:"relationship"`
	AllocationPct  float64    `json:"allocation_percentage"`
	BeneficiaryTyp string     `json:"beneficiary_type"`
	EffectiveDate  *time.Time `json:"effective_date,omitempty"`
	StatusCode     string     `json:"status_code"`
	SpouseConsent  string     `json:"spouse_consent,omitempty"`
	ConsentDate    *time.Time `json:"consent_date,omitempty"`
}

// DRO represents a Domestic Relations Order from DRO_MASTER.
type DRO struct {
	DROID            int        `json:"dro_id"`
	MemberID         string     `json:"member_id"`
	CourtOrderDate   *time.Time `json:"court_order_date,omitempty"`
	CourtName        string     `json:"court_name,omitempty"`
	CaseNumber       string     `json:"case_number,omitempty"`
	AltPayeeName     string     `json:"alternate_payee_name"`
	AltPayeeDOB      *time.Time `json:"alternate_payee_dob,omitempty"`
	AltPayeeRelation string     `json:"alternate_payee_relationship,omitempty"`
	MarriageDate     *time.Time `json:"marriage_date"`
	DivorceDate      *time.Time `json:"divorce_date"`
	DivisionMethod   string     `json:"division_method"`
	DivisionPct      *float64   `json:"division_percentage,omitempty"`
	DivisionAmt      *float64   `json:"division_amount,omitempty"`
	DivisionDesc     string     `json:"division_description,omitempty"`
	StatusCode       string     `json:"status_code"`
	ApprovedDate     *time.Time `json:"approved_date,omitempty"`
	MaritalService   *float64   `json:"marital_service_years,omitempty"`
	MaritalFraction  *float64   `json:"marital_fraction,omitempty"`
}

// ContributionRecord represents a contribution from CONTRIBUTION_HIST.
type ContributionRecord struct {
	MemberID     string     `json:"member_id"`
	ContribDate  time.Time  `json:"contribution_date"`
	EmplContrib  float64    `json:"employee_contribution"`
	EmprContrib  float64    `json:"employer_contribution"`
	PensSalary   float64    `json:"pensionable_salary"`
	EmplBalance  float64    `json:"employee_balance"`
	EmprBalance  float64    `json:"employer_balance"`
	InterestBal  float64    `json:"interest_balance"`
	FiscalYear   int        `json:"fiscal_year"`
	Quarter      int        `json:"quarter"`
}

// RetirementElection represents a retirement application submission.
type RetirementElection struct {
	MemberID        string  `json:"member_id"`
	RetirementDate  string  `json:"retirement_date"`
	PaymentOption   string  `json:"payment_option"`
	MonthlyBenefit  float64 `json:"monthly_benefit"`
	GrossBenefit    float64 `json:"gross_benefit"`
	ReductionFactor float64 `json:"reduction_factor"`
	DRODeduction    float64 `json:"dro_deduction,omitempty"`
	IPRAmount       float64 `json:"ipr_amount,omitempty"`
	DeathBenefit    float64 `json:"death_benefit_amount,omitempty"`
}

// RetirementElectionResult is the response after saving.
type RetirementElectionResult struct {
	MemberID       string `json:"member_id"`
	CaseID         int    `json:"case_id"`
	Status         string `json:"status"`
	Message        string `json:"message"`
	RetirementDate string `json:"retirement_date"`
	PaymentOption  string `json:"payment_option"`
}

// ContributionSummary provides aggregate contribution information.
type ContributionSummary struct {
	TotalEmplContrib float64 `json:"total_employee_contributions"`
	TotalEmprContrib float64 `json:"total_employer_contributions"`
	CurrentEmplBal   float64 `json:"current_employee_balance"`
	CurrentEmprBal   float64 `json:"current_employer_balance"`
	InterestBalance  float64 `json:"interest_balance"`
	RecordCount      int     `json:"record_count"`
}
