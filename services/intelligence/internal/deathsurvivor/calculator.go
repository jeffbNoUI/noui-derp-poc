// Package deathsurvivor implements the DERP death and survivor benefit processing engine.
//
// Handles: death notification processing, overpayment detection, J&S survivor
// benefit continuation, death benefit installment tracking, active member death
// (vested vs non-vested), pop-up provision, and record status transitions.
//
// Every calculation shows its formula, inputs, and result (Phase 1 Transparency).
// AI does NOT execute business rules — all calculations are deterministic code
// executing certified rule configurations.
//
// Consumed by: intelligence API handlers (death_handlers.go)
// Depends on: rules/tables.go (death benefit lookup tables), models/models.go
package deathsurvivor

import (
	"fmt"
	"math"
	"time"

	"github.com/noui-derp-poc/intelligence/internal/rules"
)

// --- Input/Output types ---

// DeathNotificationInput contains the data needed to process a death notification.
type DeathNotificationInput struct {
	MemberID         string
	MemberStatus     string    // "active" or "retired"
	DeathDate        time.Time // Date of death
	NotificationDate time.Time // Date DERP was notified
	PaymentOption    string    // "maximum", "100_js", "75_js", "50_js" (retired members only)
}

// DeathNotificationResult contains the processing outcome.
type DeathNotificationResult struct {
	MemberID          string `json:"member_id"`
	BenefitSuspended  bool   `json:"benefit_suspended"`
	CertificateNeeded bool   `json:"certificate_required"`
	StatusTransition  string `json:"status_transition"`
	Rule              string `json:"rule_applied"`
	Note              string `json:"note"`
}

// PaymentRecord represents a single benefit payment for overpayment detection.
type PaymentRecord struct {
	DepositDate time.Time
	Amount      float64
}

// OverpaymentResult contains the overpayment detection outcome.
type OverpaymentResult struct {
	OverpaymentCount int              `json:"overpayment_count"`
	OverpaymentTotal float64          `json:"overpayment_total"`
	ValidPayments    int              `json:"valid_payments"`
	Payments         []PaymentDetail  `json:"payment_details"`
	Rule             string           `json:"rule_applied"`
}

// PaymentDetail describes one payment's overpayment status.
type PaymentDetail struct {
	DepositDate string  `json:"deposit_date"`
	Amount      float64 `json:"amount"`
	Valid       bool    `json:"valid"`
	Reason      string  `json:"reason"`
}

// SurvivorJSInput contains inputs for J&S survivor benefit calculation.
type SurvivorJSInput struct {
	MemberBenefit   float64 // Member's monthly benefit at death
	JSPercentage    float64 // 1.00, 0.75, or 0.50
	SurvivorName    string
	DeathDate       time.Time
}

// SurvivorJSResult contains the J&S survivor benefit calculation.
type SurvivorJSResult struct {
	SurvivorBenefit  float64 `json:"survivor_monthly_benefit"`
	SurvivorName     string  `json:"survivor_name"`
	JSPercentage     float64 `json:"js_percentage"`
	EffectiveDate    string  `json:"effective_date"`
	Duration         string  `json:"duration"`
	Formula          string  `json:"formula"`
	Rule             string  `json:"rule_applied"`
}

// InstallmentInput contains inputs for death benefit installment calculation.
type InstallmentInput struct {
	DeathBenefitLumpSum float64
	TotalInstallments   int // 50 or 100
	RetirementDate      time.Time
	DeathDate           time.Time
}

// InstallmentResult contains the death benefit installment status.
type InstallmentResult struct {
	InstallmentAmount    float64 `json:"installment_amount"`
	InstallmentsPaid     int     `json:"installments_paid"`
	InstallmentsRemaining int    `json:"installments_remaining"`
	RemainingTotal       float64 `json:"remaining_total"`
	Formula              string  `json:"formula"`
	Rule                 string  `json:"rule_applied"`
}

// ActiveMemberDeathInput contains inputs for active member death processing.
type ActiveMemberDeathInput struct {
	MemberID              string
	ServiceYears          float64
	AccumulatedContribs   float64
	AccruedInterest       float64
	Tier                  int
	AgeAtDeath            int
}

// ActiveMemberDeathResult contains the active member death determination.
type ActiveMemberDeathResult struct {
	BenefitType            string  `json:"benefit_type"` // "contribution_refund" or "survivor_annuity"
	Vested                 bool    `json:"vested"`
	RefundAmount           float64 `json:"refund_amount,omitempty"`
	SurvivorAnnuityAvail   bool    `json:"survivor_annuity_available"`
	Formula                string  `json:"formula"`
	Rule                   string  `json:"rule_applied"`
}

