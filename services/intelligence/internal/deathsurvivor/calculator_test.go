// Package deathsurvivor — tests for the death and survivor benefit calculation engine.
//
// Tests all 8 rules from death-survivor.yaml:
//   RULE-DEATH-NOTIFY, RULE-OVERPAY-DETECT, RULE-SURVIVOR-JS,
//   RULE-DEATH-INSTALLMENTS, RULE-MAXIMUM-DEATH, RULE-POPUP,
//   RULE-ACTIVE-DEATH, RULE-DEATH-RECORD-TRANSITION
//
// TOUCHPOINTS:
//   Upstream: rules/tables.go (VestingYears), death-survivor.yaml (rule definitions)
//   Downstream: intelligence API death_handlers.go
//   Shared: bankersRound, firstOfMonthFollowing, monthsBetween
package deathsurvivor

import (
	"math"
	"testing"
	"time"
)

func date(y, m, d int) time.Time {
	return time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
}

func assertClose(t *testing.T, got, want float64, label string) {
	t.Helper()
	if math.Abs(got-want) > 0.01 {
		t.Errorf("%s: got %.2f, want %.2f", label, got, want)
	}
}

// ─── RULE-DEATH-NOTIFY Tests ─────────────────────────────────────────────

func TestDeathNotification_RetiredMember(t *testing.T) {
	result := DeathNotificationProcess(DeathNotificationInput{
		MemberID:         "10009",
		MemberStatus:     "retired",
		DeathDate:        date(2026, 3, 15),
		NotificationDate: date(2026, 3, 16),
		PaymentOption:    "75_js",
	})

	if !result.BenefitSuspended {
		t.Error("expected benefit to be suspended")
	}
	if !result.CertificateNeeded {
		t.Error("expected certificate to be required")
	}
	if result.StatusTransition != "RETIRED → SUSPENDED" {
		t.Errorf("expected RETIRED → SUSPENDED, got %s", result.StatusTransition)
	}
}

func TestDeathNotification_ActiveMember(t *testing.T) {
	result := DeathNotificationProcess(DeathNotificationInput{
		MemberID:     "10010",
		MemberStatus: "active",
		DeathDate:    date(2026, 2, 10),
	})

	if !result.BenefitSuspended {
		t.Error("expected benefit suspended for active member")
	}
	if result.StatusTransition != "ACTIVE → SUSPENDED" {
		t.Errorf("expected ACTIVE → SUSPENDED, got %s", result.StatusTransition)
	}
}

// ─── RULE-OVERPAY-DETECT Tests ───────────────────────────────────────────

func TestOverpayment_ThompsonNoOverpayment(t *testing.T) {
	// Thompson case: March payment deposited March 1, death March 15 — no overpayment
	payments := []PaymentRecord{
		{DepositDate: date(2026, 1, 1), Amount: 3248.00},
		{DepositDate: date(2026, 2, 1), Amount: 3248.00},
		{DepositDate: date(2026, 3, 1), Amount: 3248.00},
	}

	result := OverpaymentDetection(date(2026, 3, 15), payments)

	if result.OverpaymentCount != 0 {
		t.Errorf("Thompson: expected 0 overpayments, got %d", result.OverpaymentCount)
	}
	assertClose(t, result.OverpaymentTotal, 0.00, "Thompson overpayment total")
	if result.ValidPayments != 3 {
		t.Errorf("Thompson: expected 3 valid payments, got %d", result.ValidPayments)
	}
}

func TestOverpayment_DelayedNotification(t *testing.T) {
	// Death Jan 10, notification March 20 — Feb and March payments are overpayments
	payments := []PaymentRecord{
		{DepositDate: date(2026, 1, 1), Amount: 3248.00},
		{DepositDate: date(2026, 2, 1), Amount: 3248.00},
		{DepositDate: date(2026, 3, 1), Amount: 3248.00},
	}

	result := OverpaymentDetection(date(2026, 1, 10), payments)

	if result.OverpaymentCount != 2 {
		t.Errorf("delayed: expected 2 overpayments, got %d", result.OverpaymentCount)
	}
	assertClose(t, result.OverpaymentTotal, 6496.00, "delayed overpayment total")
	if result.ValidPayments != 1 {
		t.Errorf("delayed: expected 1 valid payment, got %d", result.ValidPayments)
	}
}

