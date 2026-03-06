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

import "time"

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
type SignalFunc func(table TableInfo, allTables []TableInfo) (bool, string)

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

// --- Schema manifest types (mirrored from connector/introspect) ---

// SchemaManifest is the top-level introspection output.
type SchemaManifest struct {
	Source         string      `json:"source"`
	Driver         string      `json:"driver"`
	Database       string      `json:"database"`
	IntrospectedAt string      `json:"introspected_at"`
	TableCount     int         `json:"table_count"`
	Tables         []TableInfo `json:"tables"`
}

// TableInfo describes a single table.
type TableInfo struct {
	Name        string       `json:"name"`
	RowCount    int64        `json:"row_count"`
	Columns     []ColumnInfo `json:"columns"`
	ForeignKeys []ForeignKey `json:"foreign_keys"`
	NoUITags    []string     `json:"noui_tags"`
}

// ColumnInfo describes a single column.
type ColumnInfo struct {
	Name       string `json:"name"`
	DataType   string `json:"data_type"`
	IsNullable bool   `json:"is_nullable"`
	IsKey      string `json:"key_type"`
}

// ForeignKey describes a referential constraint.
type ForeignKey struct {
	ConstraintName   string `json:"constraint_name"`
	Column           string `json:"column"`
	ReferencedTable  string `json:"referenced_table"`
	ReferencedColumn string `json:"referenced_column"`
}

// Now returns the current time (extracted for testability).
var Now = time.Now
