/**
 * Staff portal layout — dark theme wrapper with NoUI branding top bar and
 * bottom demo case bar. Renders <Outlet /> for nested staff routes.
 * Consumed by: router.tsx (wraps /staff/* routes)
 * Depends on: Badge, DEMO_CASES, theme (C, tierMeta), react-router-dom
 */
import { Component, type ReactNode } from 'react'
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DEMO_CASES } from '@/lib/constants'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '20px', color: '#EF4444', background: '#f6f9f9', fontFamily: 'monospace', fontSize: '13px' }}>
        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Component Error:</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
      </div>
    )
    return this.props.children
  }
}


export function StaffLayout() {
  const navigate = useNavigate()
  const { memberId } = useParams()
  const location = useLocation()
  const isGuided = location.pathname.endsWith('/guided')

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column' as const,
      background: C.bg, color: C.text, overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 16px', borderBottom: `1px solid ${C.border}`,
        background: C.surface, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '22px', height: '22px', borderRadius: '5px',
            background: `linear-gradient(135deg,${C.accent},#00695c)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '10px', color: '#ffffff',
          }}>N</div>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '13px' }}>NoUI</span>
          <span style={{ color: C.textMuted, fontSize: '11px' }}>Staff Workspace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {memberId && (
            <div style={{
              display: 'flex', borderRadius: '4px', overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}>
              <button
                onClick={() => navigate(`/staff/case/${memberId}`)}
                style={{
                  fontSize: '9px', color: isGuided ? C.textMuted : C.accent,
                  textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                  background: isGuided ? 'transparent' : C.accentMuted,
                  border: 'none', padding: '2px 8px', cursor: 'pointer',
                  fontWeight: isGuided ? 400 : 600,
                }}
              >Expert</button>
              <button
                onClick={() => navigate(`/staff/case/${memberId}/guided`)}
                style={{
                  fontSize: '9px', color: isGuided ? C.accent : C.textMuted,
                  textTransform: 'uppercase' as const, letterSpacing: '0.5px',
                  background: isGuided ? C.accentMuted : 'transparent',
                  border: 'none', borderLeft: `1px solid ${C.border}`,
                  padding: '2px 8px', cursor: 'pointer',
                  fontWeight: isGuided ? 600 : 400,
                }}
              >Guided</button>
            </div>
          )}
          {/* Productivity tool links */}
          {[
            { label: 'Knowledge', path: '/demos/knowledge-assistant' },
            { label: 'Compose', path: '/demos/correspondence' },
            { label: 'Validate', path: '/demos/data-validator' },
          ].map(tool => (
            <button key={tool.label} onClick={() => navigate(tool.path)} style={{
              fontSize: '8px', color: C.textDim, textTransform: 'uppercase' as const,
              letterSpacing: '0.5px', background: 'none', border: `1px solid ${C.borderSubtle}`,
              padding: '2px 6px', borderRadius: '3px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textDim; e.currentTarget.style.borderColor = C.borderSubtle }}
            >{tool.label}</button>
          ))}
          <button onClick={() => navigate('/')} style={{
            fontSize: '9px', color: C.textMuted, textTransform: 'uppercase' as const,
            letterSpacing: '1px', background: 'none', border: `1px solid ${C.border}`,
            padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
          }}>Platform</button>
          <Badge text="Phase 1 · Transparent" bg={C.accentMuted} color={C.accent} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* Case selector bottom bar */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '5px 12px', gap: '4px',
        borderTop: `1px solid ${C.border}`, background: C.surface,
        flexShrink: 0, flexWrap: 'wrap' as const,
      }}>
        <span style={{
          fontSize: '9px', color: C.textDim, textTransform: 'uppercase' as const,
          letterSpacing: '1px', marginRight: '4px',
        }}>Demo Case</span>
        {DEMO_CASES.map(c => {
          const t = tierMeta[c.tier]
          const isActive = memberId === c.id
          return (
            <button key={c.id} onClick={() => navigate(`/staff/case/${c.id}${isGuided ? '/guided' : ''}`)} style={{
              padding: '3px 9px', borderRadius: '5px',
              border: `1px solid ${isActive ? t.color : C.border}`,
              background: isActive ? t.muted : 'transparent',
              color: isActive ? t.color : C.textMuted,
              cursor: 'pointer', fontSize: '10px', fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            }}>
              {c.name.split(' ')[0]}{'suffix' in c ? c.suffix : ''}
            </button>
          )
        })}
        {memberId && (
          <span style={{ color: C.textDim, fontSize: '9.5px', marginLeft: '6px', fontStyle: 'italic' }}>
            {DEMO_CASES.find(c => c.id === memberId)?.label}
          </span>
        )}
      </div>
    </div>
  )
}
