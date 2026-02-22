// Package dataquality provides data quality checks for member data.
// All findings are presented for human review — no auto-resolution (Governing Principle 2).
package dataquality

import (
	"fmt"
	"math"
	"time"
)

// Severity levels for data quality findings.
type Severity string

const (
	SeverityCritical Severity = "critical"
	SeverityWarning  Severity = "warning"
	SeverityInfo     Severity = "info"
)

// Category classifies the type of data quality issue.
type Category string

const (
	CategoryStructural  Category = "structural"
	CategoryCalculation Category = "calculation"
	CategoryBalance     Category = "balance"
)

// Finding represents a single data quality issue detected by the engine.
type Finding struct {
	ID                 string            `json:"id"`
	Category           Category          `json:"category"`
	Severity           Severity          `json:"severity"`
	MemberID           string            `json:"member_id"`
	Description        string            `json:"description"`
	Details            map[string]string `json:"details"`
	DetectedAt         time.Time         `json:"detected_at"`
	ProposedResolution string            `json:"proposed_resolution"`
}

// Report aggregates all findings from a data quality check run.
type Report struct {
	Findings      []Finding `json:"findings"`
	TotalFindings int       `json:"total_findings"`
	CriticalCount int       `json:"critical_count"`
	WarningCount  int       `json:"warning_count"`
	InfoCount     int       `json:"info_count"`
	CheckedAt     time.Time `json:"checked_at"`
}

// MemberRecord represents a member row for status checking.
type MemberRecord struct {
	MemberID   string
	StatusCode string
	TermDate   *time.Time
}

// BeneficiaryRecord represents a single beneficiary designation.
type BeneficiaryRecord struct {
	Name           string
	Relationship   string
	AllocationPct  float64
}

// BeneficiaryAllocation groups beneficiaries for a single member.
type BeneficiaryAllocation struct {
	MemberID      string
	Beneficiaries []BeneficiaryRecord
}

// ContributionRecord holds stored vs computed contribution balance.
type ContributionRecord struct {
	MemberID        string
	StoredBalance   float64
	ComputedBalance float64
}

// BenefitVerificationRecord holds stored vs recalculated benefit amounts.
type BenefitVerificationRecord struct {
	MemberID            string
	StoredBenefit       float64
	RecalculatedBenefit float64
	RetirementType      string
	Tier                int
}

// CheckInput aggregates all data needed for a full quality check.
type CheckInput struct {
	Members                []MemberRecord
	BeneficiaryAllocations []BeneficiaryAllocation
	Contributions          []ContributionRecord
	BenefitVerifications   []BenefitVerificationRecord
}

var findingSeq int

func newFinding(cat Category, sev Severity, memberID, desc, resolution string, details map[string]string) Finding {
	findingSeq++
	return Finding{
		ID:                 fmt.Sprintf("DQ-%06d", findingSeq),
		Category:           cat,
		Severity:           sev,
		MemberID:           memberID,
		Description:        desc,
		Details:            details,
		DetectedAt:         time.Now(),
		ProposedResolution: resolution,
	}
}

// CheckContradictoryStatus checks for members with contradictory status/termination data.
func CheckContradictoryStatus(members []MemberRecord) []Finding {
	var findings []Finding
	for _, m := range members {
		if m.StatusCode == "A" && m.TermDate != nil {
			findings = append(findings, newFinding(
				CategoryStructural, SeverityCritical, m.MemberID,
				fmt.Sprintf("Active member has termination date %s", m.TermDate.Format("2006-01-02")),
				"Verify member status. Either clear termination date or update status to terminated.",
				map[string]string{
					"status_code": m.StatusCode,
					"term_date":   m.TermDate.Format("2006-01-02"),
				},
			))
		} else if m.StatusCode == "T" && m.TermDate == nil {
			findings = append(findings, newFinding(
				CategoryStructural, SeverityWarning, m.MemberID,
				"Terminated member has no termination date",
				"Review employment history to determine and populate termination date.",
				map[string]string{
					"status_code": m.StatusCode,
				},
			))
		}
	}
	return findings
}

// CheckBeneficiaryAllocation checks that beneficiary allocations total 100%.
func CheckBeneficiaryAllocation(allocations []BeneficiaryAllocation) []Finding {
	var findings []Finding
	const tolerance = 0.01

	for _, alloc := range allocations {
		if len(alloc.Beneficiaries) == 0 {
			findings = append(findings, newFinding(
				CategoryStructural, SeverityWarning, alloc.MemberID,
				"No beneficiaries on file",
				"Proposed correction (awaiting review): Contact member to designate beneficiaries.",
				map[string]string{
					"beneficiary_count": "0",
				},
			))
			continue
		}

		var total float64
		for _, b := range alloc.Beneficiaries {
			total += b.AllocationPct
		}

		if math.Abs(total-100.0) > tolerance {
			findings = append(findings, newFinding(
				CategoryStructural, SeverityCritical, alloc.MemberID,
				fmt.Sprintf("Beneficiary allocations total %.2f%%, not 100%%", total),
				"Proposed correction (awaiting review): Contact member to update beneficiary allocations.",
				map[string]string{
					"total_allocation":  fmt.Sprintf("%.2f", total),
					"beneficiary_count": fmt.Sprintf("%d", len(alloc.Beneficiaries)),
				},
			))
		}
	}
	return findings
}

