/**
 * Member profile page — demographics editing, address management, contact preferences.
 * Members can update their own info; address mismatches with employer create staff work items.
 * Consumed by: router.tsx (/portal/profile)
 * Depends on: useTheme, usePortalAuth, useMember hooks, demo-data fixtures
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useMember } from '@/hooks/useMember'
import { formatDate } from '@/lib/utils'

interface AddressRecord {
  type: 'home' | 'mailing'
  line1: string
  line2: string
  city: string
  state: string
  zip: string
}

interface ContactInfo {
  email: string
  phone: string
  altPhone: string
}

// Mock employer address for mismatch detection
const EMPLOYER_ADDRESS: AddressRecord = {
  type: 'home',
  line1: '201 W Colfax Ave',
  line2: 'Dept 1505',
  city: 'Denver',
  state: 'CO',
  zip: '80202',
}

function EditableField({ label, value, onSave, type = 'text', readonly = false, T }: {
  label: string; value: string; onSave: (v: string) => void
  type?: string; readonly?: boolean; T: ReturnType<typeof useTheme>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (readonly) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const,
          letterSpacing: 0.5, fontWeight: 600, marginBottom: 3,
        }}>{label}</div>
        <div style={{
          fontSize: 13, color: T.text.secondary, fontStyle: 'italic',
        }}>{value || '\u2014'}</div>
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontSize: 10, color: T.text.muted, textTransform: 'uppercase' as const,
        letterSpacing: 0.5, fontWeight: 600, marginBottom: 3,
      }}>{label}</div>
      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type={type} value={draft} onChange={e => setDraft(e.target.value)}
            autoFocus
            style={{
              flex: 1, padding: '6px 10px', fontSize: 13, borderRadius: 6,
              border: `1px solid ${T.border.focus}`, outline: 'none',
              background: T.surface.bg, color: T.text.primary,
              fontFamily: 'inherit',
            }}
          />
          <button onClick={() => { onSave(draft); setEditing(false) }} style={{
            padding: '6px 12px', fontSize: 11, fontWeight: 600,
            background: T.accent.primary, color: T.accent.on,
            border: 'none', borderRadius: 6, cursor: 'pointer',
          }}>Save</button>
          <button onClick={() => { setDraft(value); setEditing(false) }} style={{
            padding: '6px 10px', fontSize: 11, color: T.text.muted,
            background: 'transparent', border: `1px solid ${T.border.base}`,
            borderRadius: 6, cursor: 'pointer',
          }}>Cancel</button>
        </div>
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{
            fontSize: 13, color: T.text.primary, cursor: 'pointer',
            borderBottom: `1px dashed ${T.border.base}`, paddingBottom: 2,
            display: 'inline-block',
          }}
          title="Click to edit"
        >{value || '\u2014'}</div>
      )}
    </div>
  )
}

function AddressCard({ address, onSave, T, employerMismatch }: {
  address: AddressRecord
  onSave: (a: AddressRecord) => void
  T: ReturnType<typeof useTheme>
  employerMismatch?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(address)

  return (
    <div style={{
      padding: 16, background: T.surface.card, borderRadius: 10,
      border: `1px solid ${employerMismatch ? T.status.warning : T.border.base}`,
      boxShadow: T.shadow,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: 12, fontWeight: 700, color: T.text.primary,
          textTransform: 'capitalize' as const,
        }}>{address.type} Address</span>
        {!editing && (
          <button onClick={() => setEditing(true)} style={{
            fontSize: 10, color: T.accent.primary, background: 'transparent',
            border: `1px solid ${T.accent.light}`, padding: '3px 10px',
            borderRadius: 4, cursor: 'pointer', fontWeight: 600,
          }}>Edit</button>
        )}
      </div>

      {employerMismatch && (
        <div style={{
          padding: '8px 12px', borderRadius: 6,
          background: T.status.warningBg, borderLeft: `3px solid ${T.status.warning}`,
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: T.status.warning }}>
            Address Mismatch
          </div>
          <div style={{ fontSize: 10, color: T.status.warning, marginTop: 2 }}>
            This address differs from what your employer has on file. A work ticket
            will be created for staff review when you save changes.
          </div>
        </div>
      )}

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
          {(['line1', 'line2', 'city', 'state', 'zip'] as const).map(field => (
            <div key={field}>
              <div style={{
                fontSize: 10, color: T.text.muted, marginBottom: 2,
                textTransform: 'uppercase' as const,
              }}>{field === 'line1' ? 'Street' : field === 'line2' ? 'Apt/Suite' : field}</div>
              <input
                value={draft[field]}
                onChange={e => setDraft({ ...draft, [field]: e.target.value })}
                style={{
                  width: '100%', padding: '6px 10px', fontSize: 13, borderRadius: 6,
                  border: `1px solid ${T.border.base}`, outline: 'none',
                  background: T.surface.bg, color: T.text.primary,
                  fontFamily: 'inherit', boxSizing: 'border-box' as const,
                }}
              />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button onClick={() => { onSave(draft); setEditing(false) }} style={{
              padding: '7px 16px', fontSize: 12, fontWeight: 600,
              background: T.accent.primary, color: T.accent.on,
              border: 'none', borderRadius: 6, cursor: 'pointer',
            }}>Save Address</button>
            <button onClick={() => { setDraft(address); setEditing(false) }} style={{
              padding: '7px 14px', fontSize: 12, color: T.text.muted,
              background: 'transparent', border: `1px solid ${T.border.base}`,
              borderRadius: 6, cursor: 'pointer',
            }}>Cancel</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: T.text.primary, lineHeight: 1.6 }}>
          {address.line1}<br />
          {address.line2 && <>{address.line2}<br /></>}
          {address.city}, {address.state} {address.zip}
        </div>
      )}
    </div>
  )
}


export function MemberProfile() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = usePortalAuth()
  const member = useMember(memberId)
  const m = member.data

  // Local editable state — in production these would persist to API
  const [contact, setContact] = useState<ContactInfo>({
    email: 'member@example.com',
    phone: '(303) 555-0142',
    altPhone: '',
  })

  const [addresses, setAddresses] = useState<AddressRecord[]>([
    { type: 'home', line1: '1234 Elm Street', line2: 'Apt 5B', city: 'Denver', state: 'CO', zip: '80203' },
    { type: 'mailing', line1: '1234 Elm Street', line2: 'Apt 5B', city: 'Denver', state: 'CO', zip: '80203' },
  ])

  const [saved, setSaved] = useState(false)

  // Check for employer address mismatch
  const homeAddr = addresses.find(a => a.type === 'home')
  const hasMismatch = homeAddr && (
    homeAddr.line1 !== EMPLOYER_ADDRESS.line1 ||
    homeAddr.city !== EMPLOYER_ADDRESS.city ||
    homeAddr.zip !== EMPLOYER_ADDRESS.zip
  )

  function handleAddressSave(updated: AddressRecord) {
    setAddresses(prev => prev.map(a => a.type === updated.type ? updated : a))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (member.isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, color: T.text.muted }}>Loading profile...</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/portal')} style={{
          fontSize: 13, background: 'transparent', border: `1px solid ${T.border.base}`,
          borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: T.text.secondary,
        }}>&larr; Dashboard</button>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 700, color: T.text.primary,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>My Profile</div>
          <div style={{ fontSize: 12, color: T.text.secondary }}>
            Update your personal information and contact details
          </div>
        </div>
      </div>

      {/* Save confirmation banner */}
      {saved && (
        <div style={{
          padding: '10px 16px', borderRadius: 8,
          background: T.status.successBg, borderLeft: `3px solid ${T.status.success}`,
          marginBottom: 16, fontSize: 12, color: T.status.success, fontWeight: 600,
        }}>
          Changes saved successfully.
        </div>
      )}

      {/* Personal Information */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Personal Information</span>
        </div>
        <div style={{
          padding: '16px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px',
        }}>
          <EditableField label="First Name" value={m?.first_name || ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Last Name" value={m?.last_name || ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Date of Birth" value={m?.date_of_birth ? formatDate(m.date_of_birth) : ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Member ID" value={m?.member_id || ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Department" value={m?.department || ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Position" value={m?.position || ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Hire Date" value={m?.hire_date ? formatDate(m.hire_date) : ''} onSave={() => {}} readonly T={T} />
          <EditableField label="Tier" value={m ? `Tier ${m.tier}` : ''} onSave={() => {}} readonly T={T} />
        </div>
        <div style={{
          padding: '10px 20px 14px', borderTop: `1px solid ${T.border.subtle}`,
        }}>
          <div style={{ fontSize: 10, color: T.text.muted, fontStyle: 'italic' }}>
            Personal information is maintained by your employer. Contact HR to request changes.
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Contact Information</span>
        </div>
        <div style={{
          padding: '16px 20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px',
        }}>
          <EditableField
            label="Email Address" type="email"
            value={contact.email}
            onSave={v => { setContact(c => ({ ...c, email: v })); setSaved(true); setTimeout(() => setSaved(false), 3000) }}
            T={T}
          />
          <EditableField
            label="Phone Number" type="tel"
            value={contact.phone}
            onSave={v => { setContact(c => ({ ...c, phone: v })); setSaved(true); setTimeout(() => setSaved(false), 3000) }}
            T={T}
          />
          <EditableField
            label="Alternate Phone" type="tel"
            value={contact.altPhone}
            onSave={v => { setContact(c => ({ ...c, altPhone: v })); setSaved(true); setTimeout(() => setSaved(false), 3000) }}
            T={T}
          />
        </div>
      </div>

      {/* Addresses */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: T.text.primary, marginBottom: 12,
        }}>Addresses</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {addresses.map(addr => (
            <AddressCard
              key={addr.type}
              address={addr}
              onSave={handleAddressSave}
              T={T}
              employerMismatch={addr.type === 'home' && !!hasMismatch}
            />
          ))}
        </div>
      </div>

      {/* Communication Preferences */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Communication Preferences</span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {[
            { label: 'Annual Statements', desc: 'Receive your annual benefit statement by email', checked: true },
            { label: 'Retirement Reminders', desc: 'Get notified when you reach eligibility milestones', checked: true },
            { label: 'Plan Updates', desc: 'Receive news about plan changes and open enrollment', checked: false },
          ].map(pref => (
            <label key={pref.label} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 0', borderBottom: `1px solid ${T.border.subtle}`,
              cursor: 'pointer',
            }}>
              <input type="checkbox" defaultChecked={pref.checked} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text.primary }}>{pref.label}</div>
                <div style={{ fontSize: 11, color: T.text.muted, marginTop: 1 }}>{pref.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
