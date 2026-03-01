/**
 * Vendor portal login page — green branding, vendor code + username + password fields.
 * Standalone page rendered outside VendorLayout chrome.
 * Consumed by: router.tsx (/vendor/login route)
 * Depends on: auth-demo-data.ts (simulateVendorLogin, DEMO_VENDOR_USERS, quickVendorLogin), react-router-dom
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { simulateVendorLogin, DEMO_VENDOR_USERS, quickVendorLogin } from '@/api/auth-demo-data'
import type { VendorUser } from '@/types/Auth'

export function VendorLoginPage() {
  const navigate = useNavigate()
  const [vendorCode, setVendorCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const session = simulateVendorLogin({ vendorCode, username, password })
    if (!session) {
      setError('Invalid credentials. Please check your vendor code and login information.')
      return
    }
    navigate('/vendor')
  }

  const handleQuickLogin = (user: VendorUser) => {
    quickVendorLogin(user)
    navigate('/vendor')
  }

  const accent = '#059669'
  const accentHover = '#047857'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{
        width: 400, background: '#ffffff', borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0,54,58,0.10)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>V</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2e2e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            COPERA Vendor Portal
          </div>
          <div style={{ fontSize: 12, color: '#5a7878', marginTop: 2 }}>Insurance Enrollment & IPR</div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Vendor Code</label>
          <input value={vendorCode} onChange={e => setVendorCode(e.target.value.toLowerCase())} placeholder="e.g. kaiser, delta"
            style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 14 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username"
            style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
            style={inputStyle} />

          {error && (
            <div style={{ fontSize: 12, color: '#c62828', marginTop: 12, padding: '8px 12px', background: '#ffebee', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button type="submit" style={{
            width: '100%', padding: '10px 0', marginTop: 20, fontSize: 14, fontWeight: 600,
            color: '#fff', background: accent, border: 'none', borderRadius: 8,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = accentHover }}
            onMouseLeave={e => { e.currentTarget.style.background = accent }}
          >Sign In</button>
        </form>

        {/* Info note */}
        <div style={{
          fontSize: 11, color: '#5a7878', marginTop: 16, padding: '10px 12px',
          background: '#f0fdf4', borderRadius: 6, border: '1px solid #d1fae5',
          lineHeight: 1.5,
        }}>
          Contact COPERA to set up vendor portal access for your organization.
        </div>

        {/* Demo quick-access */}
        <div style={{ marginTop: 20, borderTop: '1px solid #e8efef', paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: '#9bb0b0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
            Demo Quick Access
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DEMO_VENDOR_USERS.map(u => (
              <button key={u.id} onClick={() => handleQuickLogin(u)} style={{
                flex: 1, padding: '8px 6px', fontSize: 11, color: '#1a2e2e',
                background: '#f0fdf4', border: '1px solid #d1fae5',
                borderRadius: 6, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1fae5' }}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>{u.vendorName}</div>
                <div style={{ fontSize: 9, color: '#5a7878', marginTop: 2 }}>{u.displayName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 11, color: '#9bb0b0', textDecoration: 'none' }}>Back to Platform</Link>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2e2e', marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, color: '#1a2e2e',
  border: '1px solid #d4e0e0', borderRadius: 6, outline: 'none',
  background: '#f9fcfc', boxSizing: 'border-box',
}
