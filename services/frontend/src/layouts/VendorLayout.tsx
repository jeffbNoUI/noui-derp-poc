/**
 * Vendor portal layout — top navigation bar, vendor selector, portal switcher.
 * Teal-green theme (vendorTheme) for insurance carrier workspace.
 * Consumed by: router.tsx (wraps /vendor/* routes)
 * Depends on: ThemeProvider, vendorTheme, VendorAuthProvider, react-router-dom
 */
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from '@/theme'
import { vendorTheme } from '@/theme/vendor-theme'
import { VendorAuthProvider, useVendorAuth, DEMO_VENDORS } from '@/vendor/auth/VendorAuthContext'

function VendorLayoutInner() {
  const T = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { vendorId, setVendorId } = useVendorAuth()
  const navItems = [
    { label: 'Queue', path: '/vendor' },
    { label: 'Reports', path: '/vendor/reports' },
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
          maxWidth: 1100, margin: '0 auto', padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: T.accent.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>V</span>
            </div>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: T.text.primary,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>DERP Vendor Portal</div>
              <div style={{ fontSize: 10, color: T.text.muted }}>Insurance Enrollment & IPR</div>
            </div>
          </div>

          {/* Nav items */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {navItems.map(item => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/vendor' && location.pathname.startsWith(item.path))
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

          {/* Vendor selector + switch */}
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
                value={vendorId}
                onChange={e => {
                  setVendorId(e.target.value)
                  navigate('/vendor')
                }}
                style={{
                  fontSize: 12, fontWeight: 600, color: T.text.primary,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {DEMO_VENDORS.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
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

export function VendorLayout() {
  return (
    <ThemeProvider theme={vendorTheme}>
      <VendorAuthProvider>
        <VendorLayoutInner />
      </VendorAuthProvider>
    </ThemeProvider>
  )
}
