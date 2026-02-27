/**
 * Staff submission review — detailed view of a submitted form bundle.
 * Shows expandable sections per form with all submitted field values.
 * Action buttons: Approve, Request More Info, Route to Workspace.
 * Consumed by: router.tsx (/staff/queue/:bundleId)
 * Depends on: useFormBundle, formSubmissionApi, LIFE_EVENTS, FORM_REGISTRY, C theme
 */
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { C } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { useFormBundle } from '@/hooks/useFormSubmission'
import { formSubmissionApi } from '@/api/form-submission-store'
import { LIFE_EVENTS } from '@/lib/life-events'
import { FORM_REGISTRY } from '@/lib/form-definitions'
import { useQueryClient } from '@tanstack/react-query'

// Suppress unused import lint — FORM_REGISTRY used for future field label resolution
void FORM_REGISTRY

const MEMBER_NAMES: Record<string, string> = {
  '10001': 'Robert Martinez',
  '10002': 'Jennifer Kim',
  '10003': 'David Washington',
  '10004': 'Robert Martinez',
}

export function SubmissionReview() {
  const { bundleId } = useParams<{ bundleId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: bundle, isLoading } = useFormBundle(bundleId || '')
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set())
  const [actionTaken, setActionTaken] = useState('')

  if (isLoading) {
    return <div style={{ flex: 1, padding: '40px', textAlign: 'center' as const, color: C.textMuted }}>Loading...</div>
  }

  if (!bundle) {
    return <div style={{ flex: 1, padding: '40px', textAlign: 'center' as const }}>
      <div style={{ color: C.textMuted, marginBottom: 12 }}>Submission not found.</div>
      <button onClick={() => navigate('/staff')} style={{ padding: '6px 16px', borderRadius: 6, border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, fontSize: 11, cursor: 'pointer' }}>Back</button>
    </div>
  }

  const event = LIFE_EVENTS.find(e => e.eventId === bundle.eventId)
  const toggleForm = (formId: string) => {
    const next = new Set(expandedForms)
    next.has(formId) ? next.delete(formId) : next.add(formId)
    setExpandedForms(next)
  }

  const handleAction = async (action: string) => {
    if (action === 'approve') {
      await formSubmissionApi.updateBundleStatus(bundle.bundleId, 'COMPLETE')
    } else if (action === 'request_info') {
      await formSubmissionApi.updateBundleStatus(bundle.bundleId, 'ACTION_NEEDED')
    } else if (action === 'review') {
      await formSubmissionApi.updateBundleStatus(bundle.bundleId, 'UNDER_REVIEW')
    }
    queryClient.invalidateQueries({ queryKey: ['form-bundles'] })
    setActionTaken(action)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <button onClick={() => navigate('/staff/queue')} style={{
              fontSize: 10, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, display: 'block',
            }}>&larr; Back to Queue</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
              {MEMBER_NAMES[bundle.memberId] || `Member ${bundle.memberId}`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {event && <Badge text={event.title} color={event.color} bg={`${event.color}20`} />}
              <span style={{ fontSize: 10, color: C.textDim }}>{bundle.bundleId}</span>
            </div>
          </div>
          <Badge
            text={bundle.status.replace(/_/g, ' ')}
            color={bundle.status === 'COMPLETE' ? '#16a34a' : bundle.status === 'ACTION_NEEDED' ? '#dc2626' : C.accent}
            bg={bundle.status === 'COMPLETE' ? '#16a34a20' : bundle.status === 'ACTION_NEEDED' ? '#dc262620' : C.accentMuted}
          />
        </div>

        {/* Action taken toast */}
        {actionTaken && (
          <div style={{
            padding: '10px 16px', borderRadius: 8, marginBottom: 16,
            background: actionTaken === 'approve' ? '#16a34a20' : actionTaken === 'request_info' ? '#dc262620' : C.accentMuted,
            borderLeft: `3px solid ${actionTaken === 'approve' ? '#16a34a' : actionTaken === 'request_info' ? '#dc2626' : C.accent}`,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: actionTaken === 'approve' ? '#16a34a' : actionTaken === 'request_info' ? '#dc2626' : C.accent }}>
              {actionTaken === 'approve' ? 'Submission approved.' : actionTaken === 'request_info' ? 'Requested more information from member.' : 'Marked as under review.'}
            </span>
          </div>
        )}

        {/* Submission metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            ['Submitted', bundle.submittedAt ? new Date(bundle.submittedAt).toLocaleDateString() : '\u2014'],
            ['Forms', `${bundle.forms.length} form${bundle.forms.length !== 1 ? 's' : ''}`],
            ['Created', new Date(bundle.createdAt).toLocaleDateString()],
          ].map(([label, val]) => (
            <div key={label as string} style={{ padding: '10px 14px', background: C.surface, borderRadius: 8, border: `1px solid ${C.borderSubtle}` }}>
              <div style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginTop: 2 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Forms detail */}
        {bundle.forms.map(form => {
          const expanded = expandedForms.has(form.formId)
          const entries = Object.entries(form.data)
          return (
            <div key={form.submissionId} style={{
              background: C.surface, borderRadius: 8, border: `1px solid ${C.borderSubtle}`,
              marginBottom: 8, overflow: 'hidden',
            }}>
              <button onClick={() => toggleForm(form.formId)} style={{
                width: '100%', padding: '12px 16px', background: 'transparent', border: 'none',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: C.text, fontWeight: 600, fontSize: 12 }}>{form.formName}</span>
                  <span style={{ fontSize: 9, color: C.textDim }}>{form.formId}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge text={form.status} color={form.status === 'SUBMITTED' ? '#16a34a' : C.textMuted} bg={form.status === 'SUBMITTED' ? '#16a34a20' : `${C.textMuted}20`} />
                  <span style={{ color: C.textMuted, fontSize: 11 }}>{expanded ? '\u25B2' : '\u25BC'}</span>
                </div>
              </button>
              {expanded && entries.length > 0 && (
                <div style={{ padding: '0 16px 12px', borderTop: `1px solid ${C.borderSubtle}` }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', paddingTop: 12 }}>
                    {entries.map(([key, val]) => (
                      <div key={key}>
                        <div style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{key.replace(/_/g, ' ')}</div>
                        <div style={{ fontSize: 12, color: C.text, marginTop: 1 }}>{String(val) || '\u2014'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expanded && entries.length === 0 && (
                <div style={{ padding: '8px 16px 12px', borderTop: `1px solid ${C.borderSubtle}` }}>
                  <span style={{ fontSize: 11, color: C.textDim }}>No field data submitted</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Action buttons */}
        {(bundle.status === 'SUBMITTED' || bundle.status === 'UNDER_REVIEW') && (
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button onClick={() => handleAction('approve')} style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: 'none', background: '#16a34a', color: '#fff', cursor: 'pointer',
            }}>Approve</button>
            <button onClick={() => handleAction('request_info')} style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${C.border}`, background: 'transparent', color: C.textSecondary, cursor: 'pointer',
            }}>Request More Info</button>
            <button onClick={() => handleAction('review')} style={{
              padding: '8px 20px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              border: `1px solid ${C.accent}`, background: C.accentMuted, color: C.accent, cursor: 'pointer',
            }}>Mark Under Review</button>
          </div>
        )}
      </div>
    </div>
  )
}
