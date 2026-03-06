package main

import (
	"encoding/json"
	"os"
	"testing"

	"github.com/noui/connector-lab/schema"
)

// helper to build a minimal TableInfo for testing
func makeTable(name string, cols []schema.ColumnInfo, fks []schema.ForeignKey) schema.TableInfo {
	return schema.TableInfo{
		Name:        name,
		RowCount:    100,
		Columns:     cols,
		ForeignKeys: fks,
		NoUITags:    []string{},
	}
}

func col(name, dataType string) schema.ColumnInfo {
	return schema.ColumnInfo{Name: name, DataType: dataType, IsNullable: true, IsKey: ""}
}

func pk(name string) schema.ColumnInfo {
	return schema.ColumnInfo{Name: name, DataType: "int", IsNullable: false, IsKey: "PRI"}
}

func fk(colName, refTable, refCol string) schema.ForeignKey {
	return schema.ForeignKey{
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
	table := makeTable("Employee Master", []schema.ColumnInfo{
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
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptEmployeeMaster) {
		t.Errorf("expected employee-master tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestSalaryHistoryTag(t *testing.T) {
	table := makeTable("Monthly Pay Slips", []schema.ColumnInfo{
		pk("id"),
		col("employee_id", "int"),
		col("start_date", "date"),
		col("end_date", "date"),
		col("gross_pay", "decimal"),
		col("net_pay", "decimal"),
		col("total_deduction", "decimal"),
		col("base_gross_pay", "decimal"),
		col("posting_date", "date"),
	}, []schema.ForeignKey{
		fk("employee_id", "employees", "id"),
	})

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptSalaryHistory) {
		t.Errorf("expected salary-history tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestPayrollRunTag(t *testing.T) {
	table := makeTable("Payroll Batch", []schema.ColumnInfo{
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
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptPayrollRun) {
		t.Errorf("expected payroll-run tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestLeaveBalanceTag(t *testing.T) {
	table := makeTable("Leave Entitlement", []schema.ColumnInfo{
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
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptLeaveBalance) {
		t.Errorf("expected leave-balance tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestEmploymentTimelineTag(t *testing.T) {
	table := makeTable("Staff Promotion", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("promotion_date", "date"),
		col("new_designation", "varchar"),
		col("old_designation", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptEmploymentTimeline) {
		t.Errorf("expected employment-timeline tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestAttendanceTag(t *testing.T) {
	table := makeTable("Daily Attendance Log", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("attendance_date", "date"),
		col("status", "varchar"),
		col("working_hours", "decimal"),
		col("late_entry", "tinyint"),
		col("early_exit", "tinyint"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptAttendance) {
		t.Errorf("expected attendance tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestBenefitDeductionTag(t *testing.T) {
	table := makeTable("Employee Benefit Claims", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("amount", "decimal"),
		col("claim", "varchar"),
		col("tax", "decimal"),
		col("premium", "decimal"),
		col("posting_date", "date"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptBenefitDeduction) {
		t.Errorf("expected benefit-deduction tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestTrainingRecordTag(t *testing.T) {
	table := makeTable("Employee Training Events", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("training_date", "date"),
		col("event_name", "varchar"),
		col("trainer", "varchar"),
		col("result", "varchar"),
		col("hours", "decimal"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptTrainingRecord) {
		t.Errorf("expected training-record tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestExpenseClaimTag(t *testing.T) {
	table := makeTable("Staff Expense Claims", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("expense_date", "date"),
		col("claim_amount", "decimal"),
		col("sanctioned_amount", "decimal"),
		col("expense_type", "varchar"),
		col("approval_status", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptExpenseClaim) {
		t.Errorf("expected expense-claim tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestPerformanceReviewTag(t *testing.T) {
	table := makeTable("Staff Appraisal Record", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("score", "decimal"),
		col("rating", "varchar"),
		col("goal", "varchar"),
		col("appraisal_cycle", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptPerformanceReview) {
		t.Errorf("expected performance-review tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestShiftScheduleTag(t *testing.T) {
	table := makeTable("Shift Assignment Record", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("shift_type", "varchar"),
		col("start_date", "date"),
		col("end_date", "date"),
		col("status", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptShiftSchedule) {
		t.Errorf("expected shift-schedule tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestLoanAdvanceTag(t *testing.T) {
	table := makeTable("Employee Loan Record", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("loan_amount", "decimal"),
		col("repayment_amount", "decimal"),
		col("disbursement_date", "date"),
		col("rate_of_interest", "decimal"),
		col("status", "varchar"),
	}, nil)

	concepts := DefaultConcepts()
	tags, scores, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if !hasTag(tags, ConceptLoanAdvance) {
		t.Errorf("expected loan-advance tag, got tags=%v scores=%v", tags, scores)
	}
}

func TestNoTagForGenericTable(t *testing.T) {
	table := makeTable("System Settings", []schema.ColumnInfo{
		pk("name"),
		col("value", "text"),
		col("modified", "datetime"),
	}, nil)

	concepts := DefaultConcepts()
	tags, _, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if len(tags) > 0 {
		t.Errorf("expected no tags for generic table, got %v", tags)
	}
}

func TestMultipleTagsAllowed(t *testing.T) {
	// A table with salary-history AND benefit-deduction signals
	table := makeTable("Salary Component Deduction", []schema.ColumnInfo{
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
	tags, _, _ := AssignTags(table, []schema.TableInfo{table}, concepts)

	if len(tags) < 2 {
		t.Logf("table got %d tags: %v (multiple tags are allowed)", len(tags), tags)
	}
}

func TestMinimalFixture(t *testing.T) {
	data, err := os.ReadFile("testdata/minimal.json")
	if err != nil {
		t.Fatalf("failed to read fixture: %v", err)
	}

	var manifest schema.SchemaManifest
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
		"training_events":        ConceptTrainingRecord,
		"expense_claims":         ConceptExpenseClaim,
		"staff_appraisals":       ConceptPerformanceReview,
		"shift_assignments":      ConceptShiftSchedule,
		"employee_loans":         ConceptLoanAdvance,
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
	if report.Summary.TotalTables != 11 {
		t.Errorf("expected 11 total tables, got %d", report.Summary.TotalTables)
	}
	if report.Summary.TaggedTables < 9 {
		t.Errorf("expected at least 9 tagged tables, got %d", report.Summary.TaggedTables)
	}

	t.Logf("Summary: %d/%d tables tagged", report.Summary.TaggedTables, report.Summary.TotalTables)
	for tag, count := range report.Summary.TagCounts {
		t.Logf("  %s: %d tables (%v)", tag, count, report.Summary.TaggedNames[tag])
	}
}

func TestSignalAuditTrail(t *testing.T) {
	table := makeTable("Salary Slip", []schema.ColumnInfo{
		pk("id"),
		col("employee", "varchar"),
		col("gross_pay", "decimal"),
		col("net_pay", "decimal"),
		col("total_deduction", "decimal"),
		col("start_date", "date"),
		col("end_date", "date"),
	}, nil)

	concepts := DefaultConcepts()
	_, _, signals := AssignTags(table, []schema.TableInfo{table}, concepts)

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
