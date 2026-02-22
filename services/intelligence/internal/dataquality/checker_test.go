package dataquality

import (
	"testing"
	"time"
)

func timePtr(t time.Time) *time.Time { return &t }

func date(y int, m time.Month, d int) time.Time {
	return time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
}

// --- Contradictory Status ---

func TestCheckContradictoryStatus_ActiveWithTermDate(t *testing.T) {
	findings := CheckContradictoryStatus([]MemberRecord{
		{MemberID: "M001", StatusCode: "A", TermDate: timePtr(date(2025, 6, 15))},
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityCritical {
		t.Errorf("expected critical, got %s", findings[0].Severity)
	}
	if findings[0].Category != CategoryStructural {
		t.Errorf("expected structural, got %s", findings[0].Category)
	}
}

func TestCheckContradictoryStatus_CleanMembers(t *testing.T) {
	findings := CheckContradictoryStatus([]MemberRecord{
		{MemberID: "M001", StatusCode: "A", TermDate: nil},
		{MemberID: "M002", StatusCode: "T", TermDate: timePtr(date(2024, 12, 31))},
		{MemberID: "M003", StatusCode: "R", TermDate: timePtr(date(2023, 3, 15))},
	})
	if len(findings) != 0 {
		t.Fatalf("expected 0 findings for clean members, got %d", len(findings))
	}
}

func TestCheckContradictoryStatus_TerminatedNoTermDate(t *testing.T) {
	findings := CheckContradictoryStatus([]MemberRecord{
		{MemberID: "M004", StatusCode: "T", TermDate: nil},
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityWarning {
		t.Errorf("expected warning, got %s", findings[0].Severity)
	}
}

func TestCheckContradictoryStatus_BatchMixed(t *testing.T) {
	findings := CheckContradictoryStatus([]MemberRecord{
		{MemberID: "M010", StatusCode: "A", TermDate: nil},                        // clean
		{MemberID: "M011", StatusCode: "A", TermDate: timePtr(date(2025, 1, 1))},  // critical
		{MemberID: "M012", StatusCode: "T", TermDate: timePtr(date(2024, 6, 30))}, // clean
		{MemberID: "M013", StatusCode: "T", TermDate: nil},                         // warning
		{MemberID: "M014", StatusCode: "A", TermDate: timePtr(date(2025, 8, 20))}, // critical
	})
	if len(findings) != 3 {
		t.Fatalf("expected 3 findings, got %d", len(findings))
	}
}

// --- Beneficiary Allocation ---

func TestCheckBeneficiaryAllocation_Valid100(t *testing.T) {
	findings := CheckBeneficiaryAllocation([]BeneficiaryAllocation{
		{MemberID: "M001", Beneficiaries: []BeneficiaryRecord{
			{Name: "Spouse", AllocationPct: 60.0},
			{Name: "Child", AllocationPct: 40.0},
		}},
	})
	if len(findings) != 0 {
		t.Fatalf("expected 0 findings for 100%%, got %d", len(findings))
	}
}

func TestCheckBeneficiaryAllocation_Under100(t *testing.T) {
	findings := CheckBeneficiaryAllocation([]BeneficiaryAllocation{
		{MemberID: "M001", Beneficiaries: []BeneficiaryRecord{
			{Name: "Spouse", AllocationPct: 50.0},
			{Name: "Child", AllocationPct: 25.0},
		}},
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityCritical {
		t.Errorf("expected critical, got %s", findings[0].Severity)
	}
	if findings[0].Details["total_allocation"] != "75.00" {
		t.Errorf("expected total 75.00, got %s", findings[0].Details["total_allocation"])
	}
}

func TestCheckBeneficiaryAllocation_NoBeneficiaries(t *testing.T) {
	findings := CheckBeneficiaryAllocation([]BeneficiaryAllocation{
		{MemberID: "M001", Beneficiaries: []BeneficiaryRecord{}},
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityWarning {
		t.Errorf("expected warning, got %s", findings[0].Severity)
	}
}

func TestCheckBeneficiaryAllocation_FloatingPointEdge(t *testing.T) {
	findings := CheckBeneficiaryAllocation([]BeneficiaryAllocation{
		{MemberID: "M001", Beneficiaries: []BeneficiaryRecord{
			{Name: "A", AllocationPct: 33.33},
			{Name: "B", AllocationPct: 33.33},
			{Name: "C", AllocationPct: 33.34},
		}},
	})
	if len(findings) != 0 {
		t.Fatalf("expected 0 findings for 33.33+33.33+33.34, got %d", len(findings))
	}
}

// --- Contribution Balance ---

func TestCheckContributionBalance_Match(t *testing.T) {
	findings := CheckContributionBalance([]ContributionRecord{
		{MemberID: "M001", StoredBalance: 45678.90, ComputedBalance: 45678.90},
	})
	if len(findings) != 0 {
		t.Fatalf("expected 0 findings for match, got %d", len(findings))
	}
}

func TestCheckContributionBalance_SmallRounding(t *testing.T) {
	findings := CheckContributionBalance([]ContributionRecord{
		{MemberID: "M001", StoredBalance: 45678.90, ComputedBalance: 45679.12}, // $0.22
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityInfo {
		t.Errorf("expected info, got %s", findings[0].Severity)
	}
}

func TestCheckContributionBalance_Moderate(t *testing.T) {
	findings := CheckContributionBalance([]ContributionRecord{
		{MemberID: "M001", StoredBalance: 45678.90, ComputedBalance: 45700.50}, // $21.60
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityWarning {
		t.Errorf("expected warning, got %s", findings[0].Severity)
	}
}

func TestCheckContributionBalance_Large(t *testing.T) {
	findings := CheckContributionBalance([]ContributionRecord{
		{MemberID: "M001", StoredBalance: 45678.90, ComputedBalance: 45800.00}, // $121.10
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityCritical {
		t.Errorf("expected critical, got %s", findings[0].Severity)
	}
}

// --- Benefit Calculation Verification ---

func TestCheckBenefitCalculation_Match(t *testing.T) {
	findings := CheckBenefitCalculation([]BenefitVerificationRecord{
		{MemberID: "M001", StoredBenefit: 3456.78, RecalculatedBenefit: 3456.78, RetirementType: "normal", Tier: 1},
	})
	if len(findings) != 0 {
		t.Fatalf("expected 0 findings for match, got %d", len(findings))
	}
}

func TestCheckBenefitCalculation_SmallDiscrepancy(t *testing.T) {
	findings := CheckBenefitCalculation([]BenefitVerificationRecord{
		{MemberID: "M001", StoredBenefit: 3456.78, RecalculatedBenefit: 3456.12, RetirementType: "normal", Tier: 1}, // $0.66
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityInfo {
		t.Errorf("expected info, got %s", findings[0].Severity)
	}
}

func TestCheckBenefitCalculation_Large(t *testing.T) {
	findings := CheckBenefitCalculation([]BenefitVerificationRecord{
		{MemberID: "M001", StoredBenefit: 3456.78, RecalculatedBenefit: 3500.00, RetirementType: "normal", Tier: 1}, // $43.22
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	if findings[0].Severity != SeverityCritical {
		t.Errorf("expected critical, got %s", findings[0].Severity)
	}
}

func TestCheckBenefitCalculation_IncludesDetails(t *testing.T) {
	findings := CheckBenefitCalculation([]BenefitVerificationRecord{
		{MemberID: "M001", StoredBenefit: 3456.78, RecalculatedBenefit: 3500.00, RetirementType: "early", Tier: 2},
	})
	if len(findings) != 1 {
		t.Fatalf("expected 1 finding, got %d", len(findings))
	}
	f := findings[0]
	if f.Details["retirement_type"] != "early" {
		t.Errorf("expected retirement_type 'early', got %s", f.Details["retirement_type"])
	}
	if f.Details["tier"] != "2" {
		t.Errorf("expected tier '2', got %s", f.Details["tier"])
	}
}

// --- RunAllChecks Integration ---

func TestRunAllChecks_CombinesFindings(t *testing.T) {
	report := RunAllChecks(CheckInput{
		Members: []MemberRecord{
			{MemberID: "M001", StatusCode: "A", TermDate: timePtr(date(2025, 6, 15))},
		},
		BeneficiaryAllocations: []BeneficiaryAllocation{
			{MemberID: "M002", Beneficiaries: []BeneficiaryRecord{
				{Name: "Spouse", AllocationPct: 80.0},
			}},
		},
		Contributions: []ContributionRecord{
			{MemberID: "M003", StoredBalance: 10000.00, ComputedBalance: 10000.00},
		},
		BenefitVerifications: []BenefitVerificationRecord{
			{MemberID: "M004", StoredBenefit: 3000.00, RecalculatedBenefit: 3100.00, RetirementType: "normal", Tier: 1},
		},
	})

	if report.TotalFindings < 3 {
		t.Errorf("expected at least 3 findings, got %d", report.TotalFindings)
	}
	if report.CriticalCount < 2 {
		t.Errorf("expected at least 2 critical, got %d", report.CriticalCount)
	}
	if report.CheckedAt.IsZero() {
		t.Error("expected CheckedAt to be set")
	}
}

func TestRunAllChecks_EmptyInput(t *testing.T) {
	report := RunAllChecks(CheckInput{})
	if report.TotalFindings != 0 {
		t.Errorf("expected 0 findings for empty input, got %d", report.TotalFindings)
	}
}
