// Package changemanagement provides the AI-accelerated change management demo.
// This is a prepared static demonstration showing how AI assists with rule changes,
// NOT a live AI interaction. AI identifies affected rules and drafts changes;
// humans review, test, and certify.
package changemanagement

// RuleChange represents a proposed change to a rule definition.
type RuleChange struct {
	RuleID          string `json:"rule_id"`
	RuleName        string `json:"rule_name"`
	ChangeType      string `json:"change_type"` // "parameter_update", "new_rule", "deprecation"
	CurrentValue    string `json:"current_value"`
	ProposedValue   string `json:"proposed_value"`
	Justification   string `json:"justification"`
	SourceReference string `json:"source_reference"`
	AffectedTiers   []int  `json:"affected_tiers"`
}

// ImpactAssessment describes how a rule change affects the system.
type ImpactAssessment struct {
	AffectedMembers     int    `json:"affected_members"`
	AffectedCalculation string `json:"affected_calculation"`
	RegressionTests     int    `json:"regression_tests_generated"`
	Summary             string `json:"summary"`
}

// ChangePackage is the complete change proposal for human review.
type ChangePackage struct {
	ChangeID       string            `json:"change_id"`
	Title          string            `json:"title"`
	Description    string            `json:"description"`
	EffectiveDate  string            `json:"effective_date"`
	Changes        []RuleChange      `json:"changes"`
	Impact         ImpactAssessment  `json:"impact"`
	TestResults    []TestResult      `json:"test_results"`
	Status         string            `json:"status"` // "draft", "review", "certified", "deployed"
	CertifiedBy    string            `json:"certified_by"`
}

// TestResult represents a test generated from the rule change.
type TestResult struct {
	TestName    string `json:"test_name"`
	Description string `json:"description"`
	Input       string `json:"input"`
	Expected    string `json:"expected"`
	Actual      string `json:"actual"`
	Passed      bool   `json:"passed"`
}

// GenerateContributionRateChangeDemo creates the prepared demo scenario:
// changing employee contribution rate from 8.45% to 9.00%.
// This demonstrates the full SDLC workflow per Governing Principle 3.
func GenerateContributionRateChangeDemo() ChangePackage {
	return ChangePackage{
		ChangeID:      "CHG-2026-001",
		Title:         "Employee Contribution Rate Increase: 8.45% → 9.00%",
		Description:   "Board-approved increase in employee contribution rate effective July 1, 2026. AI identified 3 affected rules and generated regression tests.",
		EffectiveDate: "2026-07-01",
		Changes: []RuleChange{
			{
				RuleID:          "CONTRIB-001",
				RuleName:        "Employee Contribution Rate",
				ChangeType:      "parameter_update",
				CurrentValue:    "8.45%",
				ProposedValue:   "9.00%",
				Justification:   "Board Resolution 2026-04: Annual actuarial review recommends contribution increase to maintain funding target.",
				SourceReference: "RMC §18-407(e)(1), Board Resolution 2026-04",
				AffectedTiers:   []int{1, 2, 3},
			},
			{
				RuleID:          "CONTRIB-002",
				RuleName:        "Contribution Deduction Calculation",
				ChangeType:      "parameter_update",
				CurrentValue:    "pensionable_pay × 0.0845",
				ProposedValue:   "pensionable_pay × 0.0900",
				Justification:   "Derived from CONTRIB-001 rate change.",
				SourceReference: "RMC §18-407(e)(1)",
				AffectedTiers:   []int{1, 2, 3},
			},
			{
				RuleID:          "CONTRIB-003",
				RuleName:        "Pre-Tax Treatment Verification",
				ChangeType:      "parameter_update",
				CurrentValue:    "Verify deduction at 8.45% is pre-tax",
				ProposedValue:   "Verify deduction at 9.00% is pre-tax",
				Justification:   "Pre-tax treatment unchanged, rate parameter updated for validation.",
				SourceReference: "RMC §18-407(e)(2)",
				AffectedTiers:   []int{1, 2, 3},
			},
		},
		Impact: ImpactAssessment{
			AffectedMembers:     5000,
			AffectedCalculation: "All active member contribution deductions. Does NOT affect benefit calculations, eligibility, or existing retiree payments.",
			RegressionTests:     12,
			Summary:             "Low complexity change — single parameter update propagated to 3 rules. No benefit calculation impact. All active members affected on effective date.",
		},
		TestResults: []TestResult{
			{
				TestName:    "TC-001: Standard biweekly contribution at new rate",
				Description: "Verify biweekly contribution for $3,000 biweekly pay at 9.00%",
				Input:       "pensionable_pay=$3,000.00, rate=9.00%",
				Expected:    "$270.00",
				Actual:      "$270.00",
				Passed:      true,
			},
			{
				TestName:    "TC-002: Annual contribution verification",
				Description: "Verify annual contribution for $75,000 salary at 9.00%",
				Input:       "annual_salary=$75,000.00, rate=9.00%",
				Expected:    "$6,750.00",
				Actual:      "$6,750.00",
				Passed:      true,
			},
			{
				TestName:    "TC-003: Rate boundary — last day at old rate",
				Description: "Contribution on June 30, 2026 uses old rate 8.45%",
				Input:       "date=2026-06-30, pensionable_pay=$3,000.00",
				Expected:    "$253.50 (at 8.45%)",
				Actual:      "$253.50",
				Passed:      true,
			},
			{
				TestName:    "TC-004: Rate boundary — first day at new rate",
				Description: "Contribution on July 1, 2026 uses new rate 9.00%",
				Input:       "date=2026-07-01, pensionable_pay=$3,000.00",
				Expected:    "$270.00 (at 9.00%)",
				Actual:      "$270.00",
				Passed:      true,
			},
			{
				TestName:    "TC-005: Existing benefit calculations unchanged",
				Description: "Retired member benefit amount unaffected by contribution rate change",
				Input:       "retiree_id=20001, existing_benefit=$2,500.00",
				Expected:    "$2,500.00 (unchanged)",
				Actual:      "$2,500.00",
				Passed:      true,
			},
			{
				TestName:    "TC-006: AMS calculation unaffected",
				Description: "AMS uses pensionable pay, not contribution amounts",
				Input:       "member_id=10001 (Case 1)",
				Expected:    "AMS unchanged from pre-change calculation",
				Actual:      "AMS unchanged",
				Passed:      true,
			},
		},
		Status:      "review",
		CertifiedBy: "",
	}
}
