/**
 * Demo landing page — focused entry point for live demonstrations to COPERA leadership.
 * Shows case cards for retirement application processing across COPERA divisions.
 * Consumed by: router.tsx (/demo route)
 * Depends on: DEMO_CASES (constants), react-router-dom, divisionMeta (theme)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_CASES } from '@/lib/constants'
import { divisionMeta } from '@/theme'

const DIVISION_COLORS: Record<string, string> = {
  State: '#003366',
  School: '#0066a1',
  LocalGov: '#2e7d32',
  Judicial: '#6a1b9a',
  DPS: '#c08b00',
}

const CASE_DETAILS: Record<string, { desc: string; features: string[] }> = {
  'COPERA-001': {
    desc: 'Normal retirement with Rule of 80 eligibility — State Division, PERA 1',
    features: ['Rule of 80 (90≥80)', '36-month HAS', 'No anti-spiking', 'Options 1/2/3'],
  },
  'COPERA-002': {
    desc: 'Early retirement with anti-spiking triggered — School Division, PERA 6',
    features: ['Early retirement', '32% reduction', 'Anti-spiking (108% cap)', '1.0% annual increase'],
  },
  'COPERA-003': {
    desc: 'DPS Rule of 80 retirement with pop-up payment options',
    features: ['DPS division', 'Rule of 80', 'Options A/B/P2/P3', 'Pop-up feature'],
  },
}

const ROLES = ['Benefits Analyst', 'Customer Service Rep', 'Benefits Counselor', 'Supervisor']

export function DemoLanding() {
  const navigate = useNavigate()
  const [role, setRole] = useState('Benefits Analyst')
  const [toast, setToast] = useState('')

  const handleRoleChange = (newRole: string) => {
    setRole(newRole)
    setToast(`Workspace recomposed for ${newRole}`)
    setTimeout(() => setToast(''), 2500)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column' as const,
      background: '#f5f7fa', fontFamily: "'Source Sans 3', sans-serif",
    }}>
      {/* Header bar */}
      <div style={{
        background: '#001a33', padding: '12px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6, background: '#003366',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>N</div>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            Colorado PERA
          </span>
          <span style={{
            color: '#c08b00', fontSize: 10, marginLeft: 8,
            border: '1px solid #c08b00', borderRadius: 3, padding: '1px 6px',
          }}>POC</span>
        </div>

        {/* Role selector — visual demo prop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#9bb0b0', fontSize: 11 }}>Role:</span>
          <select
            value={role}
            onChange={e => handleRoleChange(e.target.value)}
            style={{
              background: '#002244', color: '#e0e8f0', border: '1px solid #336699',
              borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer',
            }}
          >
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: 56, left: '50%', transform: 'translateX(-50%)',
          background: '#003366', color: '#fff', padding: '8px 20px',
          borderRadius: 6, fontSize: 12, fontWeight: 500, zIndex: 1000,
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>{toast}</div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column' as const,
        alignItems: 'center', padding: '48px 20px',
      }}>
        <div style={{
          fontSize: 11, color: '#003366', textTransform: 'uppercase' as const,
          letterSpacing: 2, fontWeight: 600, marginBottom: 8,
        }}>NoUI Proof of Concept</div>
        <div style={{
          fontSize: 24, fontWeight: 700, color: '#1a2233',
          fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8,
        }}>Staff Processing Workspaces</div>
        <div style={{
          fontSize: 13, color: '#4a5568', marginBottom: 40, maxWidth: 560,
          textAlign: 'center' as const, lineHeight: 1.6,
        }}>
          Multi-division pension administration — State, School, Local Government, Judicial, and DPS.
          Every calculation traced to C.R.S. Title 24 Article 51.
        </div>

        {/* ── Retirement Application ── */}
        <SectionLabel title="Retirement Application" count={3} color="#003366" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16, width: '100%', maxWidth: 720, marginBottom: 32,
        }}>
          {DEMO_CASES.map((c, i) => (
            <CaseCard
              key={c.id}
              caseNum={i + 1}
              name={c.name}
              details={CASE_DETAILS[c.id]}
              division={c.division}
              onClick={() => navigate(`/staff/case/${c.id}/guided`)}
            />
          ))}
        </div>

        {/* Secondary links */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12, width: '100%', maxWidth: 720,
        }}>
          <button onClick={() => navigate('/demos/data-quality')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d1d9e6', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c62828' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d9e6' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2233', marginBottom: 3 }}>
              Data Quality
            </div>
            <div style={{ fontSize: 11, color: '#5a6b7f' }}>IBM i data assessment findings</div>
          </button>
          <button onClick={() => navigate('/demos/operational')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d1d9e6', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#003366' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d9e6' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2233', marginBottom: 3 }}>
              Population Analysis
            </div>
            <div style={{ fontSize: 11, color: '#5a6b7f' }}>Eligibility projections and workload</div>
          </button>
          <button onClick={() => navigate('/demos/change-management')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d1d9e6', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b5cf6' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d9e6' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2233', marginBottom: 3 }}>
              Change Management
            </div>
            <div style={{ fontSize: 11, color: '#5a6b7f' }}>AI-accelerated rule change lifecycle</div>
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d1d9e6', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#003366' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d1d9e6' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2233', marginBottom: 3 }}>
              Full Platform
            </div>
            <div style={{ fontSize: 11, color: '#5a6b7f' }}>All capabilities and demo services</div>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 10, color: '#9ba8b8', marginTop: 40, textAlign: 'center' as const,
          maxWidth: 500, lineHeight: 1.6,
        }}>
          The rules engine is configured with certified plan provisions from C.R.S. Title 24 Article 51.
          AI composes the workspace to show the right information for each situation.
          Every calculation is transparent and verifiable.
        </div>
      </div>
    </div>
  )
}

