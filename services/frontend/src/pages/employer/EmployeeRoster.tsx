/**
 * Employee roster page — filterable DataTable with department and status filters, tier badges.
 * Consumed by: router.tsx (employer/roster route)
 * Depends on: DataTable, employerDemoApi, useEmployerAuth, fmt, employerTheme, Employer types
 */
import { useState, useEffect } from 'react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { useEmployerAuth } from '@/employer/auth/EmployerAuthContext'
import { employerDemoApi, DEMO_DEPARTMENTS } from '@/api/employer-demo-data'
import { employerTheme as T } from '@/theme'
import { fmt } from '@/lib/constants'
import type { EmployerEmployee } from '@/types/Employer'

// Tier badge colors from employer-theme.ts
const TIER_COLORS: Record<number, { color: string; bg: string }> = {
  1: { color: T.tier.t1, bg: T.tier.t1bg },  // #1565c0
  2: { color: T.tier.t2, bg: T.tier.t2bg },  // #e65100
  3: { color: T.tier.t3, bg: T.tier.t3bg },  // #2e7d32
}

const STATUS_OPTIONS = ['all', 'active', 'terminated', 'retired', 'deceased'] as const

export function EmployeeRoster() {
  const { deptId } = useEmployerAuth()
  const [employees, setEmployees] = useState<EmployerEmployee[]>([])
  const [deptFilter, setDeptFilter] = useState<string>(deptId)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => { setDeptFilter(deptId) }, [deptId])

  useEffect(() => {
    employerDemoApi.getEmployees(deptFilter === 'ALL' ? undefined : deptFilter).then(setEmployees)
  }, [deptFilter])

  const filtered = statusFilter === 'all'
    ? employees
    : employees.filter(e => e.status === statusFilter)

  // DataTable requires Record<string, unknown> — use a mapped row type
  type Row = Record<string, unknown> & EmployerEmployee
  const columns: Column<Row>[] = [
    { key: 'member_id', label: 'ID', sortable: true, width: '70px' },
    {
      key: 'last_name', label: 'Name', sortable: true,
      render: (row) => `${row.last_name}, ${row.first_name}`,
    },
    {
      key: 'department', label: 'Dept', sortable: true, width: '60px',
      render: (row) => (
        <span style={{ fontSize: 11, fontWeight: 600, color: T.text.secondary }}>
          {row.department}
        </span>
      ),
    },
    {
      key: 'tier', label: 'Tier', sortable: true, width: '60px',
      render: (row) => {
        const tc = TIER_COLORS[row.tier] ?? { color: T.text.muted, bg: 'transparent' }
        return (
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 10,
            fontSize: 11, fontWeight: 600, color: tc.color, background: tc.bg,
          }}>
            T{row.tier}
          </span>
        )
      },
    },
    {
      key: 'hire_date', label: 'Hire Date', sortable: true, width: '100px',
      render: (row) => row.hire_date.slice(0, 10),
    },
    {
      key: 'status', label: 'Status', sortable: true, width: '90px',
      render: (row) => {
        const s = row.status
        const color = s === 'active' ? T.status.success
          : s === 'retired' ? T.accent.primary
          : s === 'terminated' ? T.status.warning : T.status.danger
        return (
          <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'capitalize' as const }}>
            {s}
          </span>
        )
      },
    },
    {
      key: 'monthly_salary', label: 'Salary', sortable: true, width: '100px',
      render: (row) => fmt(row.monthly_salary),
    },
    {
      key: 'years_of_service', label: 'YOS', sortable: true, width: '60px',
      render: (row) => row.years_of_service.toFixed(1),
    },
  ]

  return (
    <div style={{ maxWidth: 1040 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text.primary }}>
            Employee Roster
            <span style={{ fontSize: 12, fontWeight: 400, color: T.text.muted, marginLeft: 8 }}>
              {filtered.length} employee{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {/* Department filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{
              fontSize: 12, padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${T.border.base}`, background: T.surface.card,
              color: T.text.primary, cursor: 'pointer',
            }}
          >
            <option value="ALL">All Departments</option>
            {DEMO_DEPARTMENTS.map(d => (
              <option key={d.dept_id} value={d.dept_id}>{d.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              fontSize: 12, padding: '5px 10px', borderRadius: 6,
              border: `1px solid ${T.border.base}`, background: T.surface.card,
              color: T.text.primary, cursor: 'pointer',
            }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{
        background: T.surface.card, borderRadius: 10, border: `1px solid ${T.border.base}`,
        overflow: 'hidden', boxShadow: T.shadow,
      }}>
        <DataTable<Row>
          columns={columns}
          data={filtered as Row[]}
          colors={{
            bg: T.surface.card, card: T.surface.card, border: T.border.base,
            text: T.text.primary, accent: T.accent.primary, hoverBg: T.surface.cardAlt,
          }}
          emptyMessage="No employees match the selected filters"
        />
      </div>
    </div>
  )
}
