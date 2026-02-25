// Package models — vendor domain types for the DERP connector service.
// Maps legacy database tables (MEMBER_MASTER, BENEFIT_PAYMENT) to vendor-facing
// enrollment and statistics objects.
// Consumed by: vendor_handlers.go (connector API), intelligence connector client
// Depends on: legacy DB schema (MEMBER_MASTER, BENEFIT_PAYMENT, CASE_HIST)
package models

// EnrollmentQueueItem represents a recently retired member pending vendor enrollment.
// Derived from MEMBER_MASTER joined with BENEFIT_PAYMENT and CASE_HIST.
type EnrollmentQueueItem struct {
	MemberID       string  `json:"member_id"`
	MemberName     string  `json:"member_name"`
	Tier           int     `json:"tier"`
	RetirementDate string  `json:"retirement_date"`
	EnrollmentType string  `json:"enrollment_type"`
	Status         string  `json:"status"`
	IPREligible    bool    `json:"ipr_eligible"`
	IPRMonthly     float64 `json:"ipr_monthly,omitempty"`
	AssignedAt     string  `json:"assigned_at"`
}

// VendorDashboardStats provides aggregate statistics for the vendor dashboard.
// Computed from MEMBER_MASTER, BENEFIT_PAYMENT, and CASE_HIST queries.
type VendorDashboardStats struct {
	PendingEnrollments   int     `json:"pending_enrollments"`
	VerifiedThisMonth    int     `json:"verified_this_month"`
	TotalActiveEnrollees int     `json:"total_active_enrollees"`
	AvgProcessingDays    float64 `json:"avg_processing_days"`
}
