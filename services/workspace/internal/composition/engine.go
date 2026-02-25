// Package composition implements the workspace composition engine.
//
// The engine determines which UI stages and components the frontend should render
// based on member data, process type, and context. It does NOT execute business rules
// or perform calculations — it decides WHAT to show based on member attributes.
// The rules engine (intelligence service) decides what the numbers are.
//
// Consumed by: internal/api (handlers pass MemberContext and receive CompositionResult)
// Depends on: internal/models (MemberContext, CompositionResult, Stage)
package composition

import (
	"fmt"
	"strings"

	"github.com/noui/workspace/internal/models"
)

// Engine evaluates workspace composition based on member data and process type.
type Engine struct{}

// NewEngine creates a new composition engine.
func NewEngine() *Engine {
	return &Engine{}
}

// Evaluate determines the workspace composition for a given member and process.
// It selects base stages for the process type, then adds/removes conditional
// components based on the member's data (tier, hire date, DRO, service credit, etc.).
func (e *Engine) Evaluate(req models.CompositionRequest, ctx models.MemberContext) (*models.CompositionResult, error) {
	switch req.ProcessType {
	case "retirement":
		return e.evaluateRetirement(req, ctx)
	case "refund":
		return e.evaluateRefund(req, ctx)
	case "death":
		return e.evaluateDeath(req, ctx)
	default:
		return nil, fmt.Errorf("unknown process type: %s", req.ProcessType)
	}
}

// evaluateRetirement builds the workspace for the retirement application process.
// Base stages: intake, service-credit, eligibility, benefit-calculation, payment-options, review-certify
// Conditional components are added based on member attributes.
func (e *Engine) evaluateRetirement(req models.CompositionRequest, ctx models.MemberContext) (*models.CompositionResult, error) {
	hasPurchasedService := ctx.ServiceCredit.PurchasedYears > 0
	hasDRO := ctx.DRO.HasDRO
	hasLeavePayout := ctx.Salary.LeaveEligible
	isEarlyRetirement := determineIsEarlyRetirement(ctx)

	// Stage 0: Application Intake
	intakeStage := models.Stage{
		ID:         "application-intake",
		Label:      "Application Intake",
		Order:      0,
		Components: []string{"DocumentChecklist", "IntakeReview"},
	}

	// Stage 1: Service Credit
	serviceCreditComponents := []string{"ServiceCreditSummary", "EmploymentTimeline"}
	if hasPurchasedService {
		serviceCreditComponents = append(serviceCreditComponents, "PurchaseServiceDetail")
	}
	serviceCreditStage := models.Stage{
		ID:         "service-credit",
		Label:      "Service Credit",
		Order:      1,
		Components: serviceCreditComponents,
		Signals: map[string]interface{}{
			"has_purchased_service": hasPurchasedService,
		},
	}

	// Stage 2: Eligibility
	retType := determineRetirementType(ctx)
	eligibilityStage := models.Stage{
		ID:         "eligibility",
		Label:      "Eligibility",
		Order:      2,
		Components: []string{"EligibilityPanel"},
		Signals: map[string]interface{}{
			"retirement_type": retType,
		},
	}

	// Stage 3: Benefit Calculation
	benefitComponents := []string{"BenefitCalculationPanel", "AMSDetail"}
	if hasLeavePayout {
		benefitComponents = append(benefitComponents, "LeavePayoutCalculator")
	}
	if isEarlyRetirement {
		benefitComponents = append(benefitComponents, "EarlyRetirementReductionCalculator")
	}
	benefitStage := models.Stage{
		ID:         "benefit-calculation",
		Label:      "Benefit Calculation",
		Order:      3,
		Components: benefitComponents,
		Signals: map[string]interface{}{
			"has_leave_payout":     hasLeavePayout,
			"is_early_retirement":  isEarlyRetirement,
		},
	}

	// Stage 4: Payment Options
	paymentStage := models.Stage{
		ID:         "payment-options",
		Label:      "Payment Options",
		Order:      4,
		Components: []string{"PaymentOptionsComparison", "IPRCalculator", "ScenarioModeler"},
	}

	// Build stage list — DRO stage is injected between payment-options and review if applicable
	stages := []models.Stage{intakeStage, serviceCreditStage, eligibilityStage, benefitStage, paymentStage}

	if hasDRO {
		droStage := models.Stage{
			ID:         "dro-impact",
			Label:      "DRO Impact",
			Order:      5,
			Components: []string{"DROImpactPanel", "DROCalculationDetail"},
			Signals: map[string]interface{}{
				"has_dro":   true,
				"dro_count": ctx.DRO.DROCount,
			},
		}
		stages = append(stages, droStage)
	}

	// Stage: Review & Certify (always last)
	reviewOrder := len(stages)
	reviewStage := models.Stage{
		ID:         "review-certify",
		Label:      "Review & Certify",
		Order:      reviewOrder,
		Components: []string{"ReviewSummary"},
	}
	stages = append(stages, reviewStage)

	// Build conditional components map
	conditional := map[string]bool{
		"DROImpactPanel":                    hasDRO,
		"LeavePayoutCalculator":             hasLeavePayout,
		"EarlyRetirementReductionCalculator": isEarlyRetirement,
		"PurchaseServiceDetail":             hasPurchasedService,
	}

	return &models.CompositionResult{
		MemberID:              req.MemberID,
		ProcessType:           req.ProcessType,
		Stages:                stages,
		ConditionalComponents: conditional,
	}, nil
}

