/**
 * Member self-registration page — 3-step inline flow: verify identity, create credentials, confirmation.
 * MyCOPERA branding, standalone page rendered outside MemberLayout chrome.
 * Consumed by: router.tsx (/portal/register route)
 * Depends on: auth-demo-data.ts (DEMO_MEMBER_USERS, simulateCreateMemberAccount), react-router-dom
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DEMO_MEMBER_USERS, simulateCreateMemberAccount } from '@/api/auth-demo-data'

type Step = 'verify' | 'credentials' | 'confirmation'

export function MemberRegisterPage() {
  const [step, setStep] = useState<Step>('verify')

  // Step 1: Verify identity
  const [memberId, setMemberId] = useState('')
  const [dob, setDob] = useState('')
  const [ssnLast4, setSsnLast4] = useState('')
  const [verifyError, setVerifyError] = useState('')

  // Step 2: Create credentials
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [credError, setCredError] = useState('')

  // Step 3: result
  const [createdName, setCreatedName] = useState('')

  const accent = '#00796b'
  const accentHover = '#00695c'

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyError('')
    // Simulated: check if member ID exists in demo data
    const found = DEMO_MEMBER_USERS.find(u => u.memberId === memberId)
    if (!found) {
      setVerifyError('Member not found. Please verify your Member ID and try again.')
      return
    }
    if (!dob || !ssnLast4 || ssnLast4.length !== 4) {
      setVerifyError('Please enter your date of birth and the last 4 digits of your SSN.')
      return
    }
    setEmail('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setStep('credentials')
  }

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault()
    setCredError('')
    if (!email || !username || !password) {
      setCredError('All fields are required.')
      return
    }
    if (password.length < 8) {
      setCredError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setCredError('Passwords do not match.')
      return
    }
    const user = simulateCreateMemberAccount({ memberId, dateOfBirth: dob, ssnLast4, email, username, password })
    if (!user) {
      setCredError('Unable to create account. Please try again.')
      return
    }
    setCreatedName(user.displayName)
    setStep('confirmation')
  }

  const stepLabels = ['Verify Identity', 'Create Credentials', 'Confirmation']
  const stepIndex = step === 'verify' ? 0 : step === 'credentials' ? 1 : 2

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f6f6 0%, #e0f2f1 100%)',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{
        width: 420, background: '#fff', borderRadius: 16, padding: '40px 36px',
        boxShadow: '0 8px 32px rgba(0,54,58,0.10)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10, background: accent,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>C</span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a2e2e', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Create Your MyCOPERA Account
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 3, borderRadius: 2, marginBottom: 4,
                background: i <= stepIndex ? accent : '#d4e0e0',
                transition: 'background 0.2s',
              }} />
              <div style={{ fontSize: 10, color: i <= stepIndex ? accent : '#9bb0b0', fontWeight: i === stepIndex ? 600 : 400 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Step 1: Verify Identity */}
        {step === 'verify' && (
          <form onSubmit={handleVerify}>
            <div style={{ fontSize: 13, color: '#4a6363', marginBottom: 16, lineHeight: 1.5 }}>
              Enter your COPERA Member ID and personal information to verify your identity.
            </div>

            <label style={labelStyle}>Member ID</label>
            <input value={memberId} onChange={e => setMemberId(e.target.value)} placeholder="e.g. 10001" style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Date of Birth</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>SSN (Last 4 Digits)</label>
            <input value={ssnLast4} onChange={e => setSsnLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234" maxLength={4} style={inputStyle} />

            {verifyError && (
              <div style={{ fontSize: 12, color: '#c62828', marginTop: 12, padding: '8px 12px', background: '#ffebee', borderRadius: 6 }}>
                {verifyError}
              </div>
            )}

            <button type="submit" style={btnStyle(accent)}
              onMouseEnter={e => { e.currentTarget.style.background = accentHover }}
              onMouseLeave={e => { e.currentTarget.style.background = accent }}
            >Verify Identity</button>
          </form>
        )}

        {/* Step 2: Create Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCreateAccount}>
            <div style={{ fontSize: 13, color: '#4a6363', marginBottom: 16, lineHeight: 1.5 }}>
              Identity verified. Now set up your login credentials.
            </div>

            <label style={labelStyle}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />

            <label style={{ ...labelStyle, marginTop: 14 }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" style={inputStyle} />

            {credError && (
              <div style={{ fontSize: 12, color: '#c62828', marginTop: 12, padding: '8px 12px', background: '#ffebee', borderRadius: 6 }}>
                {credError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button type="button" onClick={() => setStep('verify')} style={{
                flex: '0 0 auto', padding: '10px 16px', fontSize: 13, fontWeight: 500,
                color: '#5a7878', background: 'none', border: '1px solid #d4e0e0',
                borderRadius: 8, cursor: 'pointer',
              }}>Back</button>
              <button type="submit" style={{ ...btnStyle(accent), marginTop: 0, flex: 1 }}
                onMouseEnter={e => { e.currentTarget.style.background = accentHover }}
                onMouseLeave={e => { e.currentTarget.style.background = accent }}
              >Create Account</button>
            </div>
          </form>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: '#e8f5e9',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 28, color: '#2e7d32' }}>{'\u2713'}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a2e2e', marginBottom: 8 }}>
              Account Created
            </div>
            <div style={{ fontSize: 13, color: '#4a6363', lineHeight: 1.6, marginBottom: 24 }}>
              Welcome, {createdName}! Your MyCOPERA account has been created successfully.
              You can now sign in to view your retirement information and start your application.
            </div>
            <Link to="/portal/login" style={{
              display: 'inline-block', padding: '10px 32px', fontSize: 14, fontWeight: 600,
              color: '#fff', background: accent, borderRadius: 8, textDecoration: 'none',
            }}>Sign In</Link>
          </div>
        )}

        {/* Back to login */}
        {step !== 'confirmation' && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Link to="/portal/login" style={{ fontSize: 11, color: '#9bb0b0', textDecoration: 'none' }}>
              Already have an account? Sign In
            </Link>
          </div>
        )}
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

function btnStyle(bg: string): React.CSSProperties {
  return {
    width: '100%', padding: '10px 0', marginTop: 20, fontSize: 14, fontWeight: 600,
    color: '#fff', background: bg, border: 'none', borderRadius: 8,
    cursor: 'pointer', transition: 'background 0.15s',
  }
}
