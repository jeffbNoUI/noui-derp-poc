/**
 * Member forgot password page — email input with simulated "reset link sent" confirmation.
 * MyCOPERA branding, standalone page rendered outside MemberLayout chrome.
 * Consumed by: router.tsx (/portal/forgot-password route)
 * Depends on: react-router-dom
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'

export function MemberForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const accent = '#00796b'
  const accentHover = '#00695c'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setSent(true)
  }

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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>C</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2e2e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Reset Password
          </div>
        </div>

        {sent ? (
          /* Confirmation */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#e0f2f1',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 24, color: accent }}>{'\u2709'}</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2e2e', marginBottom: 8 }}>
              Check Your Email
            </div>
            <div style={{ fontSize: 13, color: '#4a6363', lineHeight: 1.6, marginBottom: 24 }}>
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              Please check your inbox and follow the instructions.
            </div>
            <Link to="/portal/login" style={{
              display: 'inline-block', padding: '10px 32px', fontSize: 14, fontWeight: 600,
              color: '#fff', background: accent, borderRadius: 8, textDecoration: 'none',
            }}>Back to Sign In</Link>
          </div>
        ) : (
          /* Email form */
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 13, color: '#4a6363', marginBottom: 16, lineHeight: 1.5 }}>
              Enter the email address associated with your MyCOPERA account and we'll send you a reset link.
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#1a2e2e', marginBottom: 4 }}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
              style={{
                width: '100%', padding: '9px 12px', fontSize: 13, color: '#1a2e2e',
                border: '1px solid #d4e0e0', borderRadius: 6, outline: 'none',
                background: '#f9fcfc', boxSizing: 'border-box' as const,
              }} />

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
            >Send Reset Link</button>

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link to="/portal/login" style={{ fontSize: 12, color: accent, textDecoration: 'none' }}>Back to Sign In</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