// PopUpInput contains inputs for the pop-up provision calculation.
type PopUpInput struct {
	CurrentJSBenefit     float64
	MaximumBenefit       float64
	BeneficiaryDeathDate time.Time
}

// PopUpResult contains the pop-up provision outcome.
type PopUpResult struct {
	NewBenefit         float64 `json:"new_benefit"`
	IncreaseAmount     float64 `json:"increase_amount"`
	EffectiveDate      string  `json:"effective_date"`
	NewBeneficiaryOK   bool    `json:"new_beneficiary_allowed"`
	Retroactive        bool    `json:"retroactive"`
	Formula            string  `json:"formula"`
	Rule               string  `json:"rule_applied"`
}

// RecordTransitionResult describes the status transitions during death processing.
type RecordTransitionResult struct {
	StatusSequence       []string `json:"status_sequence"`
	SurvivorRecordCreated bool    `json:"survivor_record_created"`
	BenefitTerminated    bool     `json:"benefit_terminated"`
	Rule                 string   `json:"rule_applied"`
}

// DeathSurvivorSummary combines all death processing results into one package.
type DeathSurvivorSummary struct {
	MemberID       string                  `json:"member_id"`
	Notification   *DeathNotificationResult `json:"notification"`
	Overpayment    *OverpaymentResult       `json:"overpayment"`
	SurvivorJS     *SurvivorJSResult        `json:"survivor_benefit,omitempty"`
	Installments   *InstallmentResult       `json:"death_benefit_installments,omitempty"`
	ActiveDeath    *ActiveMemberDeathResult  `json:"active_member_death,omitempty"`
	Transition     *RecordTransitionResult   `json:"record_transition"`
	Trace          []TraceStep              `json:"calculation_trace"`
}

// TraceStep documents one step in the death processing audit trail.
type TraceStep struct {
	StepNumber  int    `json:"step"`
	RuleID      string `json:"rule_id"`
	RuleName    string `json:"rule_name"`
	Description string `json:"description"`
	Inputs      string `json:"inputs"`
	Result      string `json:"result"`
	Source      string `json:"source_reference"`
}

// --- Calculation functions ---

// DeathNotificationProcess handles RULE-DEATH-NOTIFY.
// Upon credible notification, immediately suspend benefit payments.
// Death certificate is required for final processing.
// Source: DERP Operating Procedures — Death Processing Protocol
func DeathNotificationProcess(input DeathNotificationInput) DeathNotificationResult {
	result := DeathNotificationResult{
		MemberID:          input.MemberID,
		BenefitSuspended:  true,
		CertificateNeeded: true,
		Rule:              "RULE-DEATH-NOTIFY",
	}

	if input.MemberStatus == "retired" {
		result.StatusTransition = "RETIRED → SUSPENDED"
		result.Note = "Benefit payments suspended pending death certificate verification. " +
			"All scheduled payments held until certificate is received and verified."
	} else {
		result.StatusTransition = "ACTIVE → SUSPENDED"
		result.Note = "Active member death recorded. Employment record suspended. " +
			"Death certificate required for final processing and benefit determination."
	}

	return result
}

// OverpaymentDetection handles RULE-OVERPAY-DETECT.
// Compares each payment deposit date against the date of death.
// Payments deposited AFTER death date are overpayments.
// Payments deposited on or before death date are valid.
// Source: DERP Operating Procedures — Post-Death Payment Recovery
func OverpaymentDetection(deathDate time.Time, payments []PaymentRecord) OverpaymentResult {
	result := OverpaymentResult{
		Rule: "RULE-OVERPAY-DETECT",
	}

	for _, p := range payments {
		detail := PaymentDetail{
			DepositDate: p.DepositDate.Format("2006-01-02"),
			Amount:      p.Amount,
		}

		// CRITICAL: Strictly AFTER death date is overpayment.
		// Same day or before is valid (payment was issued before death occurred).
		if p.DepositDate.After(deathDate) {
			detail.Valid = false
			detail.Reason = fmt.Sprintf("Deposited %s, after death date %s — overpayment",
				p.DepositDate.Format("2006-01-02"), deathDate.Format("2006-01-02"))
			result.OverpaymentCount++
			result.OverpaymentTotal += p.Amount
		} else {
			detail.Valid = true
			detail.Reason = fmt.Sprintf("Deposited %s, on or before death date %s — valid",
				p.DepositDate.Format("2006-01-02"), deathDate.Format("2006-01-02"))
			result.ValidPayments++
		}

		result.Payments = append(result.Payments, detail)
	}

	// Round total to cents
	result.OverpaymentTotal = bankersRound(result.OverpaymentTotal, 2)
	return result
}

