// Package models — death and survivor benefit domain types.
// Maps DEATH_RECORD, SURVIVOR_CLAIM, DEATH_BENEFIT_ELECTION, and OVERPAYMENT_RECORD
// from 004_death_survivor_schema.sql to clean Go structs.
//
// Consumed by: death_queries.go (DB access), death_handlers.go (API layer)
// Depends on: 004_death_survivor_schema.sql table definitions
package models

import "time"

// DeathRecord represents a member death processing record from DEATH_RECORD.
// Created upon credible notification of a member's death. Tracks the entire
// death processing workflow from notification through final status transition.
type DeathRecord struct {
	DeathRecordID   int        `json:"death_record_id"`
	MemberID        string     `json:"member_id"`
	DeathDate       *time.Time `json:"death_date,omitempty"`
	NotifyDate      time.Time  `json:"notification_date"`
	NotifySource    string     `json:"notification_source,omitempty"`
	NotifyContact   string     `json:"notification_contact,omitempty"`
	NotifyPhone     string     `json:"notification_phone,omitempty"`
	CertReceivedDate *time.Time `json:"certificate_received_date,omitempty"`
	CertVerifyDate  *time.Time `json:"certificate_verified_date,omitempty"`
	CertVerifyBy    string     `json:"certificate_verified_by,omitempty"`
	CertDocRef      string     `json:"certificate_document_ref,omitempty"`
	PreviousStatus  string     `json:"previous_member_status,omitempty"`
	CurrentStatus   string     `json:"current_member_status,omitempty"`
	StatusCode      string     `json:"status"`
	SuspendDate     *time.Time `json:"suspend_date,omitempty"`
	FinalPayDate    *time.Time `json:"final_payment_date,omitempty"`
	OverpayFlag     string     `json:"overpayment_detected"`
	OverpayAmount   float64    `json:"overpayment_amount,omitempty"`
	Notes           string     `json:"notes,omitempty"`
}

// SurvivorClaim represents a survivor benefit claim from SURVIVOR_CLAIM.
// Created when a designated survivor or beneficiary files for benefits
// following a member's death.
type SurvivorClaim struct {
	ClaimID         int        `json:"claim_id"`
	DeathRecordID   int        `json:"death_record_id"`
	MemberID        string     `json:"member_id"`
	SurvivorFirst   string     `json:"survivor_first_name,omitempty"`
	SurvivorLast    string     `json:"survivor_last_name,omitempty"`
	SurvivorDOB     *time.Time `json:"survivor_date_of_birth,omitempty"`
	SurvivorRelation string    `json:"survivor_relationship,omitempty"`
	ClaimType       string     `json:"claim_type"`
	JSPercentage    *float64   `json:"js_percentage,omitempty"`
	MonthlyAmount   float64    `json:"monthly_amount,omitempty"`
	LumpSumAmount   float64    `json:"lump_sum_amount,omitempty"`
	EffectiveDate   *time.Time `json:"effective_date,omitempty"`
	FirstPayDate    *time.Time `json:"first_payment_date,omitempty"`
	StatusCode      string     `json:"status"`
	ApprovedDate    *time.Time `json:"approved_date,omitempty"`
	ApprovedBy      string     `json:"approved_by,omitempty"`
	DenyReason      string     `json:"deny_reason,omitempty"`
	Notes           string     `json:"notes,omitempty"`
}

// DeathBenefitElection represents the death benefit installment election
// from DEATH_BENEFIT_ELECTION. Elected at retirement (50 or 100 installments).
// After member death, remaining installments transfer to the designated beneficiary.
type DeathBenefitElection struct {
	ElectionID        int        `json:"election_id"`
	MemberID          string     `json:"member_id"`
	LumpSumAmount     float64    `json:"lump_sum_amount"`
	NumInstallments   int        `json:"num_installments"`
	InstallmentAmount float64    `json:"installment_amount"`
	EffectiveDate     time.Time  `json:"effective_date"`
	InstallmentsPaid  int        `json:"installments_paid"`
	RemainingAmount   float64    `json:"remaining_amount"`
	BeneficiaryFirst  string     `json:"beneficiary_first_name,omitempty"`
	BeneficiaryLast   string     `json:"beneficiary_last_name,omitempty"`
	BeneficiaryRelation string   `json:"beneficiary_relationship,omitempty"`
	TransferDate      *time.Time `json:"transfer_date,omitempty"`
	StatusCode        string     `json:"status"`
}

// OverpaymentRecord represents a post-death overpayment from OVERPAYMENT_RECORD.
// Each record tracks a single overpaid payment and its recovery status.
type OverpaymentRecord struct {
	OverpaymentID   int        `json:"overpayment_id"`
	DeathRecordID   int        `json:"death_record_id"`
	MemberID        string     `json:"member_id"`
	PaymentDate     time.Time  `json:"payment_date"`
	PaymentAmount   float64    `json:"payment_amount"`
	RecoveryStatus  string     `json:"recovery_status"`
	RecoveryAmount  float64    `json:"recovery_amount"`
	RecoveryDate    *time.Time `json:"recovery_date,omitempty"`
	RecoverySource  string     `json:"recovery_source,omitempty"`
	Notes           string     `json:"notes,omitempty"`
}

// DeathNotificationRequest is the input for POST /api/v1/members/{id}/death/notify.
type DeathNotificationRequest struct {
	MemberID       string `json:"member_id"`
	DeathDate      string `json:"death_date,omitempty"`
	NotifySource   string `json:"notification_source"`
	NotifyContact  string `json:"notification_contact,omitempty"`
	NotifyPhone    string `json:"notification_phone,omitempty"`
	Notes          string `json:"notes,omitempty"`
}

// SurvivorClaimRequest is the input for POST /api/v1/members/{id}/survivor-claims.
type SurvivorClaimRequest struct {
	MemberID         string  `json:"member_id"`
	SurvivorFirst    string  `json:"survivor_first_name"`
	SurvivorLast     string  `json:"survivor_last_name"`
	SurvivorDOB      string  `json:"survivor_date_of_birth,omitempty"`
	SurvivorRelation string  `json:"survivor_relationship"`
	ClaimType        string  `json:"claim_type"`
	JSPercentage     float64 `json:"js_percentage,omitempty"`
}