// ─── Section Label ─────────────────────────────────────────────────────

function SectionLabel({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      width: '100%', maxWidth: 720, marginBottom: 12,
    }}>
      <div style={{ width: 3, height: 18, borderRadius: 2, background: color }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2233' }}>{title}</span>
      <span style={{
        fontSize: 10, color, fontWeight: 600,
        background: `${color}15`, padding: '2px 8px', borderRadius: 4,
      }}>{count} Cases</span>
    </div>
  )
}

// ─── Case Card ──────────────────────────────────────────────────────────

function CaseCard({ caseNum, name, details, division, onClick }: {
  caseNum: number; name: string; details: { desc: string; features: string[] }
  division: string; onClick: () => void
}) {
  const color = DIVISION_COLORS[division] ?? '#003366'
  const dm = divisionMeta[division]
  return (
    <button onClick={onClick} style={{
      padding: 20, background: '#fff',
      border: '1px solid #d1d9e6', borderRadius: 12, borderLeft: `4px solid ${color}`,
      cursor: 'pointer', textAlign: 'left' as const,
      boxShadow: '0 2px 8px rgba(0,20,60,0.06)',
      transition: 'all 0.2s', fontFamily: 'inherit',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,20,60,0.10)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,20,60,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: '#5a6b7f', fontWeight: 600 }}>CASE {caseNum}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, color, background: dm?.muted ?? `${color}15`,
          padding: '2px 8px', borderRadius: 4,
        }}>{dm?.label ?? division}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2233', marginBottom: 4 }}>{name}</div>
      <div style={{ fontSize: 11.5, color: '#4a5568', lineHeight: 1.5, marginBottom: 10 }}>{details.desc}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
        {details.features.map(f => (
          <span key={f} style={{
            fontSize: 9.5, color: '#5a6b7f', background: '#eef2f7',
            padding: '2px 7px', borderRadius: 3,
          }}>{f}</span>
        ))}
      </div>
    </button>
  )
}