// SurvivorJSBenefit handles RULE-SURVIVOR-JS.
// Calculates the J&S survivor continuation benefit.
// Survivor receives the elected percentage of the member's monthly benefit for life.
// Source: RMC §18-410(a)(1)
func SurvivorJSBenefit(input SurvivorJSInput) SurvivorJSResult {
	survivorBenefit := bankersRound(input.MemberBenefit*input.JSPercentage, 2)

	// Effective date: first of month following death
	effDate := firstOfMonthFollowing(input.DeathDate)

	return SurvivorJSResult{
		SurvivorBenefit: survivorBenefit,
		SurvivorName:    input.SurvivorName,
		JSPercentage:    input.JSPercentage,
		EffectiveDate:   effDate.Format("2006-01-02"),
		Duration:        "Survivor's lifetime",
		Formula: fmt.Sprintf("$%.2f × %.0f%% = $%.2f",
			input.MemberBenefit, input.JSPercentage*100, survivorBenefit),
		Rule: "RULE-SURVIVOR-JS",
	}
}

// DeathBenefitInstallments handles RULE-DEATH-INSTALLMENTS.
// Calculates remaining death benefit installments after member's death.
// Source: RMC §18-411(d)
func DeathBenefitInstallments(input InstallmentInput) InstallmentResult {
	installmentAmt := bankersRound(input.DeathBenefitLumpSum/float64(input.TotalInstallments), 2)

	// Calculate months from retirement to death (inclusive of first month)
	// Retirement date is the first payment month; count complete months from then to death.
	paid := monthsBetween(input.RetirementDate, input.DeathDate)

	// Cap at total installments
	if paid > input.TotalInstallments {
		paid = input.TotalInstallments
	}
	if paid < 0 {
		paid = 0
	}

	remaining := input.TotalInstallments - paid
	remainingTotal := bankersRound(float64(remaining)*installmentAmt, 2)

	return InstallmentResult{
		InstallmentAmount:     installmentAmt,
		InstallmentsPaid:      paid,
		InstallmentsRemaining: remaining,
		RemainingTotal:        remainingTotal,
		Formula: fmt.Sprintf("$%.2f / %d = $%.2f per installment; %d paid, %d remaining; $%.2f total remaining",
			input.DeathBenefitLumpSum, input.TotalInstallments, installmentAmt,
			paid, remaining, remainingTotal),
		Rule: "RULE-DEATH-INSTALLMENTS",
	}
}

// ActiveMemberDeath handles RULE-ACTIVE-DEATH.
// Determines benefit type for active member death: contribution refund (non-vested)
// or survivor annuity option (vested).
// Source: RMC §18-411
func ActiveMemberDeath(input ActiveMemberDeathInput) ActiveMemberDeathResult {
	vested := input.ServiceYears >= rules.VestingYears

	if !vested {
		refund := bankersRound(input.AccumulatedContribs+input.AccruedInterest, 2)
		return ActiveMemberDeathResult{
			BenefitType:          "contribution_refund",
			Vested:               false,
			RefundAmount:         refund,
			SurvivorAnnuityAvail: false,
			Formula: fmt.Sprintf("Contributions $%.2f + Interest $%.2f = $%.2f refund",
				input.AccumulatedContribs, input.AccruedInterest, refund),
			Rule: "RULE-ACTIVE-DEATH",
		}
	}

	return ActiveMemberDeathResult{
		BenefitType:          "survivor_annuity",
		Vested:               true,
		SurvivorAnnuityAvail: true,
		Formula: fmt.Sprintf("Vested with %.2f years (>= %.1f required). "+
			"Beneficiary may elect survivor annuity or contribution refund.",
			input.ServiceYears, rules.VestingYears),
		Rule: "RULE-ACTIVE-DEATH",
	}
}

