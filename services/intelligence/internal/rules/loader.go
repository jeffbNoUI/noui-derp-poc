package rules

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// RuleDefinition represents a single rule from the YAML definitions.
type RuleDefinition struct {
	RuleID            string   `yaml:"rule_id"`
	RuleName          string   `yaml:"rule_name"`
	Category          string   `yaml:"category"`
	Description       string   `yaml:"description"`
	TierApplicability []int    `yaml:"tier_applicability"`
	SourceReference   struct {
		Document     string `yaml:"document"`
		Section      string `yaml:"section"`
		Verification string `yaml:"verification"`
	} `yaml:"source_reference"`
	Governance struct {
		Version       string `yaml:"version"`
		CertifiedBy   string `yaml:"certified_by"`
		InventoryRef  string `yaml:"inventory_ref"`
	} `yaml:"governance"`
}

// RuleFile represents a YAML file containing rule definitions.
type RuleFile struct {
	Rules []RuleDefinition `yaml:"rules"`
}

// RuleSet holds all loaded rules, indexed by ID.
type RuleSet struct {
	Rules    map[string]RuleDefinition
	ByCategory map[string][]RuleDefinition
}

// LoadRules loads and validates all YAML rule definitions from the given directory.
// Rules are immutable after load — no runtime modification.
func LoadRules(dir string) (*RuleSet, error) {
	rs := &RuleSet{
		Rules:      make(map[string]RuleDefinition),
		ByCategory: make(map[string][]RuleDefinition),
	}

	files, err := filepath.Glob(filepath.Join(dir, "*.yaml"))
	if err != nil {
		return nil, fmt.Errorf("glob rules directory: %w", err)
	}

	if len(files) == 0 {
		log.Printf("WARNING: No rule definition files found in %s", dir)
		return rs, nil
	}

	for _, f := range files {
		if filepath.Base(f) == "schema.yaml" {
			continue // Skip the schema definition
		}

		data, err := os.ReadFile(f)
		if err != nil {
			return nil, fmt.Errorf("read %s: %w", f, err)
		}

		var rf RuleFile
		if err := yaml.Unmarshal(data, &rf); err != nil {
			return nil, fmt.Errorf("parse %s: %w", f, err)
		}

		for _, rule := range rf.Rules {
			if err := validateRule(rule); err != nil {
				return nil, fmt.Errorf("invalid rule %s in %s: %w", rule.RuleID, f, err)
			}
			rs.Rules[rule.RuleID] = rule
			rs.ByCategory[rule.Category] = append(rs.ByCategory[rule.Category], rule)
		}

		log.Printf("Loaded %d rules from %s", len(rf.Rules), filepath.Base(f))
	}

	log.Printf("Total rules loaded: %d across %d categories", len(rs.Rules), len(rs.ByCategory))
	return rs, nil
}

// validateRule checks that a rule definition has all required fields.
func validateRule(r RuleDefinition) error {
	if r.RuleID == "" {
		return fmt.Errorf("rule_id is required")
	}
	if r.RuleName == "" {
		return fmt.Errorf("rule_name is required")
	}
	if r.Category == "" {
		return fmt.Errorf("category is required")
	}
	if r.SourceReference.Document == "" {
		return fmt.Errorf("source_reference.document is required")
	}
	if r.SourceReference.Section == "" {
		return fmt.Errorf("source_reference.section is required")
	}
	if len(r.TierApplicability) == 0 {
		return fmt.Errorf("tier_applicability is required")
	}
	return nil
}

// GetRule returns a rule by ID, or nil if not found.
func (rs *RuleSet) GetRule(id string) *RuleDefinition {
	r, ok := rs.Rules[id]
	if !ok {
		return nil
	}
	return &r
}
