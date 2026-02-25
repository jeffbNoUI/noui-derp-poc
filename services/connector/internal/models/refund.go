// Package models — refund domain types for the DERP connector service.
// Maps REFUND_APPLICATION, CONTRIBUTION_LEDGER, and INTEREST_CREDIT legacy tables
// to clean domain objects.
//
// Consumed by: connector/internal/api/refund_handlers.go, connector/internal/db/refund_queries.go
// Depends on: database/schema/003_refund_schema.sql
package models

import "time"

// RefundApplication represents a contribution refund application from REFUND_APPLICATION.
type RefundApplication struct {
	RefundID       int        `json:"refund_id"`
	MemberID       string     `json:"member_id"`
	ApplicationDt  time.Time  `json:"application_date"`
	TerminationDt  *time.Time `json:"termination_date,omitempty"`
	WaitExpireDt   *time.Time `json:"wait_expiration_date,omitempty"`
	StatusCode     string     `json:"status_code"`
	DenyReason     string     `json:"deny_reason,omitempty"`

	// Calculation results
	TotalContrib  float64 `json:"total_contributions"`
	TotalInterest float64 `json:"total_interest"`
	GrossRefund   float64 `json:"gross_refund"`
	TaxWithhold   float64 `json:"tax_withholding"`
	NetRefund     float64 `json:"net_refund"`

	// Election
	ElectionType  string  `json:"election_type,omitempty"`
	RolloverAmt   float64 `json:"rollover_amount,omitempty"`
	RolloverInst  string  `json:"rollover_institution,omitempty"`

	// Vesting / forfeiture
	Vested         bool    `json:"vested"`
	ServiceYears   float64 `json:"service_years"`
	ForfeitureReq  bool    `json:"forfeiture_required"`
	ForfeitureAckDt *time.Time `json:"forfeiture_acknowledged,omitempty"`

	// Processing
	CalcDate    *time.Time `json:"calculation_date,omitempty"`
	ApprovedDt  *time.Time `json:"approved_date,omitempty"`
	PaidDt      *time.Time `json:"paid_date,omitempty"`
	Notes       string     `json:"notes,omitempty"`
}

// ContributionLedgerEntry represents a monthly contribution record from CONTRIBUTION_LEDGER.
type ContributionLedgerEntry struct {
	LedgerID     int       `json:"ledger_id"`
	MemberID     string    `json:"member_id"`
	LedgerMonth  time.Time `json:"ledger_month"`
	PensSalary   float64   `json:"pensionable_salary"`
	EmplContrib  float64   `json:"employee_contribution"`
	EmprContrib  float64   `json:"employer_contribution"`
	RunningBal   float64   `json:"running_balance"`
	FiscalYear   int       `json:"fiscal_year"`
}

// InterestCredit represents an annual interest compounding record from INTEREST_CREDIT.
type InterestCredit struct {
	CreditID    int       `json:"credit_id"`
	MemberID    string    `json:"member_id"`
	CreditDate  time.Time `json:"credit_date"`
	BalBefore   float64   `json:"balance_before"`
	InterestRate float64  `json:"interest_rate"`
	InterestAmt float64   `json:"interest_amount"`
	BalAfter    float64   `json:"balance_after"`
	FiscalYear  int       `json:"fiscal_year"`
}
