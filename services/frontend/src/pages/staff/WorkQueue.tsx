/**
 * Staff work queue — table of pending form bundle submissions from the member portal.
 * Consumed by: router.tsx (/staff/queue)
 * Depends on: usePendingSubmissions, DataTable, LIFE_EVENTS, C theme
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DataTable } from '@/components/shared/DataTable'
import { usePendingSubmissions } from '@/hooks/useFormSubmission'
import { LIFE_EVENTS } from '@/lib/life-events'
import type { FormBundleSubmission } from '@/types/LifeEvent'

const MEMBER_NAMES: Record<string, string> = {
  '10001': 'Robert Martinez',
  '10002': 'Jennifer Kim',
  '10003': 'David Washington',
  '10004': 'Robert Martinez',
}

const STATUS_BADGE: Record<string, { text: string; color: string; bg: string }> = {
  SUBMITTED: { text: 'New', color: '#16a34a', bg: '#dcfce720' },
  UNDER_REVIEW: { text: 'In Review', color: '#1565c0', bg: '#1565c020' },
  ACTION_NEEDED: { text: 'Action Needed', color: '#dc2626', bg: '#dc262620' },
}

export function WorkQueue() {
  const navigate = useNavigate()
  const { data: pending = [], isLoading } = usePendingSubmissions()

  // Auto-navigate to staff home when queue is empty (all items processed)
  useEffect(() => {
    if (!isLoading && pending.length === 0) {
      navigate('/staff')
    }
  }, [isLoading, pending.length, navigate])

  const columns = [
    {
      key: 'member', label: 'Member', sortable: true,
      render: (row: FormBundleSubmission) => (
        <span style={{ fontWeight: 600, color: C.text }}>{MEMBER_NAMES[row.memberId] || `Member ${row.memberId}`}</span>
      ),
    },
    {
      key: 'event', label: 'Life Event',
      render: (row: FormBundleSubmission) => {
        const event = LIFE_EVENTS.find(e => e.eventId === row.eventId)
        return event ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: event.color, display: 'inline-block' }} />
            <span style={{ color: C.textSecondary, fontSize: 11 }}>{event.title}</span>
          </span>
        ) : <span style={{ color: C.textMuted }}>{row.eventId}</span>
      },
    },
    {
      key: 'forms', label: 'Forms', width: '80px',
      render: (row: FormBundleSubmission) => (
        <span style={{ color: C.textSecondary, fontSize: 11 }}>{row.forms.length} form{row.forms.length !== 1 ? 's' : ''}</span>
      ),
    },
    {
      key: 'submitted', label: 'Submitted', sortable: true,
      render: (row: FormBundleSubmission) => (
        <span style={{ color: C.textMuted, fontSize: 11 }}>
          {row.submittedAt ? new Date(row.submittedAt).toLocaleDateString() : '\u2014'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (row: FormBundleSubmission) => {
        const badge = STATUS_BADGE[row.status] || { text: row.status, color: C.textMuted, bg: `${C.textMuted}20` }
        return <Badge text={badge.text} color={badge.color} bg={badge.bg} />
      },
    },
  ]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Incoming Work Queue</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            Form submissions from the member portal awaiting staff review.
          </div>
        </div>
        {isLoading ? (
          <div style={{ color: C.textMuted, fontSize: 12, textAlign: 'center' as const, padding: 40 }}>Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={pending}
            onRowClick={(row) => navigate(`/staff/queue/${row.bundleId}`)}
            emptyMessage="No pending submissions"
            colors={{ bg: C.bg, card: C.surface, border: C.borderSubtle, text: C.text, accent: C.accent, hoverBg: `${C.accent}10` }}
          />
        )}
      </div>
    </div>
  )
}
