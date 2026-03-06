package main

import (
	"fmt"

	"github.com/noui/connector-lab/schema"
)

// DefaultConcepts returns the 12 concept definitions with their signal configurations.
func DefaultConcepts() []ConceptDef {
	return []ConceptDef{
		employeeMasterConcept(),
		salaryHistoryConcept(),
		payrollRunConcept(),
		leaveBalanceConcept(),
		employmentTimelineConcept(),
		attendanceConcept(),
		benefitDeductionConcept(),
		trainingRecordConcept(),
		expenseClaimConcept(),
		performanceReviewConcept(),
		shiftScheduleConcept(),
		loanAdvanceConcept(),
	}
}

func employeeMasterConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptEmployeeMaster,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:employee_core",
				Description: "Table name suggests core employee record (not a sub-type)",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					// Match "employee" but exclude sub-types like promotion, transfer, etc.
					return tableNameContainsButNot(t,
						[]string{"employee"},
						[]string{"checkin", "separation", "transfer", "promotion",
							"benefit", "tax", "incentive", "onboard", "boarding",
							"grievance", "referral", "training", "skill", "feedback",
							"advance", "cost", "group", "property", "external",
							"internal", "education", "health", "other_income",
							"performance", "detail"},
					)
				},
			},
			{
				Name:        "columns:identity",
				Description: "Has personal identity columns (name, birth date, gender)",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"first_name", "last_name", "employee_name",
						"date_of_birth", "gender",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("identity columns found: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:employment_status",
				Description: "Has employment status and joining date columns",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnPair(t,
						[]string{"status", "employment_type"},
						[]string{"date_of_joining", "joining_date", "hire_date"},
					)
				},
			},
			{
				Name:        "columns:org_structure",
				Description: "Has department/designation/company columns",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{"department", "designation", "company"})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("org structure columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "pattern:no_date_range",
				Description: "Master records are not period-bounded (no from_date/to_date)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					has, _ := hasDateRangePattern(t)
					if !has {
						return true, "no date range pattern (consistent with master record)"
					}
					return false, ""
				},
			},
		},
	}
}

func salaryHistoryConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptSalaryHistory,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "columns:compensation",
				Description: "Has compensation-related columns",
				Weight:      2.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"gross_pay", "net_pay", "total_deduction", "base_gross_pay",
						"base_net_pay", "total_earning", "salary_amount",
						"payroll_frequency", "salary_structure",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("compensation columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:monetary_pair",
				Description: "Has both gross/base and net/deduction column types",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnPair(t,
						[]string{"gross", "base_pay", "total_earning"},
						[]string{"net", "deduction", "take_home"},
					)
				},
			},
			{
				Name:        "type_ratio:decimal",
				Description: "High ratio of decimal/numeric columns (financial data)",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					ratio := decimalColumnRatio(t)
					if ratio > 0.20 {
						return true, fmt.Sprintf("%.0f%% of columns are decimal/numeric", ratio*100)
					}
					return false, ""
				},
			},
			{
				Name:        "pattern:date_range",
				Description: "Has date range columns (period-based records)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "table_name:salary",
				Description: "Table name contains salary/compensation/pay terms",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{"salary", "compensation", "pay_slip", "payslip"})
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func payrollRunConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptPayrollRun,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:payroll",
				Description: "Table name contains payroll/pay_run terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{"payroll"})
				},
			},
			{
				Name:        "columns:batch_processing",
				Description: "Has batch/aggregate count columns",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"number_of_employees", "employee_count", "total_employees",
						"salary_slips_created", "salary_slips_submitted",
					})
					if len(matches) >= 1 {
						return true, fmt.Sprintf("batch processing columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "pattern:date_range",
				Description: "Has date range columns (payroll period)",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "columns:posting",
				Description: "Has posting/processing date column",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{"posting_date", "process_date"})
				},
			},
			{
				Name:        "type_ratio:decimal",
				Description: "Has decimal columns for totals",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					ratio := decimalColumnRatio(t)
					if ratio > 0.15 {
						return true, fmt.Sprintf("%.0f%% of columns are decimal/numeric", ratio*100)
					}
					return false, ""
				},
			},
		},
	}
}

func leaveBalanceConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptLeaveBalance,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:leave",
				Description: "Table name contains leave-related terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{"leave"})
				},
			},
			{
				Name:        "columns:allocation",
				Description: "Has allocation/balance/entitlement columns",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"leaves_allocated", "leave_balance", "carry_forward",
						"total_leave", "new_leaves", "unused_leaves",
					})
					if len(matches) >= 1 {
						return true, fmt.Sprintf("allocation columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:day_count",
				Description: "Has day count columns",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{
						"total_leave_days", "leave_days",
					})
				},
			},
			{
				Name:        "pattern:date_range",
				Description: "Has date range (leave period)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "columns:leave_type",
				Description: "Has leave type reference column",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{"leave_type"})
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func employmentTimelineConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptEmploymentTimeline,
		Threshold: 2.5,
		Signals: []SignalDef{
			{
				Name:        "table_name:lifecycle",
				Description: "Table name suggests employment lifecycle event",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"promotion", "transfer", "separation", "onboarding",
						"termination", "rehire",
					})
				},
			},
			{
				Name:        "columns:lifecycle_date",
				Description: "Has lifecycle event date columns",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"promotion_date", "transfer_date", "relieving_date",
						"resignation", "effective_date", "boarding_status",
					})
					if len(matches) >= 1 {
						return true, fmt.Sprintf("lifecycle date columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:state_transition",
				Description: "Has old/new state columns (before/after change)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnPair(t,
						[]string{"new_designation", "new_department", "new_company"},
						[]string{"old_designation", "old_department", "old_company"},
					)
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func attendanceConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptAttendance,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:attendance",
				Description: "Table name contains attendance/checkin terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{"attendance", "checkin", "check_in"})
				},
			},
			{
				Name:        "columns:attendance",
				Description: "Has attendance-specific columns",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"attendance_date", "working_hours", "late_entry",
						"early_exit", "check_in", "check_out",
					})
					if len(matches) >= 1 {
						return true, fmt.Sprintf("attendance columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:presence_status",
				Description: "Has status column in attendance context",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					hasName, _ := tableNameContains(t, []string{"attendance"})
					hasStatus, _ := hasStatusColumn(t)
					if hasName && hasStatus {
						return true, "status column in attendance-named table"
					}
					return false, ""
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func benefitDeductionConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptBenefitDeduction,
		Threshold: 3.5,
		Signals: []SignalDef{
			{
				Name:        "table_name:benefit_deduction",
				Description: "Table name contains benefit/deduction/incentive terms (HR-specific)",
				Weight:      2.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"benefit", "incentive", "tax exemption", "tax_exemption",
					})
				},
			},
			{
				Name:        "columns:benefit_specific",
				Description: "Has benefit-specific columns (max_benefit, claim_amount, premium)",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"max_benefit", "claim_amount", "benefit_amount",
						"premium", "pay_against_benefit_claim",
						"is_flexible_benefit", "benefit_type",
					})
					if len(matches) >= 1 {
						return true, fmt.Sprintf("benefit-specific columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:tax_exemption",
				Description: "Has tax exemption/declaration columns (not generic tax references)",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"exemption", "exempted_from_income_tax", "declaration",
						"income_tax_slab", "tax_exemption",
					})
					if len(matches) >= 1 {
						return true, fmt.Sprintf("tax exemption columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
			{
				Name:        "type_ratio:decimal",
				Description: "Has decimal columns for monetary values",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					ratio := decimalColumnRatio(t)
					if ratio > 0.15 {
						return true, fmt.Sprintf("%.0f%% of columns are decimal/numeric", ratio*100)
					}
					return false, ""
				},
			},
		},
	}
}

func trainingRecordConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptTrainingRecord,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:training",
				Description: "Table name contains training/certification/skill terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"training", "certification", "skill_map", "skill map",
					})
				},
			},
			{
				Name:        "columns:training_detail",
				Description: "Has training-specific columns (trainer, event, course)",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"trainer", "training_date", "course", "event_name",
						"certification", "skill", "proficiency",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("training columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:completion_status",
				Description: "Has completion/result columns",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{
						"result", "grade", "completed", "hours",
					})
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func expenseClaimConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptExpenseClaim,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:expense",
				Description: "Table name contains expense/reimbursement/claim terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"expense", "reimbursement",
					})
				},
			},
			{
				Name:        "columns:expense_detail",
				Description: "Has expense-specific columns (claim_amount, sanctioned, expense_type)",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"claim_amount", "sanctioned_amount", "expense_type",
						"total_claimed_amount", "total_sanctioned_amount",
						"expense_date",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("expense columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:approval",
				Description: "Has approval workflow columns",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{
						"approval_status", "approver", "sanctioned",
					})
				},
			},
			{
				Name:        "type_ratio:decimal",
				Description: "High ratio of decimal columns (monetary claims)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					ratio := decimalColumnRatio(t)
					if ratio > 0.15 {
						return true, fmt.Sprintf("%.0f%% of columns are decimal/numeric", ratio*100)
					}
					return false, ""
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func performanceReviewConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptPerformanceReview,
		Threshold: 2.5,
		Signals: []SignalDef{
			{
				Name:        "table_name:performance",
				Description: "Table name contains appraisal/performance/review/kpi terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"appraisal", "performance", "review", "kpi",
					})
				},
			},
			{
				Name:        "columns:appraisal_detail",
				Description: "Has appraisal-specific columns (score, rating, goal)",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"score", "rating", "goal", "kpi", "target",
						"appraisal_template", "self_score", "avg_score",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("appraisal columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:review_period",
				Description: "Has review period or cycle columns",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{
						"appraisal_cycle", "review_date", "cycle",
					})
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func shiftScheduleConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptShiftSchedule,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:shift",
				Description: "Table name contains shift/roster/schedule terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"shift", "roster",
					})
				},
			},
			{
				Name:        "columns:shift_detail",
				Description: "Has shift-specific columns (shift_type, start_time, end_time)",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"shift_type", "start_time", "end_time",
						"shift_request", "start_datetime", "end_datetime",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("shift columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "pattern:date_range",
				Description: "Has date range columns (shift period)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "columns:assignment_status",
				Description: "Has status column in shift context",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					hasName, _ := tableNameContains(t, []string{"shift"})
					hasStatus, _ := hasStatusColumn(t)
					if hasName && hasStatus {
						return true, "status column in shift-named table"
					}
					return false, ""
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}

func loanAdvanceConcept() ConceptDef {
	return ConceptDef{
		Tag:       ConceptLoanAdvance,
		Threshold: 3.0,
		Signals: []SignalDef{
			{
				Name:        "table_name:loan_advance",
				Description: "Table name contains loan/advance terms",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return tableNameContains(t, []string{"loan", "advance"})
				},
			},
			{
				Name:        "columns:loan_detail",
				Description: "Has loan-specific columns (loan_amount, repayment, disbursement)",
				Weight:      1.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					matches := columnsMatching(t, []string{
						"loan_amount", "repayment_amount", "disbursement_date",
						"total_amount_paid", "disbursed_amount", "repayment_method",
						"advance_amount", "paid_amount", "return_amount",
					})
					if len(matches) >= 2 {
						return true, fmt.Sprintf("loan columns: %v", matches)
					}
					return false, ""
				},
			},
			{
				Name:        "columns:interest_tenure",
				Description: "Has interest rate or tenure columns",
				Weight:      1.0,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{
						"rate_of_interest", "repayment_periods", "tenure",
						"monthly_repayment_amount",
					})
				},
			},
			{
				Name:        "type_ratio:decimal",
				Description: "High ratio of decimal columns (financial data)",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					ratio := decimalColumnRatio(t)
					if ratio > 0.20 {
						return true, fmt.Sprintf("%.0f%% of columns are decimal/numeric", ratio*100)
					}
					return false, ""
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t schema.TableInfo, _ []schema.TableInfo) (bool, string) {
					if found, ev := fkReferencesTableLike(t, []string{"employee"}); found {
						return true, ev
					}
					return hasColumnLinkToTableLike(t, []string{"employee"})
				},
			},
		},
	}
}
