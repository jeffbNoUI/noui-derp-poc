// Package composition tests verify the workspace composition engine selects the
// correct stages and components for each member situation and process type.
//
// TOUCHPOINTS for engine_test.go:
//   Upstream: engine.go (composition logic), models.go (types)
//   Downstream: None (test file)
//   Shared: demo-cases/ (Case 1-4 member profiles drive test fixtures)
package composition

import (
	"testing"

	"github.com/noui/workspace/internal/models"
)

// --- Test Fixtures ---
// Each fixture mirrors a demo case member profile for composition testing.
// The composition engine does NOT calculate benefits — it determines which
// UI components to render based on member attributes.

// case1RobertMartinez: Tier 1, Rule of 75, has leave payout, no DRO
// Hire date 1997 (before 2010) → leave payout eligible
// 28.75 years earned → Rule of 75 heuristic triggers (>= 20 years)
func case1Context() models.MemberContext {
	return models.MemberContext{
		Member: models.MemberData{
			MemberID:  "10001",
			FirstName: "Robert",
			LastName:  "Martinez",
			Tier:      1,
			HireDate:  "1997-06-15",
			Status:    "ACTIVE",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears:    28.75,
			PurchasedYears: 0,
			MilitaryYears:  0,
			TotalYears:     28.75,
		},
		DRO: models.DROData{HasDRO: false},
		Salary: models.SalaryData{
			LeaveEligible: true,
			LeaveNote:     "Hired before 2010-01-01 with sick/vacation leave",
		},
	}
}

// case2JenniferKim: Tier 2, purchased service, early retirement
// Hire date 2008 (before 2010) → leave payout technically possible but not in this case
// 18.17 years earned + 3 purchased → early retirement (< 20 years earned)
func case2Context() models.MemberContext {
	return models.MemberContext{
		Member: models.MemberData{
			MemberID:  "10002",
			FirstName: "Jennifer",
			LastName:  "Kim",
			Tier:      2,
			HireDate:  "2008-03-01",
			Status:    "ACTIVE",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears:    18.17,
			PurchasedYears: 3.0,
			MilitaryYears:  0,
			TotalYears:     21.17,
		},
		DRO:    models.DROData{HasDRO: false},
		Salary: models.SalaryData{LeaveEligible: false},
	}
}

// case3DavidWashington: Tier 3, early retirement, no leave payout
// Hire date 2012 (after 2010) → no leave payout
// 13.58 years earned → early retirement for Tier 3 (< 25 years)
func case3Context() models.MemberContext {
	return models.MemberContext{
		Member: models.MemberData{
			MemberID:  "10003",
			FirstName: "David",
			LastName:  "Washington",
			Tier:      3,
			HireDate:  "2012-09-01",
			Status:    "ACTIVE",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears:    13.58,
			PurchasedYears: 0,
			MilitaryYears:  0,
			TotalYears:     13.58,
		},
		DRO:    models.DROData{HasDRO: false},
		Salary: models.SalaryData{LeaveEligible: false},
	}
}

// case4DROVariant: Case 1 with DRO added
func case4Context() models.MemberContext {
	ctx := case1Context()
	ctx.DRO = models.DROData{HasDRO: true, DROCount: 1}
	return ctx
}

// --- Helper functions ---

func containsComponent(stages []models.Stage, stageID, component string) bool {
	for _, s := range stages {
		if s.ID == stageID {
			for _, c := range s.Components {
				if c == component {
					return true
				}
			}
		}
	}
	return false
}

func hasStage(stages []models.Stage, stageID string) bool {
	for _, s := range stages {
		if s.ID == stageID {
			return true
		}
	}
	return false
}

func stageOrder(stages []models.Stage, stageID string) int {
	for _, s := range stages {
		if s.ID == stageID {
			return s.Order
		}
	}
	return -1
}

func getStage(stages []models.Stage, stageID string) *models.Stage {
	for i := range stages {
		if stages[i].ID == stageID {
			return &stages[i]
		}
	}
	return nil
}

// --- Tests ---

// Test 1: Retirement process returns 6 base stages
func TestRetirementBaseStages(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:    "10001",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, case1Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Case 1 has no DRO, so 6 stages: intake, service-credit, eligibility,
	// benefit-calculation, payment-options, review-certify
	if len(result.Stages) != 6 {
		t.Errorf("expected 6 stages for retirement, got %d", len(result.Stages))
		for _, s := range result.Stages {
			t.Logf("  stage: %s (order %d)", s.ID, s.Order)
		}
	}

	expectedStages := []string{
		"application-intake",
		"service-credit",
		"eligibility",
		"benefit-calculation",
		"payment-options",
		"review-certify",
	}
	for _, id := range expectedStages {
		if !hasStage(result.Stages, id) {
			t.Errorf("missing expected stage: %s", id)
		}
	}
}