func TestOverpayment_DeathOnPaymentDay(t *testing.T) {
	// Death on March 1 — same day deposit is valid (payment issued before death)
	payments := []PaymentRecord{
		{DepositDate: date(2026, 3, 1), Amount: 3248.00},
	}

	result := OverpaymentDetection(date(2026, 3, 1), payments)

	if result.OverpaymentCount != 0 {
		t.Errorf("same-day: expected 0 overpayments, got %d", result.OverpaymentCount)
	}
	assertClose(t, result.OverpaymentTotal, 0.00, "same-day overpayment total")
}

func TestOverpayment_NoPayments(t *testing.T) {
	result := OverpaymentDetection(date(2026, 3, 15), nil)
	if result.OverpaymentCount != 0 {
		t.Error("expected 0 overpayments for empty payment list")
	}
}

// ─── RULE-SURVIVOR-JS Tests ─────────────────────────────────────────────

func TestSurvivorJS_Thompson75Percent(t *testing.T) {
	// Thompson: 75% J&S, benefit $3,248.00, survivor = $2,436.00
	result := SurvivorJSBenefit(SurvivorJSInput{
		MemberBenefit: 3248.00,
		JSPercentage:  0.75,
		SurvivorName:  "William Thompson",
		DeathDate:     date(2026, 3, 15),
	})

	assertClose(t, result.SurvivorBenefit, 2436.00, "Thompson survivor benefit")
	if result.SurvivorName != "William Thompson" {
		t.Errorf("expected William Thompson, got %s", result.SurvivorName)
	}
	if result.EffectiveDate != "2026-04-01" {
		t.Errorf("expected effective 2026-04-01, got %s", result.EffectiveDate)
	}
	if result.Duration != "Survivor's lifetime" {
		t.Errorf("expected lifetime duration, got %s", result.Duration)
	}
}

func TestSurvivorJS_100Percent(t *testing.T) {
	result := SurvivorJSBenefit(SurvivorJSInput{
		MemberBenefit: 5414.15,
		JSPercentage:  1.00,
		SurvivorName:  "Test Survivor",
		DeathDate:     date(2026, 6, 15),
	})

	assertClose(t, result.SurvivorBenefit, 5414.15, "100% JS survivor")
}

func TestSurvivorJS_50Percent(t *testing.T) {
	result := SurvivorJSBenefit(SurvivorJSInput{
		MemberBenefit: 5781.21,
		JSPercentage:  0.50,
		SurvivorName:  "Test Survivor",
		DeathDate:     date(2026, 6, 15),
	})

	// 5781.21 * 0.50 = 2890.605. Banker's rounding: .605 → .60 (0 is even).
	// [Q-CALC-01] Using banker's rounding — DERP may use standard rounding (2890.61).
	assertClose(t, result.SurvivorBenefit, 2890.60, "50% JS survivor")
}

func TestSurvivorJS_EffectiveDateDecember(t *testing.T) {
	// Death in December — effective date should be January of next year
	result := SurvivorJSBenefit(SurvivorJSInput{
		MemberBenefit: 3000.00,
		JSPercentage:  0.75,
		SurvivorName:  "Test",
		DeathDate:     date(2026, 12, 20),
	})

	if result.EffectiveDate != "2027-01-01" {
		t.Errorf("expected 2027-01-01, got %s", result.EffectiveDate)
	}
}

// ─── RULE-DEATH-INSTALLMENTS Tests ───────────────────────────────────────

func TestInstallments_Thompson100Elected27Paid(t *testing.T) {
	// Thompson: $5,000 / 100 = $50, retired Jan 2024, death Mar 2026 = 27 paid
	result := DeathBenefitInstallments(InstallmentInput{
		DeathBenefitLumpSum: 5000.00,
		TotalInstallments:   100,
		RetirementDate:      date(2024, 1, 1),
		DeathDate:           date(2026, 3, 15),
	})

	assertClose(t, result.InstallmentAmount, 50.00, "installment amount")
	if result.InstallmentsPaid != 27 {
		t.Errorf("expected 27 paid, got %d", result.InstallmentsPaid)
	}
	if result.InstallmentsRemaining != 73 {
		t.Errorf("expected 73 remaining, got %d", result.InstallmentsRemaining)
	}
	assertClose(t, result.RemainingTotal, 3650.00, "remaining total")
}

func TestInstallments_50AllPaid(t *testing.T) {
	// 50 installments, retired Jan 2020, death March 2026 = 75 months > 50
	result := DeathBenefitInstallments(InstallmentInput{
		DeathBenefitLumpSum: 5000.00,
		TotalInstallments:   50,
		RetirementDate:      date(2020, 1, 1),
		DeathDate:           date(2026, 3, 15),
	})

	assertClose(t, result.InstallmentAmount, 100.00, "installment amount")
	if result.InstallmentsPaid != 50 {
		t.Errorf("expected 50 paid (capped), got %d", result.InstallmentsPaid)
	}
	if result.InstallmentsRemaining != 0 {
		t.Errorf("expected 0 remaining, got %d", result.InstallmentsRemaining)
	}
	assertClose(t, result.RemainingTotal, 0.00, "remaining total")
}

