/**
 * Employer user management page — manage users for the current department.
 * Admin-only page: invite users, view existing users, assign roles.
 * Consumed by: router.tsx (/employer/users route)
 * Depends on: auth-demo-data.ts (DEMO_EMPLOYER_USERS), EmployerAuthContext, employer theme
 */
import { useState } from 'react'
import { useEmployerAuth, DEMO_EMPLOYERS } from '@/employer/auth/EmployerAuthContext'
import { DEMO_EMPLOYER_USERS } from '@/api/auth-demo-data'
import { employerTheme as T } from '@/theme'
import type { EmployerUser, EmployerRole } from '@/types/Auth'

export function UserManagement() {
  const { deptId } = useEmployerAuth()
  const currentDept = DEMO_EMPLOYERS.find(d => d.id === deptId)

  // Local state for user list — filter to current dept
  const [users, setUsers] = useState<EmployerUser[]>(
    DEMO_EMPLOYER_USERS.filter(u => u.orgCode === deptId)
  )
  const [showInvite, setShowInvite] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState<EmployerRole>('viewer')

  const handleInvite = () => {
    if (!formName || !formEmail) return
    const newUser: EmployerUser = {
      id: `E${Date.now()}`,
      username: formEmail.split('@')[0],
      displayName: formName,
      email: formEmail,
      portal: 'employer',
      role: formRole,
      orgCode: deptId,
      orgName: currentDept?.name ?? deptId,
    }
    setUsers(prev => [...prev, newUser])
    setShowInvite(false)
    setFormName(''); setFormEmail(''); setFormRole('viewer')
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: T.text.primary, marginBottom: 4 }}>User Management</div>
      <div style={{ fontSize: 12, color: T.text.muted, marginBottom: 20 }}>
        Manage portal access for {currentDept?.name ?? deptId}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: T.text.secondary }}>{users.length} users</div>
        <button onClick={() => setShowInvite(v => !v)} style={{
          fontSize: 12, fontWeight: 600, color: '#fff', background: T.accent.primary,
          border: 'none', padding: '7px 16px', borderRadius: 6, cursor: 'pointer',
        }}>{showInvite ? 'Cancel' : 'Invite User'}</button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <div style={{
          padding: 16, background: T.surface.cardAlt, border: `1px solid ${T.border.base}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary, marginBottom: 12 }}>Invite New User</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle(T)}>Full Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Jane Smith"
                style={inputStyle(T)} />
            </div>
            <div>
              <label style={labelStyle(T)}>Email</label>
              <input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@denver.gov"
                style={inputStyle(T)} />
            </div>
            <div>
              <label style={labelStyle(T)}>Role</label>
              <select value={formRole} onChange={e => setFormRole(e.target.value as EmployerRole)}
                style={{ ...inputStyle(T), cursor: 'pointer' }}>
                <option value="admin">Admin</option>
                <option value="payroll">Payroll</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <button onClick={handleInvite} style={{
            marginTop: 12, padding: '8px 20px', fontSize: 12, fontWeight: 600,
            color: '#fff', background: T.accent.primary, border: 'none',
            borderRadius: 6, cursor: 'pointer',
          }}>Send Invite</button>
        </div>
      )}

      {/* Users table */}
      <div style={{
        background: T.surface.card, border: `1px solid ${T.border.base}`,
        borderRadius: 8, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border.base}` }}>
              {['Name', 'Email', 'Role', 'Status'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                  color: T.text.muted, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${T.border.subtle}` }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: T.text.primary }}>
                  {u.displayName}
                  <div style={{ fontSize: 10, color: T.text.muted, fontWeight: 400 }}>{u.username}</div>
                </td>
                <td style={{ padding: '10px 14px', color: T.text.secondary }}>{u.email}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 10, padding: '2px 10px', borderRadius: 4, fontWeight: 600,
                    background: T.accent.surface, color: T.accent.primary, textTransform: 'capitalize',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 10, padding: '2px 10px', borderRadius: 4, fontWeight: 600,
                    background: T.status.successBg, color: T.status.success,
                  }}>Active</span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '20px 14px', color: T.text.muted, textAlign: 'center' }}>
                  No users for this department. Click "Invite User" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function labelStyle(T: typeof import('@/theme').employerTheme): React.CSSProperties {
  return {
    display: 'block', fontSize: 10, fontWeight: 600, color: T.text.muted,
    marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5,
  }
}

function inputStyle(T: typeof import('@/theme').employerTheme): React.CSSProperties {
  return {
    width: '100%', padding: '8px 10px', fontSize: 12, color: T.text.primary,
    border: `1px solid ${T.border.base}`, borderRadius: 4, outline: 'none',
    background: T.surface.card, boxSizing: 'border-box',
  }
}
