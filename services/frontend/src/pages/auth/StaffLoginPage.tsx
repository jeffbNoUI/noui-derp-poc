/**
 * Staff portal login page — dark theme, NoUI "N" branding, username + password fields.
 * Standalone page rendered outside StaffLayout chrome.
 * Consumed by: router.tsx (/staff/login route)
 * Depends on: auth-demo-data.ts (simulateStaffLogin, DEMO_STAFF_USERS, quickStaffLogin), react-router-dom
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { simulateStaffLogin, DEMO_STAFF_USERS, quickStaffLogin } from '@/api/auth-demo-data'
import type { StaffUser } from '@/types/Auth'

export function StaffLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const session = simulateStaffLogin({ username, password })
    if (!session) {
      setError('Invalid username or password.')
      return
    }
    navigate('/staff')
  }

  const handleQuickLogin = (user: StaffUser) => {
    quickStaffLogin(user)
    navigate('/staff')
  }

  const accent = '#00bfa5'
  const surface = '#0d1f2d'
  const card = '#152736'
  const border = '#1e3a4f'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${surface} 0%, #0a1520 100%)`,
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{
        width: 380, background: card, borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.30)', border: `1px solid ${border}`,
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, #00695c)`,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>N</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#e0f2f1', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            NoUI Staff Portal
          </div>
          <div style={{ fontSize: 12, color: '#5a8a8a', marginTop: 2 }}>Benefits Administration Workspace</div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#b0cece', marginBottom: 4 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username"
            style={inputStyle(border)} />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#b0cece', marginBottom: 4, marginTop: 14 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
            style={inputStyle(border)} />

          {error && (
            <div style={{ fontSize: 12, color: '#ef5350', marginTop: 12, padding: '8px 12px', background: 'rgba(239,83,80,0.12)', borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button type="submit" style={{
            width: '100%', padding: '10px 0', marginTop: 20, fontSize: 14, fontWeight: 600,
            color: '#fff', background: accent, border: 'none', borderRadius: 8,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#00a089' }}
            onMouseLeave={e => { e.currentTarget.style.background = accent }}
          >Sign In</button>
        </form>

        {/* Demo quick-access */}
        <div style={{ marginTop: 24, borderTop: `1px solid ${border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: '#5a8a8a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
            Demo Quick Access
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {DEMO_STAFF_USERS.map(u => (
              <button key={u.id} onClick={() => handleQuickLogin(u)} style={{
                flex: 1, padding: '8px 6px', fontSize: 11, color: '#b0cece',
                background: 'rgba(0,191,165,0.06)', border: `1px solid ${border}`,
                borderRadius: 6, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = '#e0f2f1' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.color = '#b0cece' }}
              >
                <div style={{ fontWeight: 600, fontSize: 12, textTransform: 'capitalize' }}>{u.role}</div>
                <div style={{ fontSize: 9, color: '#5a8a8a', marginTop: 2 }}>{u.displayName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 11, color: '#5a8a8a', textDecoration: 'none' }}>Back to Platform</Link>
        </div>
      </div>
    </div>
  )
}

function inputStyle(border: string): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', fontSize: 13, color: '#e0f2f1',
    border: `1px solid ${border}`, borderRadius: 6, outline: 'none',
    background: 'rgba(255,255,255,0.04)', boxSizing: 'border-box',
  }
}
