/**
 * FormSubmissionStatus — shows bundle status: each form with completion status,
 * overall progress, submitted/under review state.
 * Consumed by: router.tsx (/portal/submissions/:bundleId)
 * Depends on: useFormBundle, LIFE_EVENTS, FORM_REGISTRY, useTheme
 */
import { useParams, useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { useFormBundle } from '@/hooks/useFormSubmission'
import { LIFE_EVENTS } from '@/lib/life-events'
import { FORM_REGISTRY } from '@/lib/form-definitions'

const STATUS_COLORS: Record<string, { label: string; color: string; bg: string }> = {
  'IN_PROGRESS': { label: 'In Progress', color: '#d97706', bg: '#fef3c7' },
  'SUBMITTED': { label: 'Submitted', color: '#16a34a', bg: '#dcfce7' },
  'UNDER_REVIEW': { label: 'Under Review', color: '#1565c0', bg: '#e3f2fd' },
  'ACTION_NEEDED': { label: 'Action Needed', color: '#dc2626', bg: '#fef2f2' },
  'COMPLETE': { label: 'Complete', color: '#16a34a', bg: '#dcfce7' },
}

export function FormSubmissionStatus() {
  const T = useTheme()
  const navigate = useNavigate()
  const { bundleId } = useParams<{ bundleId: string }>()
  const { data: bundle, isLoading } = useFormBundle(bundleId || '')

  if (isLoading) {
    return <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 13, color: T.text.muted }}>Loading...</div>
    </div>
  }

  if (!bundle) {
    return <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
      <div style={{ fontSize: 14, color: T.text.muted }}>Submission not found.</div>
      <button onClick={() => navigate('/portal/life-events')} style={{ marginTop: 12, padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border.base}`, background: 'transparent', color: T.text.secondary, fontSize: 12, cursor: 'pointer' }}>Back</button>
    </div>
  }

  const event = LIFE_EVENTS.find(e => e.eventId === bundle.eventId)
  const statusInfo = STATUS_COLORS[bundle.status] || STATUS_COLORS['IN_PROGRESS']

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.text.primary }}>{event?.title || bundle.eventId}</div>
          <div style={{ fontSize: 11, color: T.text.muted }}>Bundle {bundle.bundleId}</div>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 6,
          color: statusInfo.color, background: statusInfo.bg,
        }}>{statusInfo.label}</span>
      </div>

      {/* Status callout */}
      <div style={{
        padding: '14px 20px', borderRadius: 10, marginBottom: 20,
        background: statusInfo.bg, borderLeft: `3px solid ${statusInfo.color}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: statusInfo.color }}>
          {bundle.status === 'SUBMITTED' ? 'Your forms have been submitted and are awaiting staff review.' :
           bundle.status === 'COMPLETE' ? 'All forms have been processed. No further action needed.' :
           bundle.status === 'ACTION_NEEDED' ? 'Staff has requested additional information. Please check your messages.' :
           bundle.status === 'UNDER_REVIEW' ? 'A staff member is currently reviewing your submission.' :
           'Continue filling out your forms below.'}
        </div>
        {bundle.submittedAt && (
          <div style={{ fontSize: 11, color: statusInfo.color, marginTop: 4 }}>
            Submitted: {new Date(bundle.submittedAt).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Forms list */}
      <div style={{ background: T.surface.card, borderRadius: 12, border: `1px solid ${T.border.base}`, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${T.border.subtle}` }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>Forms in this submission</span>
        </div>
        {bundle.forms.map((form, idx) => {
          const def = FORM_REGISTRY[form.formId]
          const isDone = form.status === 'COMPLETED' || form.status === 'SUBMITTED'
          return (
            <div key={form.submissionId} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 20px', borderBottom: idx < bundle.forms.length - 1 ? `1px solid ${T.border.subtle}` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isDone ? T.status.success : T.surface.cardAlt,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: isDone ? '#fff' : T.text.muted,
                }}>{isDone ? '\u2713' : idx + 1}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{form.formName}</div>
                  <div style={{ fontSize: 10, color: T.text.muted }}>{def?.estimatedMinutes || 0} min</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                color: isDone ? T.status.success : T.status.warning,
                background: isDone ? T.status.successBg : T.status.warningBg,
              }}>{form.status}</span>
            </div>
          )
        })}
      </div>

      <button onClick={() => navigate('/portal/life-events')} style={{
        padding: '8px 20px', borderRadius: 8, border: `1px solid ${T.border.base}`,
        background: 'transparent', color: T.text.secondary, fontSize: 12, cursor: 'pointer',
      }}>Back to Life Events</button>
    </div>
  )
}
