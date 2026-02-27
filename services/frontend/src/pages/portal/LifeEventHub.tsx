/**
 * Life event hub — card grid showing 7 life events as entry points.
 * Members choose a life situation instead of a form number.
 * Consumed by: router.tsx (/portal/life-events)
 * Depends on: LIFE_EVENTS, useTheme, useNavigate, useFormBundles
 */
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { LIFE_EVENTS } from '@/lib/life-events'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useFormBundles } from '@/hooks/useFormSubmission'

export function LifeEventHub() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = usePortalAuth()
  const bundles = useFormBundles(memberId)
  const activeBundles = (bundles.data || []).filter(b => b.status !== 'COMPLETE')

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 20, fontWeight: 700, color: T.text.primary,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>What's happening in your life?</div>
        <div style={{ fontSize: 13, color: T.text.secondary, marginTop: 4, lineHeight: 1.5 }}>
          Choose your situation and we'll guide you through exactly what you need.
          No form numbers to remember — just tell us what's going on.
        </div>
      </div>

      {/* Active bundles */}
      {activeBundles.length > 0 && (
        <div style={{
          background: T.accent.surface, borderRadius: 12, border: `1px solid ${T.accent.light}`,
          padding: '14px 20px', marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent.primary, marginBottom: 8 }}>
            In Progress
          </div>
          {activeBundles.map(b => (
            <div key={b.bundleId} onClick={() => navigate(`/portal/submissions/${b.bundleId}`)} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', cursor: 'pointer', borderTop: `1px solid ${T.accent.light}`,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>
                  {LIFE_EVENTS.find(e => e.eventId === b.eventId)?.title || b.eventId}
                </div>
                <div style={{ fontSize: 11, color: T.text.muted }}>
                  {b.forms.filter(f => f.status === 'COMPLETED' || f.status === 'SUBMITTED').length}/{b.forms.length} forms complete
                </div>
              </div>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: b.status === 'SUBMITTED' ? T.status.successBg : T.status.warningBg,
                color: b.status === 'SUBMITTED' ? T.status.success : T.status.warning,
                fontWeight: 600,
              }}>{b.status.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Life event cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {LIFE_EVENTS.map(event => (
          <button key={event.eventId} onClick={() => navigate(`/portal/life-events/${event.eventId}`)} style={{
            padding: 20, background: T.surface.card, borderRadius: 12,
            border: `1px solid ${T.border.base}`, borderLeft: `4px solid ${event.color}`,
            boxShadow: T.shadow, cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowLg; e.currentTarget.style.borderColor = event.color }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadow; e.currentTarget.style.borderColor = T.border.base }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: event.colorBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: event.color, flexShrink: 0,
              }}>{event.iconLabel}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text.primary }}>{event.title}</div>
            </div>
            <div style={{ fontSize: 11, color: T.text.secondary, lineHeight: 1.5 }}>{event.description}</div>
            <div style={{ fontSize: 10, color: T.text.muted, marginTop: 8 }}>
              {event.triage.length > 0 ? `${event.triage.length} question${event.triage.length > 1 ? 's' : ''} to get started` : 'Get started'}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
