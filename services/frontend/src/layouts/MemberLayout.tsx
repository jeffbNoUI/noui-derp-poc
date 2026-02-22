/**
 * Member portal layout — MyDERP branding header, nav tabs, member selector dropdown.
 * Light theme (teal accent, white surfaces) from noui-multi-portal.jsx prototype.
 * Wraps children in ThemeProvider (memberTheme) and PortalAuthProvider.
 * Consumed by: router.tsx (wraps /portal/* routes)
 * Depends on: ThemeProvider, memberTheme, PortalAuthProvider, react-router-dom
 */
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '@/theme'
import { PortalAuthProvider, usePortalAuth, DEMO_MEMBERS } from '@/portal/auth/AuthContext'

function MemberLayoutInner() {
  const T = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { memberId, setMemberId } = usePortalAuth()
  const navItems = [
    { label: 'Dashboard', path: '/portal' },
    { label: 'My Application', path: '/portal/apply/current' },
    { label: 'Messages', path: '/portal/messages' },
    { label: 'Documents', path: '/portal/documents' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.surface.bg, color: T.text.primary }}>
      {/* Top nav */}
      <div style={{
        background: T.surface.card,
        borderBottom: `1px solid ${T.border.base}`,
        boxShadow: T.shadow,
      }}>
        <div style={{
          maxWidth: 960, margin: '0 auto', padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: T.accent.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>D</span>
            </div>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: T.text.primary,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>MyDERP</div>
              <div style={{ fontSize: 10, color: T.text.muted }}>Your Retirement Journey</div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/portal' && location.pathname.startsWith(item.path))
              return (
                <span key={item.label} onClick={() => navigate(item.path)} style={{
                  fontSize: 12, fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.accent.primary : T.text.secondary,
                  cursor: 'pointer',
                  borderBottom: isActive ? `2px solid ${T.accent.primary}` : '2px solid transparent',
                  paddingBottom: 2,
                }}>{item.label}</span>
              )
            })}
          </div>

          {/* User + switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => navigate('/')} style={{
              fontSize: 9, color: T.text.muted, background: 'none',
              border: `1px solid ${T.border.base}`, padding: '2px 8px',
              borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' as const,
              letterSpacing: 0.5,
            }}>Switch Portal</button>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px', borderRadius: 6, background: T.surface.cardAlt,
            }}>
              <select
                value={memberId}
                onChange={e => {
                  setMemberId(e.target.value)
                  navigate('/portal')
                }}
                style={{
                  fontSize: 12, fontWeight: 600, color: T.text.primary,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {DEMO_MEMBERS.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Outlet />
    </div>
  )
}

export function MemberLayout() {
  return (
    <PortalAuthProvider>
      <MemberLayoutInner />
    </PortalAuthProvider>
  )
}
