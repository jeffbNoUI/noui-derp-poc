/**
 * Landing page — choose between Staff Portal and Member Portal.
 * Matches the portal switcher concept from noui-multi-portal.jsx.
 */
import { useNavigate } from 'react-router-dom'

const portals = [
  {
    id: 'staff',
    name: 'Staff Portal',
    subtitle: 'Benefits Analyst Workspace',
    description: 'Process retirement applications, verify eligibility, calculate benefits.',
    icon: 'N',
    bg: '#00363a',
    accent: '#00bfa5',
    path: '/staff',
  },
  {
    id: 'member',
    name: 'Member Portal',
    subtitle: 'MyDERP · Your Retirement Journey',
    description: 'Start your retirement application, track progress, manage documents.',
    icon: 'D',
    bg: '#00796b',
    accent: '#b2dfdb',
    path: '/portal',
  },
]

export function PortalSwitcher() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      background: '#f6f9f9', fontFamily: "'Source Sans 3', sans-serif",
    }}>
      <div style={{
        fontSize: 11, color: '#00796b', textTransform: 'uppercase' as const,
        letterSpacing: 2, fontWeight: 600, marginBottom: 8,
      }}>NoUI DERP POC</div>
      <div style={{
        fontSize: 24, fontWeight: 700, color: '#1a2e2e',
        fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8,
      }}>Choose Your Portal</div>
      <div style={{
        fontSize: 13, color: '#4a6363', marginBottom: 32, maxWidth: 400, textAlign: 'center' as const,
      }}>
        This proof of concept demonstrates two perspectives: the member applying for retirement and the analyst processing it.
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {portals.map(p => (
          <button key={p.id} onClick={() => navigate(p.path)} style={{
            width: 260, padding: 24, background: '#ffffff',
            border: '1px solid #d4e0e0', borderRadius: 12,
            cursor: 'pointer', textAlign: 'left' as const,
            boxShadow: '0 2px 8px rgba(0,54,58,0.06)',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = p.bg
              e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,54,58,0.10)`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#d4e0e0'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,54,58,0.06)'
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: p.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 14,
            }}>{p.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2e2e', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: 11, color: '#728f8f', marginBottom: 10 }}>{p.subtitle}</div>
            <div style={{ fontSize: 12, color: '#4a6363', lineHeight: 1.5 }}>{p.description}</div>
          </button>
        ))}
      </div>
      <div style={{
        fontSize: 10, color: '#9bb0b0', marginTop: 32, textAlign: 'center' as const, maxWidth: 400,
      }}>
        The rules engine is configured with certified plan provisions.
        AI composes the workspace; the rules engine determines the numbers.
      </div>
    </div>
  )
}