// Test 2: Refund process returns 5 base stages (non-vested member)
func TestRefundBaseStages(t *testing.T) {
	engine := NewEngine()
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "99999",
			Tier:     2,
			HireDate: "2020-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears: 3.0,
			TotalYears:  3.0,
		},
	}
	req := models.CompositionRequest{
		MemberID:    "99999",
		ProcessType: "refund",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Non-vested refund: eligibility, contributions, interest, options, review = 5
	if len(result.Stages) != 5 {
		t.Errorf("expected 5 stages for non-vested refund, got %d", len(result.Stages))
		for _, s := range result.Stages {
			t.Logf("  stage: %s (order %d)", s.ID, s.Order)
		}
	}

	expectedStages := []string{"eligibility", "contributions", "interest", "options", "review"}
	for _, id := range expectedStages {
		if !hasStage(result.Stages, id) {
			t.Errorf("missing expected stage: %s", id)
		}
	}
}

// Test 3: Death process returns 6 base stages
func TestDeathBaseStages(t *testing.T) {
	engine := NewEngine()
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "88888",
			Tier:     1,
			HireDate: "2000-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears: 20.0,
			TotalYears:  20.0,
		},
		DRO: models.DROData{HasDRO: false},
	}
	req := models.CompositionRequest{
		MemberID:    "88888",
		ProcessType: "death",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Death without DRO: notification, survivor-determination, benefit-calc,
	// overpayment, installments, review = 6
	if len(result.Stages) != 6 {
		t.Errorf("expected 6 stages for death, got %d", len(result.Stages))
		for _, s := range result.Stages {
			t.Logf("  stage: %s (order %d)", s.ID, s.Order)
		}
	}

	expectedStages := []string{
		"notification", "survivor-determination", "benefit-calc",
		"overpayment", "installments", "review",
	}
	for _, id := range expectedStages {
		if !hasStage(result.Stages, id) {
			t.Errorf("missing expected stage: %s", id)
		}
	}
}

// Test 4: Case 1 (Robert Martinez) — Tier 1, Rule of 75, leave payout, no DRO
func TestCase1RobertMartinez(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:       "10001",
		ProcessType:    "retirement",
		RetirementDate: "2026-04-01",
	}
	result, err := engine.Evaluate(req, case1Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// LeavePayoutCalculator should be in benefit-calculation stage
	if !containsComponent(result.Stages, "benefit-calculation", "LeavePayoutCalculator") {
		t.Error("Case 1: expected LeavePayoutCalculator in benefit-calculation stage")
	}

	// No EarlyRetirementReductionCalculator — Rule of 75 means no reduction
	if containsComponent(result.Stages, "benefit-calculation", "EarlyRetirementReductionCalculator") {
		t.Error("Case 1: should NOT have EarlyRetirementReductionCalculator (Rule of 75)")
	}

	// No DRO stage
	if hasStage(result.Stages, "dro-impact") {
		t.Error("Case 1: should NOT have dro-impact stage")
	}

	// Verify conditional components map
	if !result.ConditionalComponents["LeavePayoutCalculator"] {
		t.Error("Case 1: conditional_components should show LeavePayoutCalculator=true")
	}
	if result.ConditionalComponents["EarlyRetirementReductionCalculator"] {
		t.Error("Case 1: conditional_components should show EarlyRetirementReductionCalculator=false")
	}
	if result.ConditionalComponents["DROImpactPanel"] {
		t.Error("Case 1: conditional_components should show DROImpactPanel=false")
	}
}

