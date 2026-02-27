/**
 * Staff contribution report queue — table of submitted reports awaiting verification.
 * Consumed by: router.tsx (/staff/contributions)
 * Depends on: useSubmittedReports, DataTable, Badge, C theme, fmt
 */
import { useNavigate } from 'react-router-dom'
import { C } from '@/theme'
import { fmt } from '@/lib/constants'
import { Badge } from '@/components/shared/Badge'
import { DataTable } from '@/components/shared/DataTable'
import { useSubmittedReports } from '@/hooks/useContributionReview'
import type { ContributionReport } from '@/types/Employer'

const DEPT_NAMES: Record<string, string> = {
  PW: 'Public Works',
  PR: 'Parks & Recreation',
  FIN: 'Finance',
}

const STATUS_BADGE: Record<string, { text: string; color: string; bg: string }> = {
  submitted: { text: 'New', color: '#16a34a', bg: '#dcfce720' },
  verified: { text: 'Verified', color: '#0d9488', bg: '#0d948820' },
  discrepancy: { text: 'Discrepancy', color: '#dc2626', bg: '#dc262620' },
}

export function ContributionQueue() {
  const navigate = useNavigate()
  const { data: reports = [], isLoading } = useSubmittedReports()

  const columns = [
    {
      key: 'period', label: 'Period', sortable: true,
      render: (row: ContributionReport) => (
        <span style={{ fontWeight: 600, color: C.text }}>{row.period}</span>
      ),
    },
    {
      key: 'department', label: 'Department',
      render: (row: ContributionReport) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{DEPT_NAMES[row.department] || row.department}</span>
      ),
    },
    {
      key: 'employee_count', label: 'Employees', width: '90px',
      render: (row: ContributionReport) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{row.employee_count}</span>
      ),
    },
    {
      key: 'total_gross_payroll', label: 'Gross Payroll', sortable: true,
      render: (row: ContributionReport) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{fmt(row.total_gross_payroll)}</span>
      ),
    },
    {
      key: 'total_employee_contributions', label: 'EE Contrib',
      render: (row: ContributionReport) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{fmt(row.total_employee_contributions)}</span>
      ),
    },
    {
      key: 'total_employer_contributions', label: 'ER Contrib',
      render: (row: ContributionReport) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{fmt(row.total_employer_contributions)}</span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row: ContributionReport) => {
        const badge = STATUS_BADGE[row.status] || { text: row.status, color: C.textMuted, bg: `${C.textMuted}20` }
        return <Badge text={badge.text} color={badge.color} bg={badge.bg} />
      },
    },
    {
      key: 'submitted_at', label: 'Submitted', sortable: true,
      render: (row: ContributionReport) => (
        <span style={{ color: C.textMuted, fontSize: 11 }}>
          {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Contribution Reports</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            Employer contribution reports awaiting staff verification.
          </div>
        </div>
        {isLoading ? (
          <div style={{ color: C.textMuted, fontSize: 12, textAlign: 'center' as const, padding: 40 }}>Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            onRowClick={(row) => navigate(`/staff/contributions/${row.report_id}`)}
            emptyMessage="No submitted contribution reports"
            colors={{ bg: C.bg, card: C.surface, border: C.borderSubtle, text: C.text, accent: C.accent, hoverBg: `${C.accent}10` }}
          />
        )}
      </div>
    </div>
  )
}