func TestInstallments_EarlyRetirementReduced(t *testing.T) {
	// Early retirement: $2,500 / 100 = $25, retired Jun 2024, death Mar 2026 = 21 paid
	result := DeathBenefitInstallments(InstallmentInput{
		DeathBenefitLumpSum: 2500.00,
		TotalInstallments:   100,
		RetirementDate:      date(2024, 6, 1),
		DeathDate:           date(2026, 3, 15),
	})

	assertClose(t, result.InstallmentAmount, 25.00, "installment amount")
	// Jun 2024 to Mar 2026: Jun=1, Jul=2, ..., Dec2024=7, Jan2025=8, ..., Dec2025=19, Jan2026=20, Feb=21, Mar=22
	// Wait — let me recalculate: (2026-2024)*12 + (3-6) + 1 = 24 - 3 + 1 = 22
	// Actually: Jun 2024 through Mar 2026 inclusive.
	// Months: Jun(1), Jul(2), Aug(3), Sep(4), Oct(5), Nov(6), Dec(7),
	//         Jan25(8), Feb(9), Mar(10), Apr(11), May(12), Jun(13), Jul(14), Aug(15), Sep(16), Oct(17), Nov(18), Dec(19),
	//         Jan26(20), Feb(21), Mar(22)
	// = 22 months. Let me verify with the formula: (2026-2024)*12 + (3-6) + 1 = 24-3+1 = 22
	if result.InstallmentsPaid != 22 {
		t.Errorf("expected 22 paid, got %d", result.InstallmentsPaid)
	}
	if result.InstallmentsRemaining != 78 {
		t.Errorf("expected 78 remaining, got %d", result.InstallmentsRemaining)
	}
	assertClose(t, result.RemainingTotal, 1950.00, "remaining total")
}

// ─── RULE-MAXIMUM-DEATH Tests (implicit — no survivor benefit) ──────────

func TestMaximumDeath_NoSurvivorBenefit(t *testing.T) {
	// Maximum election: verify that ProcessDeathComplete produces no survivor benefit
	summary := ProcessDeathComplete(
		"10099", "retired",
		date(2026, 3, 15), date(2026, 3, 16),
		"maximum",
		6117.68, 0, "", // No J&S
		5000.00, 100,
		date(2024, 1, 1),
		nil, true,
	)

	if summary.SurvivorJS != nil {
		t.Error("maximum election should produce no survivor JS benefit")
	}
	if !summary.Transition.BenefitTerminated {
		t.Error("maximum election should terminate benefit at death")
	}
	if summary.Transition.SurvivorRecordCreated {
		t.Error("maximum election should NOT create survivor record")
	}
}

// ─── RULE-POPUP Tests ────────────────────────────────────────────────────

func TestPopUp_BeneficiaryPredeceasesMember(t *testing.T) {
	result := PopUpProvision(PopUpInput{
		CurrentJSBenefit:     3248.00,
		MaximumBenefit:       3750.00,
		BeneficiaryDeathDate: date(2025, 6, 15),
	})

	assertClose(t, result.NewBenefit, 3750.00, "pop-up new benefit")
	assertClose(t, result.IncreaseAmount, 502.00, "pop-up increase")
	if result.EffectiveDate != "2025-07-01" {
		t.Errorf("expected effective 2025-07-01, got %s", result.EffectiveDate)
	}
	if result.NewBeneficiaryOK {
		t.Error("new beneficiary should NOT be allowed after pop-up")
	}
	if result.Retroactive {
		t.Error("pop-up should NOT be retroactive")
	}
}

func TestPopUp_ProspectiveOnly(t *testing.T) {
	result := PopUpProvision(PopUpInput{
		CurrentJSBenefit:     5597.68,
		MaximumBenefit:       6117.68,
		BeneficiaryDeathDate: date(2030, 6, 15),
	})

	assertClose(t, result.NewBenefit, 6117.68, "pop-up benefit")
	if result.EffectiveDate != "2030-07-01" {
		t.Errorf("expected 2030-07-01, got %s", result.EffectiveDate)
	}
	if result.Retroactive {
		t.Error("should be prospective only")
	}
}

// ─── RULE-ACTIVE-DEATH Tests ─────────────────────────────────────────────