// PopUpProvision handles RULE-POPUP.
// If J&S beneficiary dies before the member, member's benefit increases to Maximum.
// Effective first of month following beneficiary's death. Prospective only.
// Source: Retirement Application Page 2
func PopUpProvision(input PopUpInput) PopUpResult {
	effDate := firstOfMonthFollowing(input.BeneficiaryDeathDate)
	increase := bankersRound(input.MaximumBenefit-input.CurrentJSBenefit, 2)

	return PopUpResult{
		NewBenefit:       input.MaximumBenefit,
		IncreaseAmount:   increase,
		EffectiveDate:    effDate.Format("2006-01-02"),
		NewBeneficiaryOK: false,
		Retroactive:      false,
		Formula: fmt.Sprintf("Maximum $%.2f - current J&S $%.2f = $%.2f increase, effective %s",
			input.MaximumBenefit, input.CurrentJSBenefit, increase, effDate.Format("2006-01-02")),
		Rule: "RULE-POPUP",
	}
}

// RecordTransition handles RULE-DEATH-RECORD-TRANSITION.
// Determines the status sequence and whether survivor records should be created.
// Source: DERP Operating Procedures — Member Status Transitions
func RecordTransition(memberStatus string, deathCertVerified bool, paymentOption string) RecordTransitionResult {
	result := RecordTransitionResult{
		Rule: "RULE-DEATH-RECORD-TRANSITION",
	}

	// Build status sequence based on initial status
	var initialStatus string
	if memberStatus == "active" {
		initialStatus = "ACTIVE"
	} else {
		initialStatus = "RETIRED"
	}

	result.StatusSequence = append(result.StatusSequence, initialStatus)
	result.StatusSequence = append(result.StatusSequence, "SUSPENDED")

	if deathCertVerified {
		result.StatusSequence = append(result.StatusSequence, "DECEASED")
	}

	// Determine if J&S survivor record should be created
	jsOptions := map[string]bool{
		"100_js": true, "75_js": true, "50_js": true,
		"joint_survivor_100": true, "joint_survivor_75": true, "joint_survivor_50": true,
	}

	if jsOptions[paymentOption] {
		result.SurvivorRecordCreated = true
		result.BenefitTerminated = false
	} else {
		// Maximum or non-J&S — benefit ceases at death
		result.SurvivorRecordCreated = false
		result.BenefitTerminated = true
	}

	return result
}

