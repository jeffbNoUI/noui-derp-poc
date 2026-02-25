// YAML-derived test runner — parses rules/definitions/*.yaml files and generates
// table-driven tests from inline test_cases. Each YAML test case becomes a t.Run() subtest.
// This is the "self-testing" capability: when rules change, tests regenerate automatically.
// Consumed by: go test ./internal/rules/
// Depends on: rules/definitions/*.yaml, gopkg.in/yaml.v3
package rules

import (
	"fmt"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"gopkg.in/yaml.v3"
)

// --- YAML structure mirroring rule definition files ---

type yamlFile struct {
	FileMetadata struct {
		Category string `yaml:"category"`
		RuleCount int   `yaml:"rule_count"`
	} `yaml:"file_metadata"`
	Rules []yamlRule `yaml:"rules"`
}

type yamlRule struct {
	RuleID   string         `yaml:"rule_id"`
	RuleName string         `yaml:"rule_name"`
	Category string         `yaml:"category"`
	TestCases []yamlTestCase `yaml:"test_cases"`
}

type yamlTestCase struct {
	ID          string                 `yaml:"id"`
	Description string                 `yaml:"description"`
	Type        string                 `yaml:"type"`
	Inputs      map[string]interface{} `yaml:"inputs"`
	Expected    map[string]interface{} `yaml:"expected"`
	Notes       string                 `yaml:"notes"`
}

// --- Parse all YAML files ---

func findYAMLDir(t *testing.T) string {
	// Walk up from test directory to find rules/definitions/
	dir, err := os.Getwd()
	if err != nil {
		t.Fatalf("cannot get working directory: %v", err)
	}
	for i := 0; i < 10; i++ {
		candidate := filepath.Join(dir, "rules", "definitions")
		if info, err := os.Stat(candidate); err == nil && info.IsDir() {
			return candidate
		}
		dir = filepath.Dir(dir)
	}
	t.Skip("rules/definitions/ directory not found — skipping YAML tests")
	return ""
}

func loadYAMLFiles(t *testing.T) map[string]*yamlFile {
	dir := findYAMLDir(t)
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatalf("cannot read YAML dir: %v", err)
	}

	files := make(map[string]*yamlFile)
	for _, e := range entries {
		if e.IsDir() || !strings.HasSuffix(e.Name(), ".yaml") {
			continue
		}
		data, err := os.ReadFile(filepath.Join(dir, e.Name()))
		if err != nil {
			t.Fatalf("cannot read %s: %v", e.Name(), err)
		}
		var f yamlFile
		if err := yaml.Unmarshal(data, &f); err != nil {
			// schema.yaml and process.yaml have different structure — skip gracefully
			t.Logf("  skipping %s (different schema): %v", e.Name(), err)
			continue
		}
		if len(f.Rules) == 0 {
			continue // No rules in this file (e.g., schema definition files)
		}
		files[e.Name()] = &f
	}
	return files
}

// --- Master test: parse and count ---

func TestYAML_AllFilesParseSuccessfully(t *testing.T) {
	files := loadYAMLFiles(t)
	if len(files) == 0 {
		t.Fatal("no YAML files found")
	}

	totalRules := 0
	totalCases := 0
	for name, f := range files {
		ruleCount := len(f.Rules)
		caseCount := 0
		for _, r := range f.Rules {
			caseCount += len(r.TestCases)
		}
		totalRules += ruleCount
		totalCases += caseCount
		t.Logf("  %s: %d rules, %d test cases", name, ruleCount, caseCount)
	}

	t.Logf("TOTAL: %d files, %d rules, %d test cases", len(files), totalRules, totalCases)
	if totalCases < 200 {
		t.Errorf("expected 200+ test cases across all YAML files, got %d", totalCases)
	}
}

func TestYAML_AllTestCasesHaveRequiredFields(t *testing.T) {
	files := loadYAMLFiles(t)

	for name, f := range files {
		for _, rule := range f.Rules {
			for _, tc := range rule.TestCases {
				t.Run(fmt.Sprintf("%s/%s/%s", name, rule.RuleID, tc.ID), func(t *testing.T) {
					if tc.ID == "" {
						t.Error("test case missing ID")
					}
					if tc.Description == "" {
						t.Error("test case missing description")
					}
					if tc.Type == "" {
						t.Error("test case missing type")
					}
					validTypes := map[string]bool{
						"happy_path": true, "boundary": true, "just_below": true,
						"negative": true, "edge_case": true, "hypothetical": true,
						"not_applicable": true,
					}
					if !validTypes[tc.Type] {
						t.Errorf("invalid test case type: %s", tc.Type)
					}
					if len(tc.Inputs) == 0 {
						t.Error("test case has no inputs")
					}
				})
			}
		}
	}
}