// CheckContributionBalance checks for contribution balance mismatches.
// Thresholds: <$0.50 = info, $0.50-$50 = warning, >$50 = critical.
func CheckContributionBalance(records []ContributionRecord) []Finding {
	var findings []Finding

	for _, r := range records {
		// Check for negative stored balance first
		if r.StoredBalance < 0 {
			findings = append(findings, newFinding(
				CategoryBalance, SeverityCritical, r.MemberID,
				fmt.Sprintf("Negative stored balance: $%.2f", r.StoredBalance),
				"Proposed correction (awaiting review): Investigate contribution history for errors.",
				map[string]string{
					"stored_balance":  fmt.Sprintf("%.2f", r.StoredBalance),
					"computed_balance": fmt.Sprintf("%.2f", r.ComputedBalance),
				},
			))
			continue
		}

		diff := math.Abs(r.StoredBalance - r.ComputedBalance)
		if diff < 0.005 {
			continue // within rounding tolerance
		}

		var sev Severity
		switch {
		case diff >= 50.0:
			sev = SeverityCritical
		case diff >= 0.50:
			sev = SeverityWarning
		default:
			sev = SeverityInfo
		}

		findings = append(findings, newFinding(
			CategoryBalance, sev, r.MemberID,
			fmt.Sprintf("Contribution balance mismatch: stored $%.2f vs computed $%.2f (diff $%.2f)", r.StoredBalance, r.ComputedBalance, diff),
			"Proposed correction (awaiting review): Reconcile contribution records against pay history.",
			map[string]string{
				"stored_balance":  fmt.Sprintf("%.2f", r.StoredBalance),
				"computed_balance": fmt.Sprintf("%.2f", r.ComputedBalance),
				"difference":      fmt.Sprintf("%.2f", diff),
			},
		))
	}
	return findings
}

// CheckBenefitCalculation compares stored benefit payments against recalculated amounts.
// Thresholds: <$1.00 = info, $1.00-$25.00 = warning, >$25.00 = critical.
func CheckBenefitCalculation(records []BenefitVerificationRecord) []Finding {
	var findings []Finding

	for _, r := range records {
		diff := math.Abs(r.StoredBenefit - r.RecalculatedBenefit)
		if diff < 0.005 {
			continue
		}

		var sev Severity
		switch {
		case diff >= 25.0:
			sev = SeverityCritical
		case diff >= 1.0:
			sev = SeverityWarning
		default:
			sev = SeverityInfo
		}

		findings = append(findings, newFinding(
			CategoryCalculation, sev, r.MemberID,
			fmt.Sprintf("Benefit amount mismatch: stored $%.2f vs recalculated $%.2f (diff $%.2f)", r.StoredBenefit, r.RecalculatedBenefit, diff),
			"Proposed correction (awaiting review): Verify benefit calculation inputs (AMS, service years, reduction factor).",
			map[string]string{
				"stored_benefit":       fmt.Sprintf("%.2f", r.StoredBenefit),
				"recalculated_benefit": fmt.Sprintf("%.2f", r.RecalculatedBenefit),
				"difference":           fmt.Sprintf("%.2f", diff),
				"retirement_type":      r.RetirementType,
				"tier":                 fmt.Sprintf("%d", r.Tier),
			},
		))
	}
	return findings
}

// RunAllChecks executes all data quality checks and returns an aggregated report.
func RunAllChecks(input CheckInput) Report {
	var all []Finding

	all = append(all, CheckContradictoryStatus(input.Members)...)
	all = append(all, CheckBeneficiaryAllocation(input.BeneficiaryAllocations)...)
	all = append(all, CheckContributionBalance(input.Contributions)...)
	all = append(all, CheckBenefitCalculation(input.BenefitVerifications)...)

	var critical, warning, info int
	for _, f := range all {
		switch f.Severity {
		case SeverityCritical:
			critical++
		case SeverityWarning:
			warning++
		case SeverityInfo:
			info++
		}
	}

	return Report{
		Findings:      all,
		TotalFindings: len(all),
		CriticalCount: critical,
		WarningCount:  warning,
		InfoCount:     info,
		CheckedAt:     time.Now(),
	}
}
