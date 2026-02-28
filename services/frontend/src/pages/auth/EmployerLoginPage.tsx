/**
 * Employer portal login page — navy/blue branding, org code + username + password fields.
 * Standalone page rendered outside EmployerLayout chrome.
 * Consumed by: router.tsx (/employer/login route)
 * Depends on: auth-demo-data.ts (simulateEmployerLogin, DEMO_EMPLOYER_USERS, quickEmployerLogin), react-router-dom
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { simulateEmployerLogin, DEMO_EMPLOYER_USERS, quickEmployerLogin } from '@/api/auth-demo-data'
import type { EmployerUser } from '@/types/Auth'

export function EmployerLoginPage() {
  const navigate = useNavigate()
  const [orgCode, setOrgCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const session = simulateEmployerLogin({ orgCode, username, password })
    if (!session) {
      setError('Invalid credentials. Please check your organization code and login information.')
      return
    }
    navigate('/employer')
  }

  const handleQuickLogin = (user: EmployerUser) => {
    quickEmployerLogin(user)
    navigate('/employer')
  }

  const accent = '#3b82f6'
  const accentHover = '#2563eb'

  // Deduplicate: one admin per org for quick access buttons
  const quickAccessUsers = DEMO_EMPLOYER_USERS.filter(u => u.role === 'admin')

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{
        width: 400, background: '#ffffff', borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.20)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: '#1e293b',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>D</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            DERP Employer Portal
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Department Reporting & Coordination</div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Organization Code</label>
          <input value={orgCode} onChange={e => setOrgCode(e.target.value.toUpperCase())} placeholder="e.g. PW, PR, FIN"
            style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 14 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username"
            style={inputStyle} />

          <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
            style={inputStyle} />

          {error && (
            <div style={{ fontSize: 12, color: '#dc2626', marginTop: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 }}>
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
          fontSize: 11, color: '#64748b', marginTop: 16, padding: '10px 12px',
          background: '#f8fafc', borderRadius: 6, border: '1px solid #e2e8f0',
          lineHeight: 1.5,
        }}>
          Contact your DERP administrator for portal access credentials.
        </div>

        {/* Demo quick-access */}
        <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>
            Demo Quick Access
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {quickAccessUsers.map(u => (
              <button key={u.id} onClick={() => handleQuickLogin(u)} style={{
                flex: 1, padding: '8px 6px', fontSize: 11, color: '#1e293b',
                background: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 6, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0' }}
              >
                <div style={{ fontWeight: 600, fontSize: 12 }}>{u.orgName}</div>
                <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>{u.displayName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}>Back to Platform</Link>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 4,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, color: '#1e293b',
  border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none',
  background: '#f8fafc', boxSizing: 'border-box',
}