// Test 5: Case 2 (Jennifer Kim) — Tier 2, purchased service, early retirement
func TestCase2JenniferKim(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:       "10002",
		ProcessType:    "retirement",
		RetirementDate: "2026-05-01",
	}
	result, err := engine.Evaluate(req, case2Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// PurchaseServiceDetail should be in service-credit stage
	if !containsComponent(result.Stages, "service-credit", "PurchaseServiceDetail") {
		t.Error("Case 2: expected PurchaseServiceDetail in service-credit stage")
	}

	// EarlyRetirementReductionCalculator should be in benefit-calculation stage
	if !containsComponent(result.Stages, "benefit-calculation", "EarlyRetirementReductionCalculator") {
		t.Error("Case 2: expected EarlyRetirementReductionCalculator in benefit-calculation stage")
	}

	// No LeavePayoutCalculator (not eligible)
	if containsComponent(result.Stages, "benefit-calculation", "LeavePayoutCalculator") {
		t.Error("Case 2: should NOT have LeavePayoutCalculator")
	}

	// Verify conditional components
	if !result.ConditionalComponents["PurchaseServiceDetail"] {
		t.Error("Case 2: conditional_components should show PurchaseServiceDetail=true")
	}
	if !result.ConditionalComponents["EarlyRetirementReductionCalculator"] {
		t.Error("Case 2: conditional_components should show EarlyRetirementReductionCalculator=true")
	}
}

// Test 6: Case 3 (David Washington) — Tier 3, early retirement, no leave payout
func TestCase3DavidWashington(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:       "10003",
		ProcessType:    "retirement",
		RetirementDate: "2026-04-01",
	}
	result, err := engine.Evaluate(req, case3Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// EarlyRetirementReductionCalculator should be present (Tier 3 early)
	if !containsComponent(result.Stages, "benefit-calculation", "EarlyRetirementReductionCalculator") {
		t.Error("Case 3: expected EarlyRetirementReductionCalculator in benefit-calculation stage")
	}

	// No LeavePayoutCalculator — hired after 2010
	if containsComponent(result.Stages, "benefit-calculation", "LeavePayoutCalculator") {
		t.Error("Case 3: should NOT have LeavePayoutCalculator (hired after 2010)")
	}

	// No PurchaseServiceDetail — no purchased service
	if containsComponent(result.Stages, "service-credit", "PurchaseServiceDetail") {
		t.Error("Case 3: should NOT have PurchaseServiceDetail")
	}

	// Verify conditional components
	if result.ConditionalComponents["LeavePayoutCalculator"] {
		t.Error("Case 3: conditional_components should show LeavePayoutCalculator=false")
	}
	if !result.ConditionalComponents["EarlyRetirementReductionCalculator"] {
		t.Error("Case 3: conditional_components should show EarlyRetirementReductionCalculator=true")
	}
}

// Test 7: Case 4 (DRO variant) — has DRO, should add DROImpactPanel stage
func TestCase4DROVariant(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:       "10001",
		ProcessType:    "retirement",
		RetirementDate: "2026-04-01",
	}
	result, err := engine.Evaluate(req, case4Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// DRO stage should be present
	if !hasStage(result.Stages, "dro-impact") {
		t.Error("Case 4: expected dro-impact stage")
	}

	// DROImpactPanel should be in the dro-impact stage
	if !containsComponent(result.Stages, "dro-impact", "DROImpactPanel") {
		t.Error("Case 4: expected DROImpactPanel in dro-impact stage")
	}

	// 7 stages total (6 base + DRO)
	if len(result.Stages) != 7 {
		t.Errorf("Case 4: expected 7 stages (6 base + DRO), got %d", len(result.Stages))
	}

	// Verify conditional components
	if !result.ConditionalComponents["DROImpactPanel"] {
		t.Error("Case 4: conditional_components should show DROImpactPanel=true")
	}
}

// Test 8: Unknown process type returns error
func TestUnknownProcessType(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:    "10001",
		ProcessType: "transfer",
	}
	_, err := engine.Evaluate(req, case1Context())
	if err == nil {
		t.Error("expected error for unknown process type")
	}
}

// Test 9: Conditional components map accuracy
func TestConditionalComponentsMap(t *testing.T) {
	engine := NewEngine()

	// Case with everything: DRO, leave, purchased, early retirement
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "77777",
			Tier:     2,
			HireDate: "2005-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears:    10.0,
			PurchasedYears: 2.0,
			TotalYears:     12.0,
		},
		DRO: models.DROData{HasDRO: true, DROCount: 2},
		Salary: models.SalaryData{
			LeaveEligible: true,
			LeaveNote:     "Hired before 2010",
		},
	}
	req := models.CompositionRequest{
		MemberID:    "77777",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// All conditional components should be true
	expected := map[string]bool{
		"DROImpactPanel":                    true,
		"LeavePayoutCalculator":             true,
		"EarlyRetirementReductionCalculator": true,
		"PurchaseServiceDetail":             true,
	}
	for key, want := range expected {
		got, ok := result.ConditionalComponents[key]
		if !ok {
			t.Errorf("missing conditional component key: %s", key)
		} else if got != want {
			t.Errorf("conditional_components[%s] = %v, want %v", key, got, want)
		}
	}
}

