/**
 * Demo layout wrapper — minimal chrome for standalone prototype demos.
 * Provides thin top bar with NoUI brand and "Back to Platform" link, renders Outlet.
 * Consumed by: router.tsx (wraps /demos/* routes)
 * Depends on: react-router-dom (Outlet, Link)
 */
import { Outlet, Link } from 'react-router-dom'

export function DemoLayout() {
  return (
    <div style={{ minHeight: '100vh', background: '#f6f9f9' }}>
      {/* Thin top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px', background: '#ffffff',
        borderBottom: '1px solid #d4e0e0', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            background: 'linear-gradient(135deg, #00796b, #00695c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 9, color: '#fff',
          }}>N</div>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1a2e2e' }}>NoUI</span>
          <span style={{ fontSize: 11, color: '#5a7878' }}>Platform Demo</span>
        </div>
        <Link to="/" style={{
          fontSize: 11, color: '#00796b', textDecoration: 'none',
          fontWeight: 600, letterSpacing: 0.3,
        }}>
          Back to Platform
        </Link>
      </div>

      {/* Demo content */}
      <Outlet />
    </div>
  )
}
