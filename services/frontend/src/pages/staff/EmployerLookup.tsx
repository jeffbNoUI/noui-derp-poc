/**
 * Employer Lookup — 360-degree employer profile view with department cards,
 * employee roster, contribution history, and user account admin (RBAC).
 * Consumed by: router.tsx (staff/employers and staff/employers/:deptId routes)
 * Depends on: theme (C, tierMeta, fmt), Badge, employer-demo-data fixtures
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { fmt } from '@/lib/constants'
import {
  DEMO_DEPARTMENTS, DEMO_EMPLOYER_EMPLOYEES, DEMO_CONTRIBUTION_REPORTS,
  DEMO_PENDING_RETIREMENTS,
} from '@/api/employer-demo-data'
import type { Department } from '@/types/Employer'

// ─── Employer Directory ──────────────────────────────────────────────────────

export function EmployerLookup() {
  const { deptId } = useParams()

  if (deptId) return <EmployerProfile deptId={deptId} />
  return <EmployerDirectory />
}

function EmployerDirectory() {
  const navigate = useNavigate()

  const totalEmployees = DEMO_DEPARTMENTS.reduce((s, d) => s + d.employee_count, 0)
  const totalPayroll = DEMO_DEPARTMENTS.reduce((s, d) => s + d.monthly_payroll, 0)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: C.text, fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Employer Lookup
          </div>
          <div style={{ color: C.textSecondary, fontSize: '11px' }}>
            Department profiles, employee rosters, contribution history, and user administration.
          </div>
        </div>

        {/* Summary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px',
        }}>
          <StatCard label="Departments" value={String(DEMO_DEPARTMENTS.length)} />
          <StatCard label="Total Employees" value={String(totalEmployees)} />
          <StatCard label="Monthly Payroll" value={fmt(totalPayroll)} />
        </div>

        {/* Department cards */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
          {DEMO_DEPARTMENTS.map(dept => (
            <DepartmentCard key={dept.dept_id} dept={dept} onClick={() => navigate(`/staff/employers/${dept.dept_id}`)} />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '12px', background: C.surface, borderRadius: '8px',
      border: `1px solid ${C.borderSubtle}`, textAlign: 'center' as const,
    }}>
      <div style={{ color: C.accent, fontSize: '18px', fontWeight: 700, fontFamily: "'SF Mono',monospace" }}>
        {value}
      </div>
      <div style={{ color: C.textMuted, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '1px', marginTop: '2px' }}>
        {label}
      </div>
    </div>
  )
}

function DepartmentCard({ dept, onClick }: { dept: Department; onClick: () => void }) {
  const pending = DEMO_PENDING_RETIREMENTS.filter(r => r.department === dept.dept_id)
  const reports = DEMO_CONTRIBUTION_REPORTS.filter(r => r.department === dept.dept_id)
  const submitted = reports.filter(r => r.status === 'submitted').length

  return (
    <button onClick={onClick} style={{
      padding: '16px', background: C.surface,
      border: `1px solid ${C.borderSubtle}`, borderRadius: '10px',
      cursor: 'pointer', textAlign: 'left' as const, width: '100%',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = C.accent)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '14px' }}>{dept.name}</span>
          <span style={{ color: C.textDim, fontSize: '10px', marginLeft: '8px' }}>{dept.code}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {pending.length > 0 && <Badge text={`${pending.length} Retiring`} bg={C.warmMuted} color={C.warm} />}
          {submitted > 0 && <Badge text={`${submitted} Pending`} bg={C.accentMuted} color={C.accent} />}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: C.textSecondary }}>
        <span>{dept.employee_count} employees</span>
        <span>{fmt(dept.monthly_payroll)}/mo payroll</span>
        <span>{dept.contact_name}</span>
      </div>
    </button>
  )
}

// ─── Employer Profile ────────────────────────────────────────────────────────

