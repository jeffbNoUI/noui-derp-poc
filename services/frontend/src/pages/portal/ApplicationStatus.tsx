/**
 * Application status tracking page — 6-stage progress bar, status detail,
 * notarization instructions (when SUBMITTED), timeline, document checklist, messages.
 * Consumed by: router.tsx (route /portal/status/:appId)
 * Depends on: useTheme, usePortalAuth, usePortal hooks, Portal types
 */
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useApplication, useApplicationDocuments, useApplicationMessages, useApplicationHistory } from '@/hooks/usePortal'
import { STATUS_DISPLAY, PROGRESS_STAGES } from '@/types/Portal'
import type { ApplicationStatus as AppStatus } from '@/types/Portal'

export function ApplicationStatus() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = usePortalAuth()
  const application = useApplication(memberId)
  const documents = useApplicationDocuments(memberId)
  const messages = useApplicationMessages(memberId)
  const history = useApplicationHistory(memberId)

  const app = application.data
  const docs = documents.data || []
  const msgs = messages.data || []
  const hist = history.data || []

  if (application.isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, color: T.text.muted }}>Loading status...</div>
      </div>
    )
  }

  if (!app) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text.primary }}>No Application Found</div>
        <div style={{ fontSize: 13, color: T.text.muted, marginTop: 8 }}>You haven't submitted an application yet.</div>
        <button onClick={() => navigate('/portal')} style={{
          marginTop: 16, padding: '8px 20px', borderRadius: 8,
          background: T.accent.primary, color: T.accent.on,
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>Back to Dashboard</button>
      </div>
    )
  }

  const statusInfo = STATUS_DISPLAY[app.status as AppStatus]
  const currentStageIdx = PROGRESS_STAGES.findIndex(s => s.key === app.status)

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 20, fontWeight: 700, color: T.text.primary,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>Application Status</div>
        <div style={{ fontSize: 13, color: T.text.secondary, marginTop: 4 }}>
          Application #{app.app_id} · Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : ''}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadowLg,
        padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {PROGRESS_STAGES.map((stage, i) => {
            const isComplete = i < currentStageIdx
            const isCurrent = i === currentStageIdx
            return (
              <div key={stage.key} style={{ flex: 1, textAlign: 'center' as const }}>
                <div style={{
                  height: 6, borderRadius: 3,
                  background: isComplete ? T.status.success : isCurrent ? T.accent.primary : T.border.subtle,
                  transition: 'background 0.3s', marginBottom: 8,
                }} />
                <div style={{
                  fontSize: 10, fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? T.accent.primary : isComplete ? T.status.success : T.text.muted,
                }}>{stage.label}</div>
              </div>
            )
          })}
        </div>
        <div style={{
          padding: '14px 16px', background: T.accent.surface, borderRadius: 8,
          borderLeft: `3px solid ${T.accent.primary}`,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.accent.primary }}>
            {statusInfo?.label || app.status}
          </div>
          <div style={{ fontSize: 13, color: T.text.secondary, marginTop: 4, lineHeight: 1.5 }}>
            {statusInfo?.detail}
          </div>
        </div>
      </div>

      {/* What's Next */}
      {app.status === 'SUBMITTED' && (
        <div style={{
          background: T.status.warningBg, borderRadius: 12,
          border: `1px solid ${T.status.warning}20`, padding: 20, marginBottom: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.status.warning, marginBottom: 8 }}>
            Next Step: Submit Your Notarized Application
          </div>
          <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.6 }}>
            1. Print your retirement application<br />
            2. Sign it before a notary public<br />
            3. Submit the notarized copy to DERP via email, fax, or mail<br /><br />
            <strong>DERP Office:</strong> 777 Pearl Street, Denver, CO 80203<br />
            <strong>Fax:</strong> (303) 839-7432<br />
            <strong>Email:</strong> derp@denvergov.org
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Timeline */}
        <div style={{
          background: T.surface.card, borderRadius: 12,
          border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${T.border.subtle}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>Timeline</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {hist.length === 0 && (
              <div style={{ fontSize: 12, color: T.text.muted, padding: '8px 0' }}>No status changes yet.</div>
            )}
            {hist.map((h, i) => (
              <div key={i} style={{
                display: 'flex', gap: 10, padding: '8px 0',
                borderBottom: i < hist.length - 1 ? `1px solid ${T.border.subtle}` : 'none',
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                  background: i === 0 ? T.accent.primary : T.status.success,
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>
                    {STATUS_DISPLAY[h.to_status]?.label || h.to_status}
                  </div>
                  <div style={{ fontSize: 10, color: T.text.muted }}>
                    {new Date(h.changed_at).toLocaleDateString()} · {h.changed_by}
                  </div>
                  {h.reason && <div style={{ fontSize: 11, color: T.text.secondary, marginTop: 2 }}>{h.reason}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div style={{
          background: T.surface.card, borderRadius: 12,
          border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: `1px solid ${T.border.subtle}`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>Documents</span>
          </div>
          <div style={{ padding: '8px 16px' }}>
            {docs.length === 0 && (
              <div style={{ fontSize: 12, color: T.text.muted, padding: '8px 0' }}>No documents required.</div>
            )}
            {docs.map((d, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0',
                borderBottom: i < docs.length - 1 ? `1px solid ${T.border.subtle}` : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: T.text.primary }}>{d.doc_name}</div>
                  {d.received_date && <div style={{ fontSize: 10, color: T.text.muted }}>Received {d.received_date}</div>}
                </div>
                <span style={{
                  fontSize: 9, padding: '2px 6px', borderRadius: 99, fontWeight: 700,
                  textTransform: 'uppercase' as const,
                  background: d.status === 'RECEIVED' ? T.status.successBg : d.status === 'WAIVED' ? T.status.infoBg : T.status.warningBg,
                  color: d.status === 'RECEIVED' ? T.status.success : d.status === 'WAIVED' ? T.status.info : T.status.warning,
                }}>{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      {msgs.length > 0 && (
        <div style={{
          background: T.surface.card, borderRadius: 12,
          border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
          overflow: 'hidden', marginTop: 16,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border.subtle}` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>Messages</span>
          </div>
          <div style={{ padding: '8px 16px' }}>
            {msgs.map((msg, i) => (
              <div key={i} style={{
                padding: '10px 0',
                borderBottom: i < msgs.length - 1 ? `1px solid ${T.border.subtle}` : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: msg.sender_type === 'STAFF' ? T.accent.primary : T.text.primary,
                  }}>{msg.sender_name}</span>
                  <span style={{ fontSize: 10, color: T.text.muted }}>{new Date(msg.created_at).toLocaleDateString()}</span>
                </div>
                <div style={{ fontSize: 12, color: T.text.secondary, lineHeight: 1.5 }}>{msg.msg_text}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={() => navigate('/portal')} style={{
        marginTop: 20, padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
        border: `1px solid ${T.border.base}`, background: 'transparent',
        color: T.text.secondary, cursor: 'pointer',
      }}>← Back to Dashboard</button>
    </div>
  )
}
