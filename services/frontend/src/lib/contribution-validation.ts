/**
 * Contribution file validation engine — pure functions for validating employer CSV rows.
 * Cross-checks rows against employee roster for member identity, salary, and contribution math.
 * Consumed by: ContributionUpload page, contribution-validation.test.ts
 * Depends on: Employer.ts types, employer-demo-data.ts (roster data via caller)
 */
import type {
  ContributionFileRow, RowValidationResult, ValidationIssue, ValidationSummary,
  EmployerEmployee,
} from '@/types/Employer'

// Contribution rates from RMC §18-407
export const EMPLOYEE_RATE = 0.0845
export const EMPLOYER_RATE = 0.1795
// Tolerance for contribution math check (±$0.01)
export const CONTRIBUTION_TOLERANCE = 0.01
// Salary deviation thresholds — warning at 10%, error at 20%
export const SALARY_WARNING_THRESHOLD = 0.10
export const SALARY_ERROR_THRESHOLD = 0.20

let issueCounter = 0
function nextIssueId(): string {
  return `ISS-${++issueCounter}`
}
/** Reset issue counter — for test isolation */
export function resetIssueCounter(): void {
  issueCounter = 0
}

/**
 * Validate a single contribution file row against the employee roster.
 * Returns a RowValidationResult with any issues found.
 */
export function validateRow(
  row: ContributionFileRow,
  rowIndex: number,
  roster: EmployerEmployee[],
): RowValidationResult {
  const issues: ValidationIssue[] = []
  const employee = roster.find(e => e.member_id === row.member_id)

  // Rule 1: Member must exist in roster
  if (!employee) {
    issues.push({
      issue_id: nextIssueId(), field: 'member_id', severity: 'error',
      message: `Member ${row.member_id} not found in employee roster`,
      expected: 'Valid member ID', actual: row.member_id, resolved: false,
    })
    // Can't validate further without roster match
    return {
      row_index: rowIndex,
      status: 'error',
      issues,
      corrections: {},
      acknowledged_warnings: [],
    }
  }

  // Rule 2: Name match (case-insensitive)
  const expectedName = `${employee.first_name} ${employee.last_name}`
  if (row.name.toLowerCase() !== expectedName.toLowerCase()) {
    issues.push({
      issue_id: nextIssueId(), field: 'name', severity: 'warning',
      message: `Name mismatch: file has "${row.name}", roster has "${expectedName}"`,
      expected: expectedName, actual: row.name, resolved: false,
    })
  }

  // Rule 3: Department match
  if (row.department !== employee.department) {
    issues.push({
      issue_id: nextIssueId(), field: 'department', severity: 'error',
      message: `Department mismatch: file has "${row.department}", roster has "${employee.department}"`,
      expected: employee.department, actual: row.department, resolved: false,
    })
  }

  // Rule 4: Tier match
  if (row.tier !== employee.tier) {
    issues.push({
      issue_id: nextIssueId(), field: 'tier', severity: 'error',
      message: `Tier mismatch: file has Tier ${row.tier}, roster has Tier ${employee.tier}`,
      expected: String(employee.tier), actual: String(row.tier), resolved: false,
    })
  }

  // Rule 5: Salary deviation check (pensionable earnings vs monthly salary)
  const salaryDeviation = Math.abs(row.pensionable_earnings - employee.monthly_salary) / employee.monthly_salary
  if (salaryDeviation > SALARY_ERROR_THRESHOLD) {
    issues.push({
      issue_id: nextIssueId(), field: 'pensionable_earnings', severity: 'error',
      message: `Pensionable earnings $${row.pensionable_earnings.toFixed(2)} deviates ${(salaryDeviation * 100).toFixed(1)}% from expected $${employee.monthly_salary.toFixed(2)}`,
      expected: employee.monthly_salary.toFixed(2), actual: row.pensionable_earnings.toFixed(2), resolved: false,
    })
  } else if (salaryDeviation > SALARY_WARNING_THRESHOLD) {
    issues.push({
      issue_id: nextIssueId(), field: 'pensionable_earnings', severity: 'warning',
      message: `Pensionable earnings $${row.pensionable_earnings.toFixed(2)} deviates ${(salaryDeviation * 100).toFixed(1)}% from expected $${employee.monthly_salary.toFixed(2)}`,
      expected: employee.monthly_salary.toFixed(2), actual: row.pensionable_earnings.toFixed(2), resolved: false,
    })
  }

  // Rule 6: Employee contribution math (pensionable × 8.45%)
  const expectedEE = row.pensionable_earnings * EMPLOYEE_RATE
  if (Math.abs(row.employee_contribution - expectedEE) > CONTRIBUTION_TOLERANCE) {
    issues.push({
      issue_id: nextIssueId(), field: 'employee_contribution', severity: 'error',
      message: `Employee contribution $${row.employee_contribution.toFixed(2)} doesn't match ${row.pensionable_earnings.toFixed(2)} × 8.45% = $${expectedEE.toFixed(2)}`,
      expected: expectedEE.toFixed(2), actual: row.employee_contribution.toFixed(2), resolved: false,
    })
  }

  // Rule 7: Employer contribution math (pensionable × 17.95%)
  const expectedER = row.pensionable_earnings * EMPLOYER_RATE
  if (Math.abs(row.employer_contribution - expectedER) > CONTRIBUTION_TOLERANCE) {
    issues.push({
      issue_id: nextIssueId(), field: 'employer_contribution', severity: 'error',
      message: `Employer contribution $${row.employer_contribution.toFixed(2)} doesn't match ${row.pensionable_earnings.toFixed(2)} × 17.95% = $${expectedER.toFixed(2)}`,
      expected: expectedER.toFixed(2), actual: row.employer_contribution.toFixed(2), resolved: false,
    })
  }

  const hasError = issues.some(i => i.severity === 'error')
  const hasWarning = issues.some(i => i.severity === 'warning')

  return {
    row_index: rowIndex,
    status: hasError ? 'error' : hasWarning ? 'warning' : 'clean',
    issues,
    corrections: {},
    acknowledged_warnings: [],
  }
}

