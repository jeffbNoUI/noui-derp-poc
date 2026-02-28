/**
 * Employer portal layout — navy sidebar navigation, top bar with department selector.
 * Uses employer theme (navy/blue). Wraps children in EmployerAuthProvider.
 * AuthGate redirects to /employer/login in non-demo mode when unauthenticated.
 * Consumed by: router.tsx (wraps /employer/* routes)
 * Depends on: EmployerAuthProvider, useEmployerAuth, DEMO_EMPLOYERS, AuthGate, react-router-dom
 */
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { EmployerAuthProvider, useEmployerAuth, DEMO_EMPLOYERS } from '@/employer/auth/EmployerAuthContext'
import { employerTheme as T } from '@/theme'
import { AuthGate } from '@/components/shared/AuthGate'
import { isDemoMode } from '@/api/demo-data'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/employer', icon: '\u25A3' },
  { label: 'Employee Roster', path: '/employer/roster', icon: '\u25CB' },
  { label: 'Contributions', path: '/employer/contributions', icon: '\u25B7' },
  { label: 'Retirements', path: '/employer/retirements', icon: '\u25C7' },
  { label: 'Reports', path: '/employer/reports', icon: '\u25A1' },
]

function EmployerLayoutInner() {
  const navigate = useNavigate()
  const location = useLocation()
  const { deptId, setDeptId, isAuthenticated, user, logout } = useEmployerAuth()
  const currentDept = DEMO_EMPLOYERS.find(d => d.id === deptId)

  // Show Users nav item only for admin role
  const showUsersNav = isDemoMode() || (isAuthenticated && user?.role === 'admin')

  const handleSignOut = () => {
    logout()
    navigate('/employer/login')
  }

  return (
    <AuthGate isAuthenticated={isAuthenticated} loginPath="/employer/login">
      <div style={{ display: 'flex', minHeight: '100vh', background: T.surface.bg, color: T.text.primary }}>
        {/* Sidebar */}
        <div style={{
          width: 200, flexShrink: 0, background: '#1e293b', display: 'flex', flexDirection: 'column' as const,
        }}>
          {/* Brand */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: T.accent.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>D</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>DERP</div>
                <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Employer Portal</div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '8px 0' }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.path === '/employer'
                ? location.pathname === '/employer'
                : location.pathname.startsWith(item.path)
              return (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', cursor: 'pointer', fontSize: 13,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#e2e8f0' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8' }}
                >
                  <span style={{ fontSize: 14, opacity: 0.7 }}>{item.icon}</span>
                  {item.label}
                </div>
              )
            })}
            {/* Users nav item — admin only */}
            {showUsersNav && (() => {
              const isActive = location.pathname.startsWith('/employer/users')
              return (
                <div
                  onClick={() => navigate('/employer/users')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 16px', cursor: 'pointer', fontSize: 13,
                    color: isActive ? '#ffffff' : '#94a3b8',
                    background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#e2e8f0' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#94a3b8' }}
                >
                  <span style={{ fontSize: 14, opacity: 0.7 }}>{'\u25CB'}</span>
                  Users
                </div>
              )
            })()}
          </nav>

          {/* Sidebar footer */}
          <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10, color: '#64748b' }}>
            Phase 1 - Transparent
          </div>
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, minWidth: 0 }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 20px', borderBottom: `1px solid ${T.border.base}`,
            background: T.surface.card, boxShadow: T.shadow,
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>
              {currentDept?.name ?? 'All Departments'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Department selector (demo mode) or user display (auth mode) */}
              {!isDemoMode() && isAuthenticated && user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text.primary }}>{user.displayName}</span>
                  <span style={{ fontSize: 10, color: T.text.muted, textTransform: 'capitalize' }}>{user.role}</span>
                  <button onClick={handleSignOut} style={{
                    fontSize: 10, color: T.text.muted, background: 'none',
                    border: `1px solid ${T.border.base}`, padding: '3px 10px',
                    borderRadius: 4, cursor: 'pointer',
                  }}>Sign Out</button>
                </div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 6, background: T.surface.cardAlt,
                }}>
                  <span style={{ fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>Dept:</span>
                  <select
                    value={deptId}
                    onChange={e => {
                      setDeptId(e.target.value)
                      navigate('/employer')
                    }}
                    style={{
                      fontSize: 12, fontWeight: 600, color: T.text.primary,
                      background: 'transparent', border: 'none', cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {DEMO_EMPLOYERS.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {/* Switch portal */}
              <button onClick={() => navigate('/')} style={{
                fontSize: 9, color: T.text.muted, background: 'none',
                border: `1px solid ${T.border.base}`, padding: '3px 10px',
                borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' as const,
                letterSpacing: 0.5,
              }}>Switch Portal</button>
            </div>
          </div>

          {/* Page content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            <Outlet />
          </div>
        </div>
      </div>
    </AuthGate>
  )
}

export function EmployerLayout() {
  return (
    <EmployerAuthProvider>
      <EmployerLayoutInner />
    </EmployerAuthProvider>
  )
}
