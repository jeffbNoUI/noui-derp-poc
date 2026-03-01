/**
 * Member portal login page — MyCOPERA branding, dual-mode login (Member ID + DOB or Email + Password).
 * Standalone page rendered outside MemberLayout chrome.
 * Consumed by: router.tsx (/portal/login route)
 * Depends on: auth-demo-data.ts (simulateMemberLogin, DEMO_MEMBER_USERS, quickMemberLogin), react-router-dom
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { simulateMemberLogin, DEMO_MEMBER_USERS, quickMemberLogin } from '@/api/auth-demo-data'

type LoginMode = 'member-id' | 'email'

export function MemberLoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>('member-id')
  const [memberId, setMemberId] = useState('')
  const [dob, setDob] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [demoOpen, setDemoOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const session = mode === 'member-id'
      ? simulateMemberLogin({ memberId, dob })
      : simulateMemberLogin({ email, password })
    if (!session) {
      setError(mode === 'member-id' ? 'Member ID not found. Please check your information.' : 'Invalid email or password.')
      return
    }
    navigate('/portal')
  }

  const handleQuickLogin = (user: typeof DEMO_MEMBER_USERS[number]) => {
    quickMemberLogin(user)
    navigate('/portal')
  }

  const accent = '#00796b'
  const accentHover = '#00695c'

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f6f6 0%, #e0f2f1 100%)',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{
        width: 400, background: '#fff', borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0,54,58,0.10)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>C</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2e2e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            MyCOPERA
          </div>
          <div style={{ fontSize: 12, color: '#5a7878', marginTop: 2 }}>Your Retirement Journey</div>
        </div>

        {/* Tab selector */}
        <div style={{
          display: 'flex', borderRadius: 8, overflow: 'hidden', marginBottom: 24,
          border: '1px solid #d4e0e0',
        }}>
          {([['member-id', 'Member ID + DOB'], ['email', 'Email + Password']] as const).map(([key, label]) => (
            <button key={key} onClick={() => { setMode(key); setError('') }} style={{
              flex: 1, padding: '8px 0', fontSize: 12, fontWeight: mode === key ? 600 : 400,
              color: mode === key ? '#fff' : '#5a7878',
              background: mode === key ? accent : 'transparent',
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          {mode === 'member-id' ? (
            <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2e2e', marginBottom: 4 }}>Member ID</label>
              <input value={memberId} onChange={e => setMemberId(e.target.value)} placeholder="e.g. 10001"
                style={inputStyle} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2e2e', marginBottom: 4, marginTop: 14 }}>Date of Birth</label>
              <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />
            </>
          ) : (
            <>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2e2e', marginBottom: 4 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                style={inputStyle} />
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2e2e', marginBottom: 4, marginTop: 14 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
                style={inputStyle} />
            </>
          )}

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

        {/* Links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <Link to="/portal/register" style={{ fontSize: 12, color: accent, textDecoration: 'none' }}>Create Account</Link>
          <Link to="/portal/forgot-password" style={{ fontSize: 12, color: accent, textDecoration: 'none' }}>Forgot Password?</Link>
        </div>

        {/* Demo quick-access */}
        <div style={{ marginTop: 24, borderTop: '1px solid #e8efef', paddingTop: 16 }}>
          <button onClick={() => setDemoOpen(v => !v)} style={{
            width: '100%', fontSize: 10, color: '#9bb0b0', background: 'none',
            border: '1px dashed #d4e0e0', padding: '6px 0', borderRadius: 6,
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
          }}>Demo Quick Access {demoOpen ? '\u25B2' : '\u25BC'}</button>
          {demoOpen && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 8 }}>
              {DEMO_MEMBER_USERS.map(u => (
                <button key={u.id} onClick={() => handleQuickLogin(u)} style={{
                  padding: '8px 10px', fontSize: 11, color: '#1a2e2e', background: '#f0f6f6',
                  border: '1px solid #d4e0e0', borderRadius: 6, cursor: 'pointer',
                  textAlign: 'left', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = accent }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4e0e0' }}
                >
                  <div style={{ fontWeight: 600 }}>{u.displayName}</div>
                  <div style={{ fontSize: 9, color: '#5a7878' }}>Tier {u.tier} · ID {u.memberId}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Back to portal switcher */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link to="/" style={{ fontSize: 11, color: '#9bb0b0', textDecoration: 'none' }}>Back to Platform</Link>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, color: '#1a2e2e',
  border: '1px solid #d4e0e0', borderRadius: 6, outline: 'none',
  background: '#f9fcfc', boxSizing: 'border-box',
}
