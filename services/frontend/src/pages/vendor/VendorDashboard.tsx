/**
 * Vendor dashboard — enrollment queue with stats cards and sortable data table.
 * Shows pending enrollments, IPR verification status, and processing metrics.
 * Consumed by: router.tsx (index route for /vendor)
 * Depends on: vendor-demo-data.ts (queue, stats), DataTable, StatsCard, useTheme, fmt
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { fmt } from '@/lib/constants'
import { StatsCard } from '@/components/shared/StatsCard'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { vendorDemoApi, DEMO_ENROLLMENT_QUEUE } from '@/api/vendor-demo-data'
import type { EnrollmentQueueItem, VendorDashboardStats } from '@/types/Vendor'

const TIER_LABELS: Record<number, string> = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' }
const STATUS_LABELS: Record<string, string> = {
  pending_verification: 'Pending',
  verified: 'Verified',
  enrolled: 'Enrolled',
  declined: 'Declined',
}

export function VendorDashboard() {
  const T = useTheme()
  const navigate = useNavigate()
  const [stats, setStats] = useState<VendorDashboardStats | null>(null)
  const [queue, setQueue] = useState<EnrollmentQueueItem[]>([])

  useEffect(() => {
    vendorDemoApi.getStats().then(setStats)
    vendorDemoApi.getQueue().then(setQueue)
  }, [])

  const columns: Column<EnrollmentQueueItem>[] = [
    { key: 'member_name', label: 'Member', sortable: true },
    {
      key: 'tier', label: 'Tier', sortable: true,
      render: (row: EnrollmentQueueItem) => TIER_LABELS[row.tier] ?? `Tier ${row.tier}`,
    },
    { key: 'retirement_date', label: 'Retirement Date', sortable: true },
    {
      key: 'enrollment_type', label: 'Type', sortable: true,
      render: (row: EnrollmentQueueItem) =>
        row.enrollment_type === 'new_retiree' ? 'New Retiree'
        : row.enrollment_type === 'coverage_change' ? 'Coverage Change'
        : 'Open Enrollment',
    },
    {
      key: 'status', label: 'Status', sortable: true,
      render: (row: EnrollmentQueueItem) => {
        const label = STATUS_LABELS[row.status] ?? row.status
        const color = row.status === 'enrolled' ? T.status.success
          : row.status === 'verified' ? T.status.info
          : row.status === 'declined' ? T.status.danger
          : T.status.warning
        return (
          <span style={{
            fontSize: 11, fontWeight: 600, color,
            padding: '2px 8px', borderRadius: 10,
            background: row.status === 'enrolled' ? T.status.successBg
              : row.status === 'verified' ? T.status.infoBg
              : row.status === 'declined' ? T.status.dangerBg
              : T.status.warningBg,
          }}>{label}</span>
        )
      },
    },
    {
      key: 'ipr_eligible', label: 'IPR Eligible', sortable: false,
      render: (row: EnrollmentQueueItem) =>
        row.ipr_eligible
          ? <span style={{ color: T.status.success, fontWeight: 600 }}>Yes {row.ipr_monthly ? `(${fmt(row.ipr_monthly)}/mo)` : ''}</span>
          : <span style={{ color: T.text.muted }}>No</span>,
    },
    {
      key: 'assigned_at', label: 'Assigned', sortable: true,
      render: (row: EnrollmentQueueItem) => (
        <span style={{ fontSize: 11, color: T.text.muted }}>
          {new Date(row.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      ),
    },
  ]

  const tableColors = {
    bg: T.surface.bg, card: T.surface.card, border: T.border.base,
    text: T.text.primary, accent: T.accent.primary, hoverBg: T.accent.surface,
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: T.text.primary }}>
        Enrollment Queue
      </h1>

      {/* Stats row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatsCard label="Pending Enrollments" value={String(stats.pending_enrollments)} color={T.status.warning} />
          <StatsCard label="Verified This Month" value={String(stats.verified_this_month)} color={T.status.info} />
          <StatsCard label="Active Enrollees" value={String(stats.total_active_enrollees)} color={T.accent.primary} />
          <StatsCard label="Avg Processing Days" value={stats.avg_processing_days.toFixed(1)} color={T.text.secondary} />
        </div>
      )}

      {/* Enrollment queue table */}
      <div style={{
        background: T.surface.card, borderRadius: 10,
        border: `1px solid ${T.border.base}`, overflow: 'hidden',
      }}>
        <DataTable<EnrollmentQueueItem>
          columns={columns}
          data={queue}
          colors={tableColors}
          onRowClick={(row) => navigate(`/vendor/member/${row.member_id}`)}
          emptyMessage="No enrollments in queue"
        />
      </div>

      {/* Record count */}
      <div style={{ fontSize: 11, color: T.text.muted, marginTop: 8, textAlign: 'right' }}>
        {DEMO_ENROLLMENT_QUEUE.length} enrollment records
      </div>
    </div>
  )
}