/**
 * Validate an entire contribution file. Runs per-row validation + duplicate detection.
 */
export function validateFile(
  rows: ContributionFileRow[],
  roster: EmployerEmployee[],
): RowValidationResult[] {
  const results = rows.map((row, i) => validateRow(row, i, roster))

  // Rule 8: Duplicate member_id detection
  const seen = new Map<string, number>()
  for (let i = 0; i < rows.length; i++) {
    const mid = rows[i].member_id
    if (seen.has(mid)) {
      // Add duplicate issue to the second occurrence
      results[i].issues.push({
        issue_id: nextIssueId(), field: 'member_id', severity: 'error',
        message: `Duplicate member_id ${mid} — already appears in row ${seen.get(mid)! + 1}`,
        expected: 'Unique member ID per file', actual: mid, resolved: false,
      })
      results[i].status = 'error'
    } else {
      seen.set(mid, i)
    }
  }

  return results
}

/**
 * Compute aggregate validation summary from rows and their results.
 */
export function computeValidationSummary(
  rows: ContributionFileRow[],
  results: RowValidationResult[],
): ValidationSummary {
  let clean = 0, warning = 0, error = 0, totalIssues = 0
  for (const r of results) {
    if (r.status === 'clean') clean++
    else if (r.status === 'warning') warning++
    else error++
    totalIssues += r.issues.length
  }

  return {
    total_rows: rows.length,
    clean_rows: clean,
    warning_rows: warning,
    error_rows: error,
    total_issues: totalIssues,
    total_payroll: rows.reduce((s, r) => s + r.pensionable_earnings, 0),
    total_ee_contributions: rows.reduce((s, r) => s + r.employee_contribution, 0),
    total_er_contributions: rows.reduce((s, r) => s + r.employer_contribution, 0),
  }
}

/**
 * Re-validate a single row after corrections are applied.
 * Merges corrections into the original row, then validates fresh.
 */
export function revalidateRow(
  originalRow: ContributionFileRow,
  corrections: Record<string, string | number>,
  rowIndex: number,
  roster: EmployerEmployee[],
): RowValidationResult {
  // Build corrected row — overlay corrections onto original
  const correctedRow = { ...originalRow }
  for (const [field, value] of Object.entries(corrections)) {
    if (field in correctedRow) {
      (correctedRow as Record<string, unknown>)[field] = value
    }
  }

  const result = validateRow(correctedRow, rowIndex, roster)
  // Preserve corrections map so UI knows what was changed
  result.corrections = { ...corrections }
  return result
}

/**
 * Check if all validation issues are resolved — ready to post.
 * True when: no unresolved errors AND all warnings are either resolved or acknowledged.
 */
export function isReadyToPost(results: RowValidationResult[]): boolean {
  for (const r of results) {
    for (const issue of r.issues) {
      if (issue.severity === 'error' && !issue.resolved) return false
      if (issue.severity === 'warning' && !issue.resolved && !r.acknowledged_warnings.includes(issue.issue_id)) {
        return false
      }
    }
  }
  return true
}
