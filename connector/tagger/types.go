// connector/tagger — NoUI Concept Tagger
//
// Reads a schema manifest (produced by connector/introspect) and assigns
// concept tags to tables based on signal detection. Tags identify tables
// that represent HR/payroll concepts (employee records, salary history,
// payroll runs, leave balances, etc.) by structural signals rather than
// hardcoded table names.
//
// Usage:
//   go run ./tagger/ \
//     --input manifest.json \
//     --output manifest-tagged.json \
//     --report tags-report.json

package main

import (
	"time"

	"github.com/noui/connector-lab/schema"
)

// ConceptTag enumerates the recognized concept tags.
type ConceptTag string

const (
	ConceptEmployeeMaster     ConceptTag = "employee-master"
	ConceptSalaryHistory      ConceptTag = "salary-history"
	ConceptPayrollRun         ConceptTag = "payroll-run"
	ConceptLeaveBalance       ConceptTag = "leave-balance"
	ConceptEmploymentTimeline ConceptTag = "employment-timeline"
	ConceptAttendance         ConceptTag = "attendance"
	ConceptBenefitDeduction   ConceptTag = "benefit-deduction"
)

// SignalHit records a single signal that fired for a table-concept pair.
type SignalHit struct {
	SignalName  string  `json:"signal_name"`
	Description string  `json:"description"`
	Weight      float64 `json:"weight"`
	Evidence    string  `json:"evidence"`
}

// TableTagResult holds the tagging results for a single table.
type TableTagResult struct {
	TableName string                    `json:"table_name"`
	Tags      []ConceptTag              `json:"tags"`
	Scores    map[ConceptTag]float64    `json:"scores"`
	Signals   map[ConceptTag][]SignalHit `json:"signals"`
}

// TagReport is the full audit output for all tagged tables.
type TagReport struct {
	GeneratedAt    string           `json:"generated_at"`
	ManifestSource string           `json:"manifest_source"`
	Threshold      float64          `json:"threshold"`
	Summary        TagSummary       `json:"summary"`
	Tables         []TableTagResult `json:"tables"`
}

// TagSummary provides counts and tagged table lists per concept.
type TagSummary struct {
	TotalTables  int                       `json:"total_tables"`
	TaggedTables int                       `json:"tagged_tables"`
	TagCounts    map[ConceptTag]int        `json:"tag_counts"`
	TaggedNames  map[ConceptTag][]string   `json:"tagged_names"`
}

// SignalFunc detects whether a signal fires for a given table.
// Returns (fired, evidence_description).
type SignalFunc func(table schema.TableInfo, allTables []schema.TableInfo) (bool, string)

// SignalDef defines a signal detection function and its metadata.
type SignalDef struct {
	Name        string
	Description string
	Weight      float64
	Detect      SignalFunc
}

// ConceptDef defines a concept tag and its associated signals.
type ConceptDef struct {
	Tag       ConceptTag
	Threshold float64
	Signals   []SignalDef
}

// Now returns the current time (extracted for testability).
var Now = time.Now
