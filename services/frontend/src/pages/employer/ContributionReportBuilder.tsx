/**
 * Contribution Report Builder — manual report creation with employee selection,
 * per-employee contribution entry, new hire/termination reporting, and validation.
 * Consumed by: router.tsx (/employer/contributions/new)
 * Depends on: employerDemoApi, useEmployerAuth, fmt, employerTheme, Employer types
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerDemoApi, EMPLOYEE_RATE, EMPLOYER_RATE, DEMO_EMPLOYER_EMPLOYEES } from '@/api/employer-demo-data'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { EmployerEmployee } from '@/types/Employer'

interface ContributionRow {
  member_id: string
  name: string
  gross_earnings: number
  pensionable_earnings: number
  ee_contribution: number
  er_contribution: number
  status: 'active' | 'new_hire' | 'terminated'
  hire_date?: string
  termination_date?: string
  errors: string[]
}

interface ValidationResult {
  valid: boolean
  issues: Array<{ row: number; field: string; message: string; severity: 'error' | 'warning' }>
}

function buildRowFromEmployee(emp: EmployerEmployee): ContributionRow {
  const gross = emp.monthly_salary
  const ee = Math.round(gross * EMPLOYEE_RATE * 100) / 100
  const er = Math.round(gross * EMPLOYER_RATE * 100) / 100
  return {
    member_id: emp.member_id,
    name: `${emp.first_name} ${emp.last_name}`,
    gross_earnings: gross,
    pensionable_earnings: gross,
    ee_contribution: ee,
    er_contribution: er,
    status: 'active',
    errors: [],
  }
}

function validateRows(rows: ContributionRow[]): ValidationResult {
  const issues: ValidationResult['issues'] = []
  rows.forEach((row, i) => {
    if (!row.member_id) issues.push({ row: i, field: 'member_id', message: 'Member ID is required', severity: 'error' })
    if (!row.name) issues.push({ row: i, field: 'name', message: 'Name is required', severity: 'error' })
    if (row.gross_earnings <= 0) issues.push({ row: i, field: 'gross_earnings', message: 'Gross earnings must be positive', severity: 'error' })
    if (row.pensionable_earnings <= 0) issues.push({ row: i, field: 'pensionable_earnings', message: 'Pensionable earnings must be positive', severity: 'error' })
    // EE contribution check (8.45% of pensionable)
    const expectedEE = Math.round(row.pensionable_earnings * EMPLOYEE_RATE * 100) / 100
    if (Math.abs(row.ee_contribution - expectedEE) > 0.01) {
      issues.push({ row: i, field: 'ee_contribution', message: `Expected ${fmt(expectedEE)} (8.45% of ${fmt(row.pensionable_earnings)})`, severity: 'error' })
    }
    // ER contribution check (17.95% of pensionable)
    const expectedER = Math.round(row.pensionable_earnings * EMPLOYER_RATE * 100) / 100
    if (Math.abs(row.er_contribution - expectedER) > 0.01) {
      issues.push({ row: i, field: 'er_contribution', message: `Expected ${fmt(expectedER)} (17.95% of ${fmt(row.pensionable_earnings)})`, severity: 'error' })
    }
    if (row.status === 'new_hire' && !row.hire_date) {
      issues.push({ row: i, field: 'hire_date', message: 'Hire date required for new employees', severity: 'error' })
    }
    if (row.status === 'terminated' && !row.termination_date) {
      issues.push({ row: i, field: 'termination_date', message: 'Termination date required', severity: 'error' })
    }
  })
  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues }
}


export function ContributionReportBuilder() {
  const { deptId } = useEmployerAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const copyFrom = searchParams.get('copy')

  // Report metadata
  const [period, setPeriod] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [isBlank, setIsBlank] = useState(false)

  // Employee roster for department — direct from fixture constant
  const roster = DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === deptId)
  const activeRoster = roster.filter(e => e.status === 'active')

  // Initialize rows from active roster
  const [rows, setRows] = useState<ContributionRow[]>(() =>
    activeRoster.map(buildRowFromEmployee)
  )

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    new Set(activeRoster.map(e => e.member_id))
  )
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showAddHire, setShowAddHire] = useState(false)
  const [newHire, setNewHire] = useState({ member_id: '', first_name: '', last_name: '', hire_date: '', salary: 0 })

  // Toggle blank report — reset rows
  function handleBlankToggle(checked: boolean) {
    setIsBlank(checked)
    if (checked) {
      setRows([])
      setSelectedIds(new Set())
    } else {
      const initial = activeRoster.map(buildRowFromEmployee)
      setRows(initial)
      setSelectedIds(new Set(initial.map(r => r.member_id)))
    }
  }

  function toggleEmployee(emp: EmployerEmployee) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(emp.member_id)) {
        next.delete(emp.member_id)
        setRows(r => r.filter(row => row.member_id !== emp.member_id))
      } else {
        next.add(emp.member_id)
        setRows(r => [...r, buildRowFromEmployee(emp)])
      }
      return next
    })
  }

  function updateRow(idx: number, field: keyof ContributionRow, value: number | string) {
    setRows(prev => {
      const updated = [...prev]
      const row = { ...updated[idx], [field]: value }
      // Auto-recalculate contributions when pensionable changes
      if (field === 'pensionable_earnings') {
        const pe = Number(value)
        row.ee_contribution = Math.round(pe * EMPLOYEE_RATE * 100) / 100
        row.er_contribution = Math.round(pe * EMPLOYER_RATE * 100) / 100
      }
      updated[idx] = row
      return updated
    })
    setValidation(null)
  }

  function markTerminated(idx: number) {
    setRows(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], status: 'terminated' }
      return updated
    })
  }

  function removeRow(idx: number) {
    const row = rows[idx]
    setSelectedIds(prev => { const next = new Set(prev); next.delete(row.member_id); return next })
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  function addNewHire() {
    if (!newHire.member_id || !newHire.first_name || !newHire.last_name) return
    const salary = newHire.salary || 0
    const ee = Math.round(salary * EMPLOYEE_RATE * 100) / 100
    const er = Math.round(salary * EMPLOYER_RATE * 100) / 100
    setRows(prev => [...prev, {
      member_id: newHire.member_id,
      name: `${newHire.first_name} ${newHire.last_name}`,
      gross_earnings: salary,
      pensionable_earnings: salary,
      ee_contribution: ee,
      er_contribution: er,
      status: 'new_hire',
      hire_date: newHire.hire_date,
      errors: [],
    }])
    setSelectedIds(prev => new Set(prev).add(newHire.member_id))
    setNewHire({ member_id: '', first_name: '', last_name: '', hire_date: '', salary: 0 })
    setShowAddHire(false)
  }

  function handleValidate() {
    setValidation(validateRows(rows))
  }

  function handleSubmit() {
    const result = validateRows(rows)
    setValidation(result)
    if (!result.valid) return

    const totalGross = rows.reduce((s, r) => s + r.gross_earnings, 0)
    const totalEE = rows.reduce((s, r) => s + r.ee_contribution, 0)
    const totalER = rows.reduce((s, r) => s + r.er_contribution, 0)

    employerDemoApi.addContributionReport({
      report_id: `CR-${period}-${deptId}-${Date.now()}`,
      period,
      department: deptId,
      employee_count: rows.length,
      total_gross_payroll: totalGross,
      total_employee_contributions: totalEE,
      total_employer_contributions: totalER,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    setSubmitted(true)
  }

  // Summary calculations
  const totalGross = rows.reduce((s, r) => s + r.gross_earnings, 0)
  const totalEE = rows.reduce((s, r) => s + r.ee_contribution, 0)
  const totalER = rows.reduce((s, r) => s + r.er_contribution, 0)

  if (submitted) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 20px', textAlign: 'center' as const }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', background: T.status.successBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 24, color: T.status.success,
        }}>{'\u2713'}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: T.text.primary, marginBottom: 8 }}>
          Report Submitted
        </div>
        <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 24 }}>
          Period {period} &middot; {rows.length} employees &middot; {fmt(totalGross)} gross payroll
        </div>
        <button onClick={() => navigate('/employer/contributions')} style={{
          padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: T.accent.primary, color: T.accent.on, border: 'none', cursor: 'pointer',
        }}>Back to Reports</button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <button onClick={() => navigate('/employer/contributions')} style={{
            background: 'none', border: 'none', color: T.accent.primary, cursor: 'pointer',
            fontSize: 11, padding: 0, marginBottom: 4, display: 'block',
          }}>&larr; Back to Contribution Reports</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary }}>
            {copyFrom ? 'Copy from Prior Report' : 'Create Contribution Report'}
          </div>
        </div>
      </div>

      {/* Report settings */}
      <div style={{
        background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
        padding: 16, marginBottom: 16, boxShadow: T.shadow,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' as const }}>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>
              Report Period
            </div>
            <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{
              padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border.base}`,
              fontSize: 13, color: T.text.primary, background: T.surface.bg, fontFamily: 'inherit',
            }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>
              Rates
            </div>
            <div style={{ fontSize: 12, color: T.text.secondary }}>
              EE: <strong>8.45%</strong> &middot; ER: <strong>17.95%</strong>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginLeft: 'auto' }}>
            <input type="checkbox" checked={isBlank} onChange={e => handleBlankToggle(e.target.checked)} />
            <span style={{ fontSize: 12, color: T.text.secondary }}>Blank report (start empty)</span>
          </label>
        </div>
        {/* Summary bar */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border.subtle}`,
        }}>
          <MiniStat label="Employees" value={String(rows.length)} />
          <MiniStat label="Gross Payroll" value={fmt(totalGross)} />
          <MiniStat label="EE Total" value={fmt(totalEE)} />
          <MiniStat label="ER Total" value={fmt(totalER)} />
        </div>
      </div>

      {/* Employee selection panel — only if not blank */}
      {!isBlank && (
        <div style={{
          background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
          padding: 16, marginBottom: 16, boxShadow: T.shadow,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text.primary }}>Active Employees</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowAddHire(true)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: T.status.successBg, color: T.status.success,
                border: `1px solid ${T.status.success}30`, cursor: 'pointer',
              }}>+ Report New Hire</button>
              <button onClick={() => {
                const all = activeRoster
                const allSelected = all.every(e => selectedIds.has(e.member_id))
                if (allSelected) {
                  setSelectedIds(new Set())
                  setRows(prev => prev.filter(r => r.status === 'new_hire'))
                } else {
                  const existingNewHires = rows.filter(r => r.status === 'new_hire')
                  setSelectedIds(new Set(all.map(e => e.member_id)))
                  setRows([...all.map(buildRowFromEmployee), ...existingNewHires])
                }
              }} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                background: 'transparent', color: T.text.secondary,
                border: `1px solid ${T.border.base}`, cursor: 'pointer',
              }}>
                {activeRoster.every(e => selectedIds.has(e.member_id))
                  ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {activeRoster.map(emp => {
              const selected = selectedIds.has(emp.member_id)
              return (
                <button key={emp.member_id} onClick={() => toggleEmployee(emp)} style={{
                  padding: '5px 10px', borderRadius: 6, fontSize: 11,
                  border: `1px solid ${selected ? T.accent.primary : T.border.subtle}`,
                  background: selected ? T.accent.surface : 'transparent',
                  color: selected ? T.accent.primary : T.text.secondary,
                  cursor: 'pointer', fontWeight: selected ? 600 : 400,
                }}>
                  {emp.first_name} {emp.last_name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* New hire form */}
      {showAddHire && (
        <div style={{
          background: T.surface.card, borderRadius: 10, border: `1px solid ${T.status.success}`,
          padding: 16, marginBottom: 16, boxShadow: T.shadow,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.status.success, marginBottom: 12 }}>
            Report New Hire
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <FieldInput label="Member ID" value={newHire.member_id} onChange={v => setNewHire(p => ({ ...p, member_id: v }))} />
            <FieldInput label="First Name" value={newHire.first_name} onChange={v => setNewHire(p => ({ ...p, first_name: v }))} />
            <FieldInput label="Last Name" value={newHire.last_name} onChange={v => setNewHire(p => ({ ...p, last_name: v }))} />
            <FieldInput label="Hire Date" value={newHire.hire_date} onChange={v => setNewHire(p => ({ ...p, hire_date: v }))} type="date" />
            <FieldInput label="Monthly Salary" value={String(newHire.salary || '')} onChange={v => setNewHire(p => ({ ...p, salary: Number(v) || 0 }))} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addNewHire} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: T.status.success, color: '#ffffff', border: 'none', cursor: 'pointer',
            }}>Add Employee</button>
            <button onClick={() => setShowAddHire(false)} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 11,
              background: 'transparent', border: `1px solid ${T.border.base}`,
              color: T.text.secondary, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Contribution detail rows */}
      {rows.length > 0 && (
        <div style={{
          background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
          overflow: 'hidden', marginBottom: 16, boxShadow: T.shadow,
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '140px 1fr 1fr 1fr 1fr 80px 60px',
            gap: 8, padding: '10px 14px', background: T.surface.cardAlt,
            borderBottom: `1px solid ${T.border.subtle}`,
          }}>
            {['Employee', 'Gross', 'Pensionable', 'EE (8.45%)', 'ER (17.95%)', 'Status', ''].map(h => (
              <div key={h} style={{
                fontSize: 9, fontWeight: 600, color: T.text.muted,
                textTransform: 'uppercase' as const, letterSpacing: 0.5,
              }}>{h}</div>
            ))}
          </div>

          {/* Data rows */}
          {rows.map((row, idx) => {
            const rowIssues = validation?.issues.filter(i => i.row === idx) || []
            const hasError = rowIssues.some(i => i.severity === 'error')
            return (
              <div key={row.member_id} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 1fr 1fr 1fr 80px 60px',
                gap: 8, padding: '8px 14px', alignItems: 'center',
                borderBottom: `1px solid ${T.border.subtle}`,
                background: hasError ? T.status.dangerBg : 'transparent',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>{row.name}</div>
                  <div style={{ fontSize: 10, color: T.text.muted }}>ID {row.member_id}</div>
                </div>
                <NumInput value={row.gross_earnings} onChange={v => updateRow(idx, 'gross_earnings', v)}
                  error={rowIssues.some(i => i.field === 'gross_earnings')} />
                <NumInput value={row.pensionable_earnings} onChange={v => updateRow(idx, 'pensionable_earnings', v)}
                  error={rowIssues.some(i => i.field === 'pensionable_earnings')} />
                <NumInput value={row.ee_contribution} onChange={v => updateRow(idx, 'ee_contribution', v)}
                  error={rowIssues.some(i => i.field === 'ee_contribution')} />
                <NumInput value={row.er_contribution} onChange={v => updateRow(idx, 'er_contribution', v)}
                  error={rowIssues.some(i => i.field === 'er_contribution')} />
                <div>
                  {row.status === 'new_hire' ? (
                    <span style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 10, fontWeight: 600,
                      background: T.status.successBg, color: T.status.success,
                      textTransform: 'uppercase' as const,
                    }}>New Hire</span>
                  ) : row.status === 'terminated' ? (
                    <span style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 10, fontWeight: 600,
                      background: T.status.dangerBg, color: T.status.danger,
                      textTransform: 'uppercase' as const,
                    }}>Term</span>
                  ) : (
                    <button onClick={() => markTerminated(idx)} title="Mark terminated" style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 10,
                      background: 'transparent', border: `1px solid ${T.border.subtle}`,
                      color: T.text.muted, cursor: 'pointer',
                    }}>Active</button>
                  )}
                </div>
                <button onClick={() => removeRow(idx)} title="Remove" style={{
                  background: 'none', border: 'none', color: T.text.muted,
                  cursor: 'pointer', fontSize: 14,
                }}>{'\u00D7'}</button>
              </div>
            )
          })}
        </div>
      )}

      {/* Validation issues */}
      {validation && validation.issues.length > 0 && (
        <div style={{
          background: T.status.dangerBg, borderRadius: 10,
          border: `1px solid ${T.status.danger}30`, padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.status.danger, marginBottom: 8 }}>
            Validation Issues ({validation.issues.length})
          </div>
          {validation.issues.map((issue, i) => (
            <div key={i} style={{ fontSize: 11, color: T.status.danger, marginBottom: 4 }}>
              Row {issue.row + 1} ({rows[issue.row]?.name}) &mdash; {issue.field}: {issue.message}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && (
        <div style={{
          textAlign: 'center' as const, padding: 40, color: T.text.muted, fontSize: 13,
        }}>
          {isBlank
            ? 'Blank report — use "Report New Hire" to add employees, or uncheck "Blank report" to load active roster.'
            : 'Select employees above to include them in this report.'}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/employer/contributions')} style={{
          padding: '8px 20px', borderRadius: 6, fontSize: 12,
          background: 'transparent', border: `1px solid ${T.border.base}`,
          color: T.text.secondary, cursor: 'pointer',
        }}>Cancel</button>
        <button onClick={handleValidate} style={{
          padding: '8px 20px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: 'transparent', border: `1px solid ${T.accent.primary}`,
          color: T.accent.primary, cursor: 'pointer',
        }}>Validate</button>
        <button onClick={handleSubmit} style={{
          padding: '8px 20px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: rows.length > 0 ? T.accent.primary : T.border.subtle,
          color: rows.length > 0 ? T.accent.on : T.text.muted,
          border: 'none', cursor: rows.length > 0 ? 'pointer' : 'default',
        }}>Submit Report</button>
      </div>
    </div>
  )
}


function NumInput({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: boolean }) {
  return (
    <input
      type="number" step="0.01" value={value || ''}
      onChange={e => onChange(Number(e.target.value) || 0)}
      style={{
        width: '100%', padding: '4px 8px', fontSize: 12, borderRadius: 4,
        border: `1px solid ${error ? '#dc2626' : '#e2e8f0'}`,
        background: error ? '#fef2f2' : '#ffffff', color: '#1e293b',
        fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' as const,
        boxSizing: 'border-box' as const,
      }}
    />
  )
}

function FieldInput({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <div style={{
        fontSize: 9, color: employerTheme.text.muted, textTransform: 'uppercase' as const,
        letterSpacing: 0.5, marginBottom: 3, fontWeight: 600,
      }}>{label}</div>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} style={{
        width: '100%', padding: '6px 8px', fontSize: 12, borderRadius: 4,
        border: `1px solid ${employerTheme.border.base}`, background: employerTheme.surface.bg,
        color: employerTheme.text.primary, fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
      }} />
    </div>
  )
}

const employerTheme = T

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: 9, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</div>
    </div>
  )
}