// evaluateRefund builds the workspace for the contribution refund process.
// Base stages: eligibility, contributions, interest, options, review
func (e *Engine) evaluateRefund(req models.CompositionRequest, ctx models.MemberContext) (*models.CompositionResult, error) {
	isVested := (ctx.ServiceCredit.EarnedYears + ctx.ServiceCredit.MilitaryYears) >= 5.0

	stages := []models.Stage{
		{
			ID:         "eligibility",
			Label:      "Eligibility",
			Order:      0,
			Components: []string{"RefundEligibilityPanel"},
			Signals: map[string]interface{}{
				"is_vested": isVested,
			},
		},
		{
			ID:         "contributions",
			Label:      "Contributions",
			Order:      1,
			Components: []string{"ContributionSummary", "ContributionHistory"},
		},
		{
			ID:         "interest",
			Label:      "Interest Calculation",
			Order:      2,
			Components: []string{"InterestCalculator"},
		},
		{
			ID:         "options",
			Label:      "Refund Options",
			Order:      3,
			Components: []string{"RefundOptionsPanel"},
		},
	}

	// If vested, add a decision stage before review
	if isVested {
		stages = append(stages, models.Stage{
			ID:         "vested-decision",
			Label:      "Vested Member Decision",
			Order:      4,
			Components: []string{"VestedDecisionMoment"},
			Signals: map[string]interface{}{
				"earned_years":       ctx.ServiceCredit.EarnedYears,
				"forfeits_if_refund": true,
			},
		})
	}

	reviewOrder := len(stages)
	stages = append(stages, models.Stage{
		ID:         "review",
		Label:      "Review & Confirm",
		Order:      reviewOrder,
		Components: []string{"RefundReviewSummary"},
	})

	conditional := map[string]bool{
		"VestedDecisionMoment": isVested,
	}

	return &models.CompositionResult{
		MemberID:              req.MemberID,
		ProcessType:           req.ProcessType,
		Stages:                stages,
		ConditionalComponents: conditional,
	}, nil
}