// Mock user accounts for RBAC administration
const MOCK_USERS: Record<string, Array<{ name: string; email: string; role: string; lastLogin: string }>> = {
  PW: [
    { name: 'Sarah Mitchell', email: 's.mitchell@denver.gov', role: 'Admin', lastLogin: '2026-02-26' },
    { name: 'John Reeves', email: 'j.reeves@denver.gov', role: 'Payroll Clerk', lastLogin: '2026-02-25' },
    { name: 'Amy Foster', email: 'a.foster@denver.gov', role: 'Viewer', lastLogin: '2026-02-20' },
  ],
  PR: [
    { name: 'Michael Torres', email: 'm.torres@denver.gov', role: 'Admin', lastLogin: '2026-02-26' },
    { name: 'Diana Ross', email: 'd.ross@denver.gov', role: 'Payroll Clerk', lastLogin: '2026-02-24' },
  ],
  FIN: [
    { name: 'Lisa Chang', email: 'l.chang@denver.gov', role: 'Admin', lastLogin: '2026-02-26' },
    { name: 'Mark Evans', email: 'm.evans@denver.gov', role: 'Payroll Clerk', lastLogin: '2026-02-25' },
    { name: 'Rachel Kim', email: 'r.kim@denver.gov', role: 'Viewer', lastLogin: '2026-02-22' },
  ],
}

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  Admin: { bg: '#7c3aed20', color: '#7c3aed' },
  'Payroll Clerk': { bg: C.accentMuted, color: C.accent },
  Viewer: { bg: `${C.textDim}20`, color: C.textMuted },
}