func TestActiveDeath_NonVestedRefund(t *testing.T) {
	result := ActiveMemberDeath(ActiveMemberDeathInput{
		MemberID:            "10010",
		ServiceYears:        3.00,
		AccumulatedContribs: 45230.00,
		AccruedInterest:     3214.50,
		Tier:                3,
		AgeAtDeath:          33,
	})

	if result.BenefitType != "contribution_refund" {
		t.Errorf("expected contribution_refund, got %s", result.BenefitType)
	}
	if result.Vested {
		t.Error("3 years should NOT be vested")
	}
	assertClose(t, result.RefundAmount, 48444.50, "refund amount")
	if result.SurvivorAnnuityAvail {
		t.Error("survivor annuity should NOT be available for non-vested")
	}
}

func TestActiveDeath_VestedSurvivorAnnuity(t *testing.T) {
	result := ActiveMemberDeath(ActiveMemberDeathInput{
		MemberID:            "10011",
		ServiceYears:        12.00,
		AccumulatedContribs: 125000.00,
		AccruedInterest:     8500.00,
		Tier:                2,
		AgeAtDeath:          45,
	})

	if result.BenefitType != "survivor_annuity" {
		t.Errorf("expected survivor_annuity, got %s", result.BenefitType)
	}
	if !result.Vested {
		t.Error("12 years should be vested")
	}
	if !result.SurvivorAnnuityAvail {
		t.Error("survivor annuity should be available for vested member")
	}
}

func TestActiveDeath_BoundaryExactly5Years(t *testing.T) {
	// Exactly 5 years = vested
	result := ActiveMemberDeath(ActiveMemberDeathInput{
		ServiceYears:        5.00,
		AccumulatedContribs: 30000.00,
		AccruedInterest:     1500.00,
	})
	if !result.Vested {
		t.Error("exactly 5 years should be vested")
	}
	if result.BenefitType != "survivor_annuity" {
		t.Errorf("expected survivor_annuity at 5 years, got %s", result.BenefitType)
	}
}

func TestActiveDeath_BoundaryJustUnder5Years(t *testing.T) {
	// 4.99 years = NOT vested
	result := ActiveMemberDeath(ActiveMemberDeathInput{
		ServiceYears:        4.99,
		AccumulatedContribs: 29000.00,
		AccruedInterest:     1400.00,
	})
	if result.Vested {
		t.Error("4.99 years should NOT be vested")
	}
	if result.BenefitType != "contribution_refund" {
		t.Errorf("expected contribution_refund at 4.99 years, got %s", result.BenefitType)
	}
}

// ─── RULE-DEATH-RECORD-TRANSITION Tests ──────────────────────────────────

func TestTransition_RetiredJSWithCert(t *testing.T) {
	result := RecordTransition("retired", true, "75_js")

	expected := []string{"RETIRED", "SUSPENDED", "DECEASED"}
	if len(result.StatusSequence) != 3 {
		t.Errorf("expected 3 statuses, got %d: %v", len(result.StatusSequence), result.StatusSequence)
	}
	for i, s := range expected {
		if i < len(result.StatusSequence) && result.StatusSequence[i] != s {
			t.Errorf("status[%d]: expected %s, got %s", i, s, result.StatusSequence[i])
		}
	}
	if !result.SurvivorRecordCreated {
		t.Error("J&S should create survivor record")
	}
	if result.BenefitTerminated {
		t.Error("J&S should NOT terminate benefit (continues to survivor)")
	}
}

func TestTransition_RetiredMaximumWithCert(t *testing.T) {
	result := RecordTransition("retired", true, "maximum")

	if result.SurvivorRecordCreated {
		t.Error("maximum should NOT create survivor record")
	}
	if !result.BenefitTerminated {
		t.Error("maximum should terminate benefit at death")
	}
}

func TestTransition_NoCertYet(t *testing.T) {
	result := RecordTransition("retired", false, "75_js")

	// Without certificate, should not reach DECEASED
	if len(result.StatusSequence) != 2 {
		t.Errorf("expected 2 statuses without cert, got %d: %v", len(result.StatusSequence), result.StatusSequence)
	}
	if result.StatusSequence[1] != "SUSPENDED" {
		t.Errorf("expected SUSPENDED, got %s", result.StatusSequence[1])
	}
}

func TestTransition_ActiveMember(t *testing.T) {
	result := RecordTransition("active", true, "")

	if result.StatusSequence[0] != "ACTIVE" {
		t.Errorf("expected ACTIVE initial, got %s", result.StatusSequence[0])
	}
	if result.StatusSequence[1] != "SUSPENDED" {
		t.Errorf("expected SUSPENDED, got %s", result.StatusSequence[1])
	}
}

