// Package models defines the request/response types for the workspace composition service.
//
// These types define the composition API contract. The CompositionRequest drives
// what process and member are being evaluated. The CompositionResult describes
// which stages and components the frontend should render.
//
// Consumed by: internal/api (handlers), internal/composition (engine)
// Depends on: nothing (leaf package)
package models

// CompositionRequest is the input for workspace composition evaluation.
type CompositionRequest struct {
	MemberID       string `json:"member_id"`
	ProcessType    string `json:"process_type"`              // retirement, refund, death
	RetirementDate string `json:"retirement_date,omitempty"` // YYYY-MM-DD
}

// CompositionResult is the full workspace composition output.
type CompositionResult struct {
	MemberID              string          `json:"member_id"`
	ProcessType           string          `json:"process_type"`
	Stages                []Stage         `json:"stages"`
	ConditionalComponents map[string]bool `json:"conditional_components"`
}

// Stage represents one step in the workspace workflow.
type Stage struct {
	ID         string                 `json:"id"`
	Label      string                 `json:"label"`
	Order      int                    `json:"order"`
	Components []string               `json:"components"`
	Signals    map[string]interface{} `json:"signals,omitempty"`
}

// MemberData is the subset of connector response needed for composition decisions.
// The workspace service only needs enough member data to determine which
// components to render — it does NOT execute business rules or calculations.
type MemberData struct {
	MemberID  string `json:"member_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Tier      int    `json:"tier"`
	HireDate  string `json:"hire_date"`
	Status    string `json:"status_code"`
}

// ServiceCreditData is the subset of connector service credit response.
type ServiceCreditData struct {
	EarnedYears    float64 `json:"earned_years"`
	PurchasedYears float64 `json:"purchased_years"`
	MilitaryYears  float64 `json:"military_years"`
	TotalYears     float64 `json:"total_years"`
}

// DROData is a minimal DRO presence indicator from connector.
type DROData struct {
	HasDRO   bool `json:"has_dro"`
	DROCount int  `json:"dro_count"`
}

// SalaryData is the subset of connector salary response needed for composition.
type SalaryData struct {
	LeaveEligible bool   `json:"leave_payout_eligible"`
	LeaveNote     string `json:"leave_payout_note,omitempty"`
}

// MemberContext bundles all the member data the composition engine needs.
// The HTTP handler fetches each piece from the connector, then passes
// this aggregated context to the engine for component selection.
type MemberContext struct {
	Member        MemberData
	ServiceCredit ServiceCreditData
	DRO           DROData
	Salary        SalaryData
}