// evaluateDeath builds the workspace for the death & survivor benefit process.
// Base stages: notification, survivor-determination, benefit-calc, overpayment, installments, review
func (e *Engine) evaluateDeath(req models.CompositionRequest, ctx models.MemberContext) (*models.CompositionResult, error) {
	hasDRO := ctx.DRO.HasDRO

	stages := []models.Stage{
		{
			ID:         "notification",
			Label:      "Death Notification",
			Order:      0,
			Components: []string{"DeathNotificationForm", "DocumentChecklist"},
		},
		{
			ID:         "survivor-determination",
			Label:      "Survivor Determination",
			Order:      1,
			Components: []string{"SurvivorIdentification", "BeneficiaryReview"},
			Signals: map[string]interface{}{
				"has_dro": hasDRO,
			},
		},
		{
			ID:         "benefit-calc",
			Label:      "Benefit Calculation",
			Order:      2,
			Components: []string{"DeathBenefitCalculator", "SurvivorBenefitPanel"},
		},
		{
			ID:         "overpayment",
			Label:      "Overpayment Review",
			Order:      3,
			Components: []string{"OverpaymentCalculator"},
		},
		{
			ID:         "installments",
			Label:      "Payment Installments",
			Order:      4,
			Components: []string{"InstallmentOptions"},
		},
	}

	if hasDRO {
		// Insert DRO review stage between survivor-determination and benefit-calc
		// Shift orders for subsequent stages
		droStage := models.Stage{
			ID:         "dro-review",
			Label:      "DRO Review",
			Order:      2,
			Components: []string{"DROSurvivorPanel"},
			Signals: map[string]interface{}{
				"has_dro":   true,
				"dro_count": ctx.DRO.DROCount,
			},
		}
		// Insert after survivor-determination (index 1), shift everything after
		newStages := make([]models.Stage, 0, len(stages)+1)
		newStages = append(newStages, stages[0], stages[1], droStage)
		for _, s := range stages[2:] {
			s.Order = len(newStages)
			newStages = append(newStages, s)
		}
		stages = newStages
	}

	reviewOrder := len(stages)
	stages = append(stages, models.Stage{
		ID:         "review",
		Label:      "Review & Certify",
		Order:      reviewOrder,
		Components: []string{"DeathReviewSummary"},
	})

	conditional := map[string]bool{
		"DROSurvivorPanel": hasDRO,
	}

	return &models.CompositionResult{
		MemberID:              req.MemberID,
		ProcessType:           req.ProcessType,
		Stages:                stages,
		ConditionalComponents: conditional,
	}, nil
}

// determineRetirementType infers the retirement type from member context.
// This is a heuristic for composition purposes only — the authoritative
// eligibility determination is performed by the intelligence service.
//
// For workspace composition, we need to know:
// - Is this likely a Rule of 75/85 retirement? (no reduction calculator)
// - Is this an early retirement? (needs reduction calculator)
// - Is this a normal retirement? (no reduction calculator)
func determineRetirementType(ctx models.MemberContext) string {
	totalEarned := ctx.ServiceCredit.EarnedYears + ctx.ServiceCredit.MilitaryYears

	// Parse hire date year to determine tier-based rules
	// Tier determines which Rule of N applies
	switch ctx.Member.Tier {
	case 1, 2:
		// Rule of 75: age + earned service >= 75, min age 55
		// We don't have age here directly, so we use a simplified heuristic:
		// If total earned years >= 20, likely a Rule of 75 candidate
		if totalEarned >= 20.0 {
			return "RULE_OF_75"
		}
		return "EARLY"
	case 3:
		// Rule of 85: age + earned service >= 85, min age 60
		if totalEarned >= 25.0 {
			return "RULE_OF_85"
		}
		return "EARLY"
	default:
		return "NORMAL"
	}
}

// determineIsEarlyRetirement checks if the member is likely taking early retirement.
// Early retirement means the member does not qualify for normal retirement or
// Rule of 75/85, so an early retirement reduction applies.
//
// CRITICAL: Tiers 1 & 2 reduce at 3%/yr under 65; Tier 3 at 6%/yr under 65
// (per RMC and DERP Active Member Handbook p.17)
func determineIsEarlyRetirement(ctx models.MemberContext) bool {
	retType := determineRetirementType(ctx)
	return strings.HasPrefix(retType, "EARLY")
}