// ─── Full Thompson Case (Case 9) Integration Test ────────────────────────

func TestThompsonCase9_Complete(t *testing.T) {
	payments := []PaymentRecord{
		{DepositDate: date(2026, 1, 1), Amount: 3248.00},
		{DepositDate: date(2026, 2, 1), Amount: 3248.00},
		{DepositDate: date(2026, 3, 1), Amount: 3248.00},
	}

	summary := ProcessDeathComplete(
		"10009", "retired",
		date(2026, 3, 15),    // death date
		date(2026, 3, 16),    // notification date
		"75_js",              // payment option
		3248.00,              // member monthly benefit
		0.75,                 // J&S percentage
		"William Thompson",   // survivor name
		5000.00,              // death benefit lump sum
		100,                  // total installments
		date(2024, 1, 1),     // retirement date
		payments,
		true,                 // death cert verified
	)

	// Verify notification
	if summary.Notification == nil {
		t.Fatal("notification result missing")
	}
	if !summary.Notification.BenefitSuspended {
		t.Error("benefit should be suspended")
	}

	// Verify no overpayment
	if summary.Overpayment == nil {
		t.Fatal("overpayment result missing")
	}
	if summary.Overpayment.OverpaymentCount != 0 {
		t.Errorf("Thompson should have 0 overpayments, got %d", summary.Overpayment.OverpaymentCount)
	}

	// Verify survivor benefit: $2,436.00
	if summary.SurvivorJS == nil {
		t.Fatal("survivor JS result missing")
	}
	assertClose(t, summary.SurvivorJS.SurvivorBenefit, 2436.00, "Thompson survivor benefit")
	if summary.SurvivorJS.SurvivorName != "William Thompson" {
		t.Errorf("expected William Thompson, got %s", summary.SurvivorJS.SurvivorName)
	}

	// Verify installments: 27 paid, 73 remaining, $3,650.00
	if summary.Installments == nil {
		t.Fatal("installment result missing")
	}
	if summary.Installments.InstallmentsPaid != 27 {
		t.Errorf("expected 27 installments paid, got %d", summary.Installments.InstallmentsPaid)
	}
	if summary.Installments.InstallmentsRemaining != 73 {
		t.Errorf("expected 73 remaining, got %d", summary.Installments.InstallmentsRemaining)
	}
	assertClose(t, summary.Installments.RemainingTotal, 3650.00, "remaining installment total")

	// Verify transition
	if summary.Transition == nil {
		t.Fatal("transition result missing")
	}
	if !summary.Transition.SurvivorRecordCreated {
		t.Error("should create survivor record for 75% J&S")
	}

	// Verify audit trace
	if len(summary.Trace) < 4 {
		t.Errorf("expected at least 4 trace steps, got %d", len(summary.Trace))
	}
}

// ─── Helper function tests ───────────────────────────────────────────────

func TestMonthsBetween(t *testing.T) {
	tests := []struct {
		start time.Time
		end   time.Time
		want  int
	}{
		{date(2024, 1, 1), date(2026, 3, 15), 27},  // Thompson case
		{date(2020, 1, 1), date(2026, 3, 15), 75},   // Well past 50 installments
		{date(2024, 6, 1), date(2026, 3, 15), 22},   // Mid-year start
		{date(2026, 3, 1), date(2026, 3, 15), 1},    // Same month
	}

	for _, tt := range tests {
		got := monthsBetween(tt.start, tt.end)
		if got != tt.want {
			t.Errorf("monthsBetween(%s, %s): got %d, want %d",
				tt.start.Format("2006-01"), tt.end.Format("2006-01"), got, tt.want)
		}
	}
}

func TestFirstOfMonthFollowing(t *testing.T) {
	tests := []struct {
		input time.Time
		want  time.Time
	}{
		{date(2026, 3, 15), date(2026, 4, 1)},
		{date(2026, 12, 20), date(2027, 1, 1)},
		{date(2026, 1, 1), date(2026, 2, 1)},
		{date(2026, 1, 31), date(2026, 2, 1)},
	}

	for _, tt := range tests {
		got := firstOfMonthFollowing(tt.input)
		if !got.Equal(tt.want) {
			t.Errorf("firstOfMonthFollowing(%s): got %s, want %s",
				tt.input.Format("2006-01-02"), got.Format("2006-01-02"), tt.want.Format("2006-01-02"))
		}
	}
}