// --- Evaluatable tests: tier determination ---

func TestYAML_TierDetermination(t *testing.T) {
	files := loadYAMLFiles(t)
	membershipFile := files["membership.yaml"]
	if membershipFile == nil {
		t.Skip("membership.yaml not found")
	}

	tierRules := []string{"RULE-TIER-1", "RULE-TIER-2", "RULE-TIER-3"}
	for _, rule := range membershipFile.Rules {
		if !contains(tierRules, rule.RuleID) {
			continue
		}
		for _, tc := range rule.TestCases {
			t.Run(fmt.Sprintf("%s/%s", rule.RuleID, tc.ID), func(t *testing.T) {
				hireDateStr, ok := tc.Inputs["hireDate"].(string)
				if !ok {
					t.Skip("no hireDate input")
				}
				hireDate, err := time.Parse("2006-01-02", hireDateStr)
				if err != nil {
					t.Fatalf("invalid hireDate: %v", err)
				}

				expectedRaw, ok := tc.Expected["computedTier"]
				if !ok || expectedRaw == nil {
					t.Skip("no computedTier expected (null/prior plan case)")
				}
				expectedTier := toInt(expectedRaw)
				if expectedTier == 0 {
					t.Skip("computed tier is 0/null")
				}

				// Compute tier using the same logic as the DQ engine
				computed := computeTierFromDate(hireDate)
				if computed != expectedTier {
					t.Errorf("%s: hireDate=%s → got Tier %d, expected Tier %d",
						tc.Description, hireDateStr, computed, expectedTier)
				}
			})
		}
	}
}

// --- Evaluatable tests: reduction factors ---

func TestYAML_ReductionFactors(t *testing.T) {
	files := loadYAMLFiles(t)
	eligFile := files["eligibility.yaml"]
	if eligFile == nil {
		t.Skip("eligibility.yaml not found")
	}

	reductionRules := []string{"RULE-EARLY-REDUCE-T12", "RULE-EARLY-REDUCE-T3"}
	for _, rule := range eligFile.Rules {
		if !contains(reductionRules, rule.RuleID) {
			continue
		}
		for _, tc := range rule.TestCases {
			t.Run(fmt.Sprintf("%s/%s", rule.RuleID, tc.ID), func(t *testing.T) {
				ageRaw, ok := tc.Inputs["ageAtRetirement"]
				if !ok {
					t.Skip("no ageAtRetirement input")
				}
				age := toInt(ageRaw)

				tierRaw, ok := tc.Inputs["computedTier"]
				if !ok {
					t.Skip("no computedTier input")
				}
				tier := toInt(tierRaw)
				if tier == 0 {
					t.Skip("tier is 0")
				}

				expectedStr, ok := tc.Expected["reductionFactor"]
				if !ok {
					t.Skip("no reductionFactor expected")
				}
				expected := toFloat(expectedStr)

				actual := ReductionFactor(tier, age)
				if actual < 0 {
					// Below minimum age — check if expected was also indicating not applicable
					if expected > 0 {
						t.Errorf("%s: age=%d tier=%d → below min age, but expected factor %.4f",
							tc.Description, age, tier, expected)
					}
					return
				}
				if math.Abs(actual-expected) > 0.001 {
					t.Errorf("%s: age=%d tier=%d → got %.4f, expected %.4f",
						tc.Description, age, tier, actual, expected)
				}
			})
		}
	}
}

// --- Evaluatable tests: death benefit ---