// Test 10: Stage ordering is sequential (0, 1, 2, ...)
func TestStageOrdering(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:    "10001",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, case4Context()) // DRO variant for 7 stages
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	for i, stage := range result.Stages {
		if stage.Order != i {
			t.Errorf("stage %d (%s) has order %d, expected %d", i, stage.ID, stage.Order, i)
		}
	}
}

// Test 11: Signals are populated on stages
func TestSignalsPopulated(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:       "10001",
		ProcessType:    "retirement",
		RetirementDate: "2026-04-01",
	}
	result, err := engine.Evaluate(req, case1Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Service credit stage should have has_purchased_service signal
	scStage := getStage(result.Stages, "service-credit")
	if scStage == nil {
		t.Fatal("service-credit stage not found")
	}
	if _, ok := scStage.Signals["has_purchased_service"]; !ok {
		t.Error("service-credit stage missing has_purchased_service signal")
	}

	// Eligibility stage should have retirement_type signal
	eligStage := getStage(result.Stages, "eligibility")
	if eligStage == nil {
		t.Fatal("eligibility stage not found")
	}
	retType, ok := eligStage.Signals["retirement_type"]
	if !ok {
		t.Error("eligibility stage missing retirement_type signal")
	}
	if retType != "RULE_OF_75" {
		t.Errorf("expected retirement_type signal RULE_OF_75, got %v", retType)
	}

	// Benefit calculation stage should have has_leave_payout signal
	benefitStage := getStage(result.Stages, "benefit-calculation")
	if benefitStage == nil {
		t.Fatal("benefit-calculation stage not found")
	}
	if lp, ok := benefitStage.Signals["has_leave_payout"]; !ok || lp != true {
		t.Error("benefit-calculation stage missing or incorrect has_leave_payout signal")
	}
}

// Test 12: DRO stage appears between payment-options and review-certify
func TestDROStagePosition(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:    "10001",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, case4Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	droOrder := stageOrder(result.Stages, "dro-impact")
	paymentOrder := stageOrder(result.Stages, "payment-options")
	reviewOrder := stageOrder(result.Stages, "review-certify")

	if droOrder == -1 {
		t.Fatal("dro-impact stage not found")
	}
	if droOrder <= paymentOrder {
		t.Errorf("DRO stage (order %d) should be after payment-options (order %d)", droOrder, paymentOrder)
	}
	if droOrder >= reviewOrder {
		t.Errorf("DRO stage (order %d) should be before review-certify (order %d)", droOrder, reviewOrder)
	}
}

// Test 13: Refund process with vested member adds VestedDecisionMoment
func TestRefundVestedMember(t *testing.T) {
	engine := NewEngine()
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "66666",
			Tier:     1,
			HireDate: "2000-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears: 8.0, // > 5 years = vested
			TotalYears:  8.0,
		},
	}
	req := models.CompositionRequest{
		MemberID:    "66666",
		ProcessType: "refund",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Vested member should have VestedDecisionMoment stage
	if !hasStage(result.Stages, "vested-decision") {
		t.Error("vested member should have vested-decision stage")
	}

	// 6 stages: eligibility, contributions, interest, options, vested-decision, review
	if len(result.Stages) != 6 {
		t.Errorf("expected 6 stages for vested refund, got %d", len(result.Stages))
	}

	if !result.ConditionalComponents["VestedDecisionMoment"] {
		t.Error("conditional_components should show VestedDecisionMoment=true for vested member")
	}
}

// Test 14: Death process with DRO adds DRO review stage
func TestDeathWithDRO(t *testing.T) {
	engine := NewEngine()
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "55555",
			Tier:     1,
			HireDate: "1998-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears: 25.0,
			TotalYears:  25.0,
		},
		DRO: models.DROData{HasDRO: true, DROCount: 1},
	}
	req := models.CompositionRequest{
		MemberID:    "55555",
		ProcessType: "death",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should have dro-review stage
	if !hasStage(result.Stages, "dro-review") {
		t.Error("death with DRO should have dro-review stage")
	}

	// 7 stages (6 base + DRO review)
	if len(result.Stages) != 7 {
		t.Errorf("expected 7 stages for death with DRO, got %d", len(result.Stages))
	}

	// DRO review should be between survivor-determination and benefit-calc
	droOrder := stageOrder(result.Stages, "dro-review")
	survivorOrder := stageOrder(result.Stages, "survivor-determination")
	benefitOrder := stageOrder(result.Stages, "benefit-calc")

	if droOrder <= survivorOrder {
		t.Errorf("dro-review (order %d) should be after survivor-determination (order %d)", droOrder, survivorOrder)
	}
	if droOrder >= benefitOrder {
		t.Errorf("dro-review (order %d) should be before benefit-calc (order %d)", droOrder, benefitOrder)
	}
}

