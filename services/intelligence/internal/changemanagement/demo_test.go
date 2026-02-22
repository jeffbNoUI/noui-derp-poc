package changemanagement

import "testing"

func TestGenerateContributionRateChangeDemo(t *testing.T) {
	pkg := GenerateContributionRateChangeDemo()

	if pkg.ChangeID == "" {
		t.Error("expected non-empty ChangeID")
	}
	if len(pkg.Changes) != 3 {
		t.Errorf("expected 3 rule changes, got %d", len(pkg.Changes))
	}
	if len(pkg.TestResults) < 6 {
		t.Errorf("expected at least 6 test results, got %d", len(pkg.TestResults))
	}

	// All tests should pass in the demo
	for _, tr := range pkg.TestResults {
		if !tr.Passed {
			t.Errorf("demo test %s should pass", tr.TestName)
		}
	}

	// Verify the changes reference proper source documents
	for _, ch := range pkg.Changes {
		if ch.SourceReference == "" {
			t.Errorf("change %s missing source reference", ch.RuleID)
		}
		if len(ch.AffectedTiers) == 0 {
			t.Errorf("change %s missing affected tiers", ch.RuleID)
		}
	}

	// Should be in review status (not yet certified)
	if pkg.Status != "review" {
		t.Errorf("expected status 'review', got %s", pkg.Status)
	}
	if pkg.CertifiedBy != "" {
		t.Error("should not be certified yet in demo")
	}
}
