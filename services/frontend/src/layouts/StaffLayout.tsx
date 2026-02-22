/**
 * Staff portal layout — extracted from App.tsx.
 * Dark theme, top bar with NoUI branding, bottom demo case bar.
 */
import { Component, type ReactNode } from 'react'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { C, tierMeta } from '@/theme'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: '20px', color: '#EF4444', background: '#0B1017', fontFamily: 'monospace', fontSize: '13px' }}>
        <div style={{ fontWeight: 700, marginBottom: '8px' }}>Component Error:</div>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error.message}{'\n'}{this.state.error.stack}</pre>
      </div>
    )
    return this.props.children
  }
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '9px', padding: '2px 6px',
      borderRadius: '99px', background: bg, color, fontWeight: 600,
      letterSpacing: '0.3px', textTransform: 'uppercase' as const, lineHeight: '14px', whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  )
}

const DEMO_CASES = [
  { id: '10001', name: 'Robert Martinez', tier: 1, label: 'Tier 1 | Rule of 75 | Leave Payout' },
  { id: '10002', name: 'Jennifer Kim', tier: 2, label: 'Tier 2 | Purchased Svc | 30% Reduction' },
  { id: '10003', name: 'David Washington', tier: 3, label: 'Tier 3 | 60-Mo AMS | 12% Reduction' },
  { id: '10004', name: 'Robert Martinez', tier: 1, label: 'Tier 1 | Rule of 75 | DRO', suffix: ' +DRO' },
] as const

export function StaffLayout() {
  const navigate = useNavigate()
  const { memberId } = useParams()

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
            background: `linear-gradient(135deg,${C.accent},#06B6D4)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '10px', color: C.bg,
          }}>N</div>
          <span style={{ color: C.text, fontWeight: 700, fontSize: '13px' }}>NoUI</span>
          <span style={{ color: C.textMuted, fontSize: '11px' }}>Staff Workspace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button onClick={() => navigate('/')} style={{
            fontSize: '9px', color: C.textMuted, textTransform: 'uppercase' as const,
            letterSpacing: '1px', background: 'none', border: `1px solid ${C.border}`,
            padding: '2px 8px', borderRadius: '4px', cursor: 'pointer',
          }}>Switch Portal</button>
          <Badge text="Phase 1 · Transparent" bg={C.accentMuted} color={C.accent} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
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
            <button key={c.id} onClick={() => navigate(`/staff/case/${c.id}`)} style={{
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