// Test 15: MemberID and ProcessType are propagated to result
func TestResultPropagation(t *testing.T) {
	engine := NewEngine()
	req := models.CompositionRequest{
		MemberID:       "10001",
		ProcessType:    "retirement",
		RetirementDate: "2026-04-01",
	}
	result, err := engine.Evaluate(req, case1Context())
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if result.MemberID != "10001" {
		t.Errorf("expected MemberID 10001, got %s", result.MemberID)
	}
	if result.ProcessType != "retirement" {
		t.Errorf("expected ProcessType retirement, got %s", result.ProcessType)
	}
}

// Test 16: Retirement with no special conditions — minimal component set
func TestRetirementMinimal(t *testing.T) {
	engine := NewEngine()
	// Tier 1 with lots of earned years but no purchased, no DRO, no leave
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "44444",
			Tier:     1,
			HireDate: "1995-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears: 30.0,
			TotalYears:  30.0,
		},
		DRO:    models.DROData{HasDRO: false},
		Salary: models.SalaryData{LeaveEligible: false},
	}
	req := models.CompositionRequest{
		MemberID:    "44444",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// All conditional components should be false
	for key, val := range result.ConditionalComponents {
		if val {
			t.Errorf("expected all conditional components false for minimal case, but %s=true", key)
		}
	}

	// 6 base stages
	if len(result.Stages) != 6 {
		t.Errorf("expected 6 stages for minimal retirement, got %d", len(result.Stages))
	}
}

// Test 17: Tier 3 Rule of 85 heuristic (>= 25 earned years)
func TestTier3RuleOf85(t *testing.T) {
	engine := NewEngine()
	ctx := models.MemberContext{
		Member: models.MemberData{
			MemberID: "33333",
			Tier:     3,
			HireDate: "2012-01-01",
		},
		ServiceCredit: models.ServiceCreditData{
			EarnedYears: 26.0, // >= 25 → Rule of 85 heuristic
			TotalYears:  26.0,
		},
		DRO:    models.DROData{HasDRO: false},
		Salary: models.SalaryData{LeaveEligible: false},
	}
	req := models.CompositionRequest{
		MemberID:    "33333",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Rule of 85 → no early retirement reduction
	if containsComponent(result.Stages, "benefit-calculation", "EarlyRetirementReductionCalculator") {
		t.Error("Tier 3 Rule of 85 should NOT have EarlyRetirementReductionCalculator")
	}

	// Verify signal
	eligStage := getStage(result.Stages, "eligibility")
	if eligStage == nil {
		t.Fatal("eligibility stage not found")
	}
	if eligStage.Signals["retirement_type"] != "RULE_OF_85" {
		t.Errorf("expected retirement_type RULE_OF_85, got %v", eligStage.Signals["retirement_type"])
	}
}

// Test 18: Service credit stage components include PurchaseServiceDetail only when purchased > 0
func TestPurchaseServiceConditional(t *testing.T) {
	engine := NewEngine()

	// Without purchased service
	ctxNoPurchase := case1Context() // Robert has no purchased service
	req := models.CompositionRequest{
		MemberID:    "10001",
		ProcessType: "retirement",
	}
	result, err := engine.Evaluate(req, ctxNoPurchase)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if containsComponent(result.Stages, "service-credit", "PurchaseServiceDetail") {
		t.Error("should NOT have PurchaseServiceDetail when no purchased service")
	}

	// With purchased service
	ctxWithPurchase := case2Context() // Jennifer has 3.0 years purchased
	req2 := models.CompositionRequest{
		MemberID:    "10002",
		ProcessType: "retirement",
	}
	result2, err := engine.Evaluate(req2, ctxWithPurchase)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !containsComponent(result2.Stages, "service-credit", "PurchaseServiceDetail") {
		t.Error("should have PurchaseServiceDetail when purchased service > 0")
	}
}