// ProcessDeathComplete computes the full death processing package with audit trail.
// Combines all individual rule evaluations into a comprehensive summary.
func ProcessDeathComplete(
	memberID string,
	memberStatus string,
	deathDate time.Time,
	notificationDate time.Time,
	paymentOption string,
	memberBenefit float64,
	jsPercentage float64,
	survivorName string,
	deathBenefitLumpSum float64,
	totalInstallments int,
	retirementDate time.Time,
	payments []PaymentRecord,
	deathCertVerified bool,
) DeathSurvivorSummary {
	summary := DeathSurvivorSummary{
		MemberID: memberID,
	}

	var trace []TraceStep
	step := 1

	// Step 1: Death notification
	notifyInput := DeathNotificationInput{
		MemberID:         memberID,
		MemberStatus:     memberStatus,
		DeathDate:        deathDate,
		NotificationDate: notificationDate,
		PaymentOption:    paymentOption,
	}
	notifyResult := DeathNotificationProcess(notifyInput)
	summary.Notification = &notifyResult
	trace = append(trace, TraceStep{
		StepNumber:  step,
		RuleID:      "RULE-DEATH-NOTIFY",
		RuleName:    "Death Notification",
		Description: "Process death notification and suspend benefits",
		Inputs:      fmt.Sprintf("member=%s, status=%s, death=%s", memberID, memberStatus, deathDate.Format("2006-01-02")),
		Result:      fmt.Sprintf("Suspended: %v, Certificate needed: %v", notifyResult.BenefitSuspended, notifyResult.CertificateNeeded),
		Source:      "DERP Operating Procedures",
	})
	step++

	// Step 2: Overpayment detection (retired members only)
	if memberStatus == "retired" && len(payments) > 0 {
		overpayResult := OverpaymentDetection(deathDate, payments)
		summary.Overpayment = &overpayResult
		trace = append(trace, TraceStep{
			StepNumber:  step,
			RuleID:      "RULE-OVERPAY-DETECT",
			RuleName:    "Overpayment Detection",
			Description: "Check for payments deposited after date of death",
			Inputs:      fmt.Sprintf("death=%s, payments=%d", deathDate.Format("2006-01-02"), len(payments)),
			Result:      fmt.Sprintf("Overpayments: %d, total $%.2f", overpayResult.OverpaymentCount, overpayResult.OverpaymentTotal),
			Source:      "DERP Operating Procedures",
		})
		step++
	}

	// Step 3: Survivor benefit (J&S retired members)
	if memberStatus == "retired" && jsPercentage > 0 {
		jsInput := SurvivorJSInput{
			MemberBenefit: memberBenefit,
			JSPercentage:  jsPercentage,
			SurvivorName:  survivorName,
			DeathDate:     deathDate,
		}
		jsResult := SurvivorJSBenefit(jsInput)
		summary.SurvivorJS = &jsResult
		trace = append(trace, TraceStep{
			StepNumber:  step,
			RuleID:      "RULE-SURVIVOR-JS",
			RuleName:    "J&S Survivor Benefit",
			Description: "Calculate survivor continuation benefit",
			Inputs:      fmt.Sprintf("benefit=$%.2f, js=%.0f%%", memberBenefit, jsPercentage*100),
			Result:      fmt.Sprintf("Survivor benefit: $%.2f to %s", jsResult.SurvivorBenefit, survivorName),
			Source:      "RMC §18-410(a)(1)",
		})
		step++
	}

	// Step 4: Death benefit installments (retired members with installment election)
	if memberStatus == "retired" && totalInstallments > 0 && deathBenefitLumpSum > 0 {
		instInput := InstallmentInput{
			DeathBenefitLumpSum: deathBenefitLumpSum,
			TotalInstallments:   totalInstallments,
			RetirementDate:      retirementDate,
			DeathDate:           deathDate,
		}
		instResult := DeathBenefitInstallments(instInput)
		summary.Installments = &instResult
		trace = append(trace, TraceStep{
			StepNumber:  step,
			RuleID:      "RULE-DEATH-INSTALLMENTS",
			RuleName:    "Death Benefit Installments",
			Description: "Calculate remaining death benefit installments",
			Inputs:      fmt.Sprintf("lump=$%.2f, elect=%d, retired=%s, death=%s",
				deathBenefitLumpSum, totalInstallments,
				retirementDate.Format("2006-01-02"), deathDate.Format("2006-01-02")),
			Result: fmt.Sprintf("Paid: %d, remaining: %d, total remaining: $%.2f",
				instResult.InstallmentsPaid, instResult.InstallmentsRemaining, instResult.RemainingTotal),
			Source: "RMC §18-411(d)",
		})
		step++
	}

	// Step 5: Record transition
	transResult := RecordTransition(memberStatus, deathCertVerified, paymentOption)
	summary.Transition = &transResult
	trace = append(trace, TraceStep{
		StepNumber:  step,
		RuleID:      "RULE-DEATH-RECORD-TRANSITION",
		RuleName:    "Record Transition",
		Description: "Determine member status transitions and survivor record creation",
		Inputs:      fmt.Sprintf("status=%s, cert_verified=%v, option=%s", memberStatus, deathCertVerified, paymentOption),
		Result:      fmt.Sprintf("Sequence: %v, survivor_created: %v", transResult.StatusSequence, transResult.SurvivorRecordCreated),
		Source:      "DERP Operating Procedures",
	})

	summary.Trace = trace
	return summary
}

// --- Helper functions ---

// firstOfMonthFollowing returns the first day of the month following the given date.
func firstOfMonthFollowing(d time.Time) time.Time {
	year, month, _ := d.Date()
	if month == 12 {
		return time.Date(year+1, 1, 1, 0, 0, 0, 0, time.UTC)
	}
	return time.Date(year, month+1, 1, 0, 0, 0, 0, time.UTC)
}

// monthsBetween counts complete months from start to end (inclusive of start month).
// For death benefit installments: retirement date is month 1, count through death month.
func monthsBetween(start, end time.Time) int {
	startY, startM, _ := start.Date()
	endY, endM, _ := end.Date()

	months := (endY-startY)*12 + int(endM) - int(startM)
	// The retirement month itself is a payment month, so add 1
	// Example: retired Jan 2024, death Mar 2026 = Jan24..Mar26 = 27 months
	if months < 0 {
		return 0
	}
	return months + 1 // +1 because retirement month is first installment
}

// bankersRound implements banker's rounding (round half to even).
// ASSUMPTION: [Q-CALC-01] Using banker's rounding. DERP's actual method unconfirmed.
func bankersRound(val float64, places int) float64 {
	pow := math.Pow(10, float64(places))
	shifted := val * pow
	rounded := math.RoundToEven(shifted)
	return rounded / pow
}
