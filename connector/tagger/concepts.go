package main

import "fmt"

// DefaultConcepts returns the 7 core concept definitions with their signal configurations.
func DefaultConcepts() []ConceptDef {
	return []ConceptDef{
		employeeMasterConcept(),
		salaryHistoryConcept(),
		payrollRunConcept(),
		leaveBalanceConcept(),
		employmentTimelineConcept(),
		attendanceConcept(),
		benefitDeductionConcept(),
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "table_name:salary",
				Description: "Table name contains salary/compensation/pay terms",
				Weight:      1.0,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return tableNameContains(t, []string{"salary", "compensation", "pay_slip", "payslip"})
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return tableNameContains(t, []string{"payroll"})
				},
			},
			{
				Name:        "columns:batch_processing",
				Description: "Has batch/aggregate count columns",
				Weight:      1.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "columns:posting",
				Description: "Has posting/processing date column",
				Weight:      0.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{"posting_date", "process_date"})
				},
			},
			{
				Name:        "type_ratio:decimal",
				Description: "Has decimal columns for totals",
				Weight:      0.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return tableNameContains(t, []string{"leave"})
				},
			},
			{
				Name:        "columns:allocation",
				Description: "Has allocation/balance/entitlement columns",
				Weight:      1.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{
						"total_leave_days", "leave_days",
					})
				},
			},
			{
				Name:        "pattern:date_range",
				Description: "Has date range (leave period)",
				Weight:      0.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return hasDateRangePattern(t)
				},
			},
			{
				Name:        "columns:leave_type",
				Description: "Has leave type reference column",
				Weight:      0.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return hasColumnMatching(t, []string{"leave_type"})
				},
			},
			{
				Name:        "link:employee",
				Description: "Has link to employee-like entity",
				Weight:      0.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return tableNameContains(t, []string{"attendance", "checkin", "check_in"})
				},
			},
			{
				Name:        "columns:attendance",
				Description: "Has attendance-specific columns",
				Weight:      1.5,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
					return tableNameContains(t, []string{
						"benefit", "incentive", "tax exemption", "tax_exemption",
					})
				},
			},
			{
				Name:        "columns:benefit_specific",
				Description: "Has benefit-specific columns (max_benefit, claim_amount, premium)",
				Weight:      1.0,
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
				Detect: func(t TableInfo, _ []TableInfo) (bool, string) {
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