function EmployerProfile({ deptId }: { deptId: string }) {
  const navigate = useNavigate()
  const dept = DEMO_DEPARTMENTS.find(d => d.dept_id === deptId)
  const employees = DEMO_EMPLOYER_EMPLOYEES.filter(e => e.department === deptId)
  const reports = DEMO_CONTRIBUTION_REPORTS.filter(r => r.department === deptId)
  const pending = DEMO_PENDING_RETIREMENTS.filter(r => r.department === deptId)
  const users = MOCK_USERS[deptId] || []
  const [activeTab, setActiveTab] = useState<'roster' | 'contributions' | 'users'>('roster')

  if (!dept) {
    return (
      <div style={{ padding: '24px', color: C.textMuted, fontSize: '12px' }}>
        Department not found.{' '}
        <button onClick={() => navigate('/staff/employers')} style={{
          background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: '12px',
        }}>Back to Employer Lookup</button>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Back link */}
        <button onClick={() => navigate('/staff/employers')} style={{
          background: 'none', border: 'none', color: C.accent, cursor: 'pointer',
          fontSize: '11px', padding: 0, marginBottom: '12px',
        }}>&larr; Back to Employer Lookup</button>

        {/* Header */}
        <div style={{
          padding: '16px', background: C.surface, borderRadius: '10px',
          border: `1px solid ${C.borderSubtle}`, marginBottom: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: C.text, fontWeight: 700, fontSize: '16px' }}>{dept.name}</div>
              <div style={{ color: C.textSecondary, fontSize: '11px', marginTop: '2px' }}>
                {dept.contact_name} &middot; {dept.contact_email}
              </div>
            </div>
            {pending.length > 0 && (
              <Badge text={`${pending.length} Pending Retirements`} bg={C.warmMuted} color={C.warm} />
            )}
          </div>
          {/* Stats row */}
          <div style={{
            display: 'flex', gap: '20px', marginTop: '12px', paddingTop: '10px',
            borderTop: `1px solid ${C.borderSubtle}`,
          }}>
            <MiniStat label="Employees" value={String(employees.length)} />
            <MiniStat label="Monthly Payroll" value={fmt(dept.monthly_payroll)} />
            <MiniStat label="EE Rate" value="8.45%" />
            <MiniStat label="ER Rate" value="17.95%" />
            <MiniStat label="Avg Service" value={`${(employees.reduce((s, e) => s + e.years_of_service, 0) / employees.length).toFixed(1)}y`} />
          </div>
        </div>

        {/* Tab nav */}
        <div style={{
          display: 'flex', gap: '2px', marginBottom: '12px', borderBottom: `1px solid ${C.borderSubtle}`,
        }}>
          {(['roster', 'contributions', 'users'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? C.accent : C.textMuted,
              background: activeTab === tab ? C.accentMuted : 'transparent',
              borderRadius: '6px 6px 0 0',
              textTransform: 'capitalize' as const,
            }}>{tab === 'users' ? 'User Accounts' : tab}</button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'roster' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            {employees.map(emp => {
              const t = tierMeta[emp.tier]
              return (
                <button key={emp.member_id} onClick={() => navigate(`/staff/members/${emp.member_id}`)} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', background: C.surface,
                  border: `1px solid ${C.borderSubtle}`, borderRadius: '8px',
                  cursor: 'pointer', textAlign: 'left' as const, width: '100%',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
                >
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: t.muted, color: t.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, flexShrink: 0,
                  }}>{emp.first_name[0]}{emp.last_name[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: C.text, fontWeight: 600, fontSize: '12px' }}>
                        {emp.first_name} {emp.last_name}
                      </span>
                      <Badge text={`T${emp.tier}`} bg={t.muted} color={t.color} />
                    </div>
                    <div style={{ color: C.textMuted, fontSize: '10px' }}>
                      ID {emp.member_id} &middot; Hired {emp.hire_date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                    <div style={{ color: C.text, fontSize: '12px', fontWeight: 600, fontFamily: "'SF Mono',monospace" }}>
                      {fmt(emp.monthly_salary)}
                    </div>
                    <div style={{ color: C.textMuted, fontSize: '10px' }}>{emp.years_of_service.toFixed(1)}y</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {activeTab === 'contributions' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            {reports.length === 0 && (
              <div style={{ color: C.textMuted, fontSize: '12px', padding: '20px', textAlign: 'center' as const }}>
                No contribution reports found.
              </div>
            )}
            {reports.map(r => {
              const statusColors: Record<string, { bg: string; color: string }> = {
                verified: { bg: C.successMuted, color: C.success },
                submitted: { bg: C.accentMuted, color: C.accent },
                draft: { bg: `${C.textDim}20`, color: C.textMuted },
                discrepancy: { bg: C.dangerMuted, color: C.danger },
              }
              const sc = statusColors[r.status] || statusColors.draft
              return (
                <div key={r.report_id} style={{
                  padding: '12px', background: C.surface,
                  border: `1px solid ${C.borderSubtle}`, borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ color: C.text, fontWeight: 600, fontSize: '12px' }}>
                      {r.period}
                    </div>
                    <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>
                      {r.employee_count} employees &middot; {fmt(r.total_gross_payroll)} gross
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ textAlign: 'right' as const }}>
                      <div style={{ color: C.textSecondary, fontSize: '10px' }}>EE {fmt(r.total_employee_contributions)}</div>
                      <div style={{ color: C.textSecondary, fontSize: '10px' }}>ER {fmt(r.total_employer_contributions)}</div>
                    </div>
                    <Badge text={r.status} bg={sc.bg} color={sc.color} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div style={{
              marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ color: C.textSecondary, fontSize: '11px' }}>
                {users.length} user account{users.length !== 1 ? 's' : ''}
              </span>
              <button style={{
                padding: '5px 12px', borderRadius: '6px', fontSize: '10px',
                border: `1px solid ${C.accent}`, background: C.accentMuted,
                color: C.accent, cursor: 'pointer', fontWeight: 600,
              }}>+ New User</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
              {users.map(u => {
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS.Viewer
                return (
                  <div key={u.email} style={{
                    padding: '12px', background: C.surface,
                    border: `1px solid ${C.borderSubtle}`, borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ color: C.text, fontWeight: 600, fontSize: '12px' }}>{u.name}</div>
                      <div style={{ color: C.textMuted, fontSize: '10px' }}>{u.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ color: C.textDim, fontSize: '10px' }}>Last login {u.lastLogin}</div>
                      <Badge text={u.role} bg={rc.bg} color={rc.color} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ color: C.text, fontSize: '13px', fontWeight: 600, fontFamily: "'SF Mono',monospace" }}>{value}</div>
      <div style={{ color: C.textDim, fontSize: '9px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>{label}</div>
    </div>
  )
}