func TestYAML_DeathBenefit(t *testing.T) {
	files := loadYAMLFiles(t)
	suppFile := files["supplemental.yaml"]
	if suppFile == nil {
		t.Skip("supplemental.yaml not found")
	}

	deathRules := []string{"RULE-DEATH-NORMAL", "RULE-DEATH-EARLY-T12", "RULE-DEATH-EARLY-T3"}
	for _, rule := range suppFile.Rules {
		if !contains(deathRules, rule.RuleID) {
			continue
		}
		for _, tc := range rule.TestCases {
			t.Run(fmt.Sprintf("%s/%s", rule.RuleID, tc.ID), func(t *testing.T) {
				ageRaw, ok := tc.Inputs["ageAtRetirement"]
				if !ok {
					t.Skip("no ageAtRetirement input")
				}
				age := toInt(ageRaw)

				tierRaw, ok := tc.Inputs["computedTier"]
				if !ok {
					t.Skip("no computedTier input")
				}
				tier := toInt(tierRaw)

				retType, _ := tc.Inputs["retirementType"].(string)
				isNormal := retType == "normal" || retType == "rule_of_75" || retType == "rule_of_85"

				expectedRaw, ok := tc.Expected["deathBenefit"]
				if !ok {
					t.Skip("no deathBenefit expected")
				}
				expected := toFloat(expectedRaw)

				actual := DeathBenefitAmount(tier, age, isNormal)
				if math.Abs(actual-expected) > 0.01 {
					t.Errorf("%s: tier=%d age=%d type=%s → got $%.2f, expected $%.2f",
						tc.Description, tier, age, retType, actual, expected)
				}
			})
		}
	}
}

// --- Evaluatable tests: vesting ---

func TestYAML_Vesting(t *testing.T) {
	files := loadYAMLFiles(t)
	eligFile := files["eligibility.yaml"]
	if eligFile == nil {
		t.Skip("eligibility.yaml not found")
	}

	for _, rule := range eligFile.Rules {
		if rule.RuleID != "RULE-VESTING" {
			continue
		}
		for _, tc := range rule.TestCases {
			t.Run(fmt.Sprintf("%s/%s", rule.RuleID, tc.ID), func(t *testing.T) {
				eligYearsRaw, ok := tc.Inputs["totalForEligibility"]
				if !ok {
					t.Skip("no totalForEligibility input")
				}
				eligYears := toFloat(eligYearsRaw)

				expectedRaw, ok := tc.Expected["isVested"]
				if !ok {
					t.Skip("no isVested expected")
				}
				expectedVested, ok := expectedRaw.(bool)
				if !ok {
					t.Skip("isVested not a bool")
				}

				actualVested := eligYears >= VestingYears
				if actualVested != expectedVested {
					t.Errorf("%s: %.2f years → vested=%v, expected=%v",
						tc.Description, eligYears, actualVested, expectedVested)
				}
			})
		}
	}
}

// --- Evaluatable tests: multiplier ---

func TestYAML_BenefitMultiplier(t *testing.T) {
	files := loadYAMLFiles(t)
	benefitFile := files["benefit-calculation.yaml"]
	if benefitFile == nil {
		t.Skip("benefit-calculation.yaml not found")
	}

	for _, rule := range benefitFile.Rules {
		if rule.RuleID != "RULE-BENEFIT-T1" && rule.RuleID != "RULE-BENEFIT-T2" && rule.RuleID != "RULE-BENEFIT-T3" {
			continue
		}
		for _, tc := range rule.TestCases {
			t.Run(fmt.Sprintf("%s/%s", rule.RuleID, tc.ID), func(t *testing.T) {
				tierRaw, ok := tc.Inputs["computedTier"]
				if !ok {
					t.Skip("no computedTier input")
				}
				tier := toInt(tierRaw)
				if tier == 0 {
					t.Skip("tier is 0")
				}

				expectedRaw, ok := tc.Expected["multiplier"]
				if !ok {
					t.Skip("no multiplier expected")
				}
				expected := toFloat(expectedRaw)

				actual := Multiplier(tier)
				if math.Abs(actual-expected) > 0.0001 {
					t.Errorf("%s: tier=%d → got multiplier %.4f, expected %.4f",
						tc.Description, tier, actual, expected)
				}
			})
		}
	}
}

// --- Helpers ---

func contains(slice []string, val string) bool {
	for _, s := range slice {
		if s == val {
			return true
		}
	}
	return false
}

func toInt(v interface{}) int {
	switch val := v.(type) {
	case int:
		return val
	case float64:
		return int(val)
	case string:
		var i int
		fmt.Sscanf(val, "%d", &i)
		return i
	default:
		return 0
	}
}

func toFloat(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case int:
		return float64(val)
	case string:
		var f float64
		fmt.Sscanf(val, "%f", &f)
		return f
	default:
		return 0
	}
}

func computeTierFromDate(hireDate time.Time) int {
	tier2Start := time.Date(2004, 9, 1, 0, 0, 0, 0, time.UTC)
	tier3Start := time.Date(2011, 7, 1, 0, 0, 0, 0, time.UTC)
	if hireDate.Before(tier2Start) {
		return 1
	}
	if hireDate.Before(tier3Start) {
		return 2
	}
	return 3
}
