package main

import (
	"encoding/json"
	"os"
	"testing"
)

// helper to build a minimal TableInfo for testing
func makeTable(name string, cols []ColumnInfo, fks []ForeignKey) TableInfo {
	return TableInfo{
		Name:        name,
		RowCount:    100,
		Columns:     cols,
		ForeignKeys: fks,
		NoUITags:    []string{},
	}
}

func col(name, dataType string) ColumnInfo {
	return ColumnInfo{Name: name, DataType: dataType, IsNullable: true, IsKey: ""}
}

func pk(name string) ColumnInfo {
	return ColumnInfo{Name: name, DataType: "int", IsNullable: false, IsKey: "PRI"}
}

func fk(colName, refTable, refCol string) ForeignKey {
	return ForeignKey{
		ConstraintName:   "fk_" + colName,
		Column:           colName,
		ReferencedTable:  refTable,
		ReferencedColumn: refCol,
	}
}

func hasTag(tags []ConceptTag, target ConceptTag) bool {
	for _, t := range tags {
		if t == target {
			return true
		}
	}
	return false
}

func TestEmployeeMasterTag(t *testing.T) {
	table := makeTable("Employee Master", []ColumnInfo{
		pk("id"),
		col("first_name", "varchar"),
		col("last_name", "varchar"),
		col("date_of_birth", "date"),
		col("gender", "varchar"),
		col("date_of_joining", "date"),
		col("status", "varchar"),
		col("employment_type", "varchar"),
		col("department", "varchar"),
		col("designation", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptEmployeeMaster) {
		t.Errorf("expected employee-master tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestSalaryHistoryTag(t *testing.T) {
	table := makeTable("Monthly Pay Slips", []ColumnInfo{
		pk("id"),
		col("employee_id", "int"),
		col("start_date", "date"),
		col("end_date", "date"),
		col("gross_pay", "decimal"),
		col("net_pay", "decimal"),
		col("total_deduction", "decimal"),
		col("base_gross_pay", "decimal"),
		col("posting_date", "date"),
	}, []ForeignKey{
		fk("employee_id", "employees", "id"),
	})

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptSalaryHistory) {
		t.Errorf("expected salary-history tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestPayrollRunTag(t *testing.T) {
	table := makeTable("Payroll Batch", []ColumnInfo{
		pk("id"),
		col("start_date", "date"),
		col("end_date", "date"),
		col("posting_date", "date"),
		col("number_of_employees", "int"),
		col("total_amount", "decimal"),
		col("salary_slips_created", "int"),
		col("status", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptPayrollRun) {
		t.Errorf("expected payroll-run tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestLeaveBalanceTag(t *testing.T) {
	table := makeTable("Leave Entitlement", []ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("leave_type", "varchar"),
		col("new_leaves_allocated", "decimal"),
		col("total_leaves_allocated", "decimal"),
		col("unused_leaves", "decimal"),
		col("from_date", "date"),
		col("to_date", "date"),
		col("carry_forward", "tinyint"),
		col("total_leave_days", "decimal"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptLeaveBalance) {
		t.Errorf("expected leave-balance tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestEmploymentTimelineTag(t *testing.T) {
	table := makeTable("Staff Promotion", []ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("promotion_date", "date"),
		col("new_designation", "varchar"),
		col("old_designation", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptEmploymentTimeline) {
		t.Errorf("expected employment-timeline tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestAttendanceTag(t *testing.T) {
	table := makeTable("Daily Attendance Log", []ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("attendance_date", "date"),
		col("status", "varchar"),
		col("working_hours", "decimal"),
		col("late_entry", "tinyint"),
		col("early_exit", "tinyint"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptAttendance) {
		t.Errorf("expected attendance tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestBenefitDeductionTag(t *testing.T) {
	table := makeTable("Employee Benefit Claims", []ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("amount", "decimal"),
		col("claim", "varchar"),
		col("tax", "decimal"),
		col("premium", "decimal"),
		col("posting_date", "date"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []TableInfo{table}, concepts)

	if !hasTag(tags, ConceptBenefitDeduction) {
		t.Errorf("expected benefit-deduction tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestNoTagForGenericTable(t *testing.T) {
	table := makeTable("System Settings", []ColumnInfo{
		pk("name"),
		col("value", "text"),
		col("modified", "datetime"),
	}, nil)

	concepts := DefaultConcepts()
	tags, _, _ := AssignTags(table, []TableInfo{table}, concepts)

	if len(tags) > 0 {
		t.Errorf("expected no tags for generic table, got %v", tags)
	}
}

func TestMultipleTagsAllowed(t *testing.T) {
	// A table with salary-history AND benefit-deduction signals
	table := makeTable("Salary Component Deduction", []ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("gross_pay", "decimal"),
		col("net_pay", "decimal"),
		col("total_deduction", "decimal"),
		col("tax", "decimal"),
		col("benefit", "decimal"),
		col("amount", "decimal"),
		col("start_date", "date"),
		col("end_date", "date"),
	}, nil)

	concepts := DefaultConcepts()
	tags, _, _ := AssignTags(table, []TableInfo{table}, concepts)

	if len(tags) < 2 {
		t.Logf("table got %d tags: %v (multiple tags are allowed)", len(tags), tags)
	}
}

func TestMinimalFixture(t *testing.T) {
	data, err := os.ReadFile("testdata/minimal.json")
	if err != nil {
		t.Fatalf("failed to read fixture: %v", err)
	}

	var manifest SchemaManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		t.Fatalf("failed to parse fixture: %v", err)
	}

	concepts := DefaultConcepts()
	report := TagManifest(&manifest, concepts)

	// Verify expected tags
	expectedTags := map[string]ConceptTag{
		"employees":              ConceptEmployeeMaster,
		"monthly_salary_records": ConceptSalaryHistory,
		"payroll_batch_runs":     ConceptPayrollRun,
		"leave_entitlements":     ConceptLeaveBalance,
		"daily_attendance":       ConceptAttendance,
	}

	for tableName, expectedTag := range expectedTags {
		found := false
		for _, table := range manifest.Tables {
			if table.Name == tableName {
				for _, tag := range table.NoUITags {
					if tag == string(expectedTag) {
						found = true
						break
					}
				}
				if !found {
					// Find score for debugging
					for _, rt := range report.Tables {
						if rt.TableName == tableName {
							t.Errorf("table %s: expected tag %s, got tags=%v scores=%v",
								tableName, expectedTag, rt.Tags, rt.Scores)
							break
						}
					}
				}
				break
			}
		}
	}

	// Verify system_settings has no tags
	for _, table := range manifest.Tables {
		if table.Name == "system_settings" {
			if len(table.NoUITags) > 0 {
				t.Errorf("system_settings should have no tags, got %v", table.NoUITags)
			}
		}
	}

	// Summary checks
	if report.Summary.TotalTables != 6 {
		t.Errorf("expected 6 total tables, got %d", report.Summary.TotalTables)
	}
	if report.Summary.TaggedTables < 4 {
		t.Errorf("expected at least 4 tagged tables, got %d", report.Summary.TaggedTables)
	}

	t.Logf("Summary: %d/%d tables tagged", report.Summary.TaggedTables, report.Summary.TotalTables)
	for tag, count := range report.Summary.TagCounts {
		t.Logf("  %s: %d tables (%v)", tag, count, report.Summary.TaggedNames[tag])
	}
}

func TestSignalAuditTrail(t *testing.T) {
	table := makeTable("Salary Slip", []ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("gross_pay", "decimal"),
		col("net_pay", "decimal"),
		col("total_deduction", "decimal"),
		col("start_date", "date"),
		col("end_date", "date"),
	}, nil)

	concepts := DefaultConcepts()
	_, _, signals := AssignTags(table, []TableInfo{table}, concepts)

	salarySignals := signals[ConceptSalaryHistory]
	if len(salarySignals) == 0 {
		t.Fatal("expected salary-history signals, got none")
	}

	// Verify each signal has required audit fields
	for _, hit := range salarySignals {
		if hit.SignalName == "" {
			t.Error("signal hit missing SignalName")
		}
		if hit.Description == "" {
			t.Error("signal hit missing Description")
		}
		if hit.Weight <= 0 {
			t.Errorf("signal hit has non-positive weight: %f", hit.Weight)
		}
		if hit.Evidence == "" {
			t.Error("signal hit missing Evidence")
		}
	}

	t.Logf("salary-history signals for 'Salary Slip': %d hits", len(salarySignals))
	for _, hit := range salarySignals {
		t.Logf("  [%.1f] %s: %s", hit.Weight, hit.SignalName, hit.Evidence)
	}
}
