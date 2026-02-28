/**
 * Staff access management page — create and manage employer/vendor portal accounts.
 * Two tabs: Employer Accounts and Vendor Accounts. Staff-only admin function.
 * Consumed by: router.tsx (/staff/access route)
 * Depends on: auth-demo-data.ts (DEMO_EMPLOYER_USERS, DEMO_VENDOR_USERS, simulateCreateManagedAccount), theme (C)
 */
import { useState } from 'react'
import { C } from '@/theme'
import { DEMO_EMPLOYER_USERS, DEMO_VENDOR_USERS, simulateCreateManagedAccount } from '@/api/auth-demo-data'
import { DEMO_EMPLOYERS } from '@/employer/auth/EmployerAuthContext'
import { DEMO_VENDORS } from '@/vendor/auth/VendorAuthContext'
import type { EmployerUser, VendorUser, EmployerRole, VendorRole } from '@/types/Auth'

type Tab = 'employer' | 'vendor'

export function AccessManagement() {
  const [tab, setTab] = useState<Tab>('employer')
  const [employerUsers, setEmployerUsers] = useState<EmployerUser[]>([...DEMO_EMPLOYER_USERS])
  const [vendorUsers, setVendorUsers] = useState<VendorUser[]>([...DEMO_VENDOR_USERS])
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formOrg, setFormOrg] = useState('')
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formRole, setFormRole] = useState('')

  const handleCreate = () => {
    if (!formOrg || !formName || !formEmail || !formUsername || !formRole) return
    const account = simulateCreateManagedAccount({
      portal: tab, orgCode: formOrg, displayName: formName,
      email: formEmail, username: formUsername,
      role: formRole as (EmployerRole | VendorRole),
    })
    if (tab === 'employer') {
      setEmployerUsers(prev => [...prev, account as EmployerUser])
    } else {
      setVendorUsers(prev => [...prev, account as VendorUser])
    }
    setShowForm(false)
    setFormOrg(''); setFormName(''); setFormEmail(''); setFormUsername(''); setFormRole('')
  }

  const orgs = tab === 'employer'
    ? DEMO_EMPLOYERS.map(d => ({ code: d.id, name: d.name }))
    : DEMO_VENDORS.map(v => ({ code: v.id, name: v.name }))

  const roles = tab === 'employer'
    ? ['admin', 'payroll', 'viewer']
    : ['admin', 'processor']

  const users = tab === 'employer' ? employerUsers : vendorUsers

  return (
    <div style={{ padding: '20px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Access Management</div>
      <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 20 }}>Manage employer and vendor portal accounts</div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20 }}>
        {(['employer', 'vendor'] as Tab[]).map(t => (
          <button key={t} onClick={() => { setTab(t); setShowForm(false) }} style={{
            padding: '8px 20px', fontSize: 12, fontWeight: tab === t ? 600 : 400,
            color: tab === t ? C.accent : C.textMuted,
            background: tab === t ? C.accentMuted : 'transparent',
            border: `1px solid ${tab === t ? C.accent : C.border}`,
            borderRadius: 6, cursor: 'pointer', textTransform: 'capitalize',
          }}>{t} Accounts</button>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.textMuted }}>{users.length} accounts</div>
        <button onClick={() => setShowForm(v => !v)} style={{
          fontSize: 11, fontWeight: 600, color: '#fff', background: C.accent,
          border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
        }}>{showForm ? 'Cancel' : 'Create Account'}</button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{
          padding: 16, background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, marginBottom: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>
            New {tab === 'employer' ? 'Employer' : 'Vendor'} Account
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Organization</label>
              <select value={formOrg} onChange={e => setFormOrg(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {orgs.map(o => <option key={o.code} value={o.code}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select value={formRole} onChange={e => setFormRole(e.target.value)} style={selectStyle}>
                <option value="">Select...</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Jane Smith" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="jane@org.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Username</label>
              <input value={formUsername} onChange={e => setFormUsername(e.target.value)} placeholder="jsmith" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={handleCreate} style={{
                width: '100%', padding: '8px 0', fontSize: 12, fontWeight: 600,
                color: '#fff', background: C.accent, border: 'none', borderRadius: 6, cursor: 'pointer',
              }}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Users table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.border}` }}>
              {['Name', 'Username', 'Email', 'Organization', 'Role', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                  color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={cellStyle}>{u.displayName}</td>
                <td style={cellStyle}>{u.username}</td>
                <td style={{ ...cellStyle, color: C.textMuted }}>{u.email}</td>
                <td style={cellStyle}>{'orgName' in u ? u.orgName : 'vendorName' in u ? u.vendorName : ''}</td>
                <td style={cellStyle}>
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    background: C.accentMuted, color: C.accent, textTransform: 'capitalize',
                  }}>{u.role}</span>
                </td>
                <td style={cellStyle}>
                  <button style={{
                    fontSize: 10, color: C.textDim, background: 'none',
                    border: `1px solid ${C.borderSubtle}`, padding: '2px 6px',
                    borderRadius: 3, cursor: 'pointer', marginRight: 4,
                  }}>Reset PW</button>
                  <button style={{
                    fontSize: 10, color: '#ef5350', background: 'none',
                    border: '1px solid rgba(239,83,80,0.3)', padding: '2px 6px',
                    borderRadius: 3, cursor: 'pointer',
                  }}>Disable</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 600, color: '#b0cece',
  marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', fontSize: 12, color: '#e0f2f1',
  border: '1px solid #1e3a4f', borderRadius: 4, outline: 'none',
  background: 'rgba(255,255,255,0.04)', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer',
}

const cellStyle: React.CSSProperties = {
  padding: '8px 12px', color: '#b0cece',
}
