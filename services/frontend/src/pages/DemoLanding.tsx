/**
 * Demo landing page — focused entry point for live demonstrations to DERP leadership.
 * Shows 4 case cards, DQ Dashboard link, and role selector (visual demo prop).
 * Consumed by: router.tsx (/demo route)
 * Depends on: DEMO_CASES (constants), react-router-dom, tierMeta (theme)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_CASES } from '@/lib/constants'
import { tierMeta } from '@/theme'

const TIER_COLORS: Record<number, string> = { 1: '#1565c0', 2: '#e65100', 3: '#2e7d32' }

const CASE_DETAILS: Record<string, { desc: string; features: string[] }> = {
  '10001': {
    desc: 'Rule of 75 retirement with leave payout and 75% J&S election',
    features: ['Rule of 75 (91.75)', '36-month AMS', 'Leave payout', '75% J&S'],
  },
  '10002': {
    desc: 'Early retirement with purchased service and threshold proximity',
    features: ['Early retirement', '30% reduction', 'Purchased service', '11 months to Rule of 75'],
  },
  '10003': {
    desc: 'Tier 3 early retirement with 60-month AMS window',
    features: ['Tier 3 rules', '60-month AMS', '6% per year reduction', '$500/yr death benefit reduction'],
  },
  '10004': {
    desc: 'Rule of 75 retirement with active Domestic Relations Order',
    features: ['DRO split (40%)', 'Marital fraction 63.48%', 'DRO before J&S', 'Fixed alternate payee amount'],
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
      background: '#f6f9f9', fontFamily: "'Source Sans 3', sans-serif",
    }}>
      {/* Header bar */}
      <div style={{
        background: '#00363a', padding: '12px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 6, background: '#00796b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff',
          }}>N</div>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            Denver Employees Retirement Plan
          </span>
          <span style={{
            color: '#4db6ac', fontSize: 10, marginLeft: 8,
            border: '1px solid #4db6ac', borderRadius: 3, padding: '1px 6px',
          }}>POC</span>
        </div>

        {/* Role selector — visual demo prop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#9bb0b0', fontSize: 11 }}>Role:</span>
          <select
            value={role}
            onChange={e => handleRoleChange(e.target.value)}
            style={{
              background: '#004d40', color: '#e0f2f1', border: '1px solid #4db6ac',
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
          background: '#00796b', color: '#fff', padding: '8px 20px',
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
          fontSize: 11, color: '#00796b', textTransform: 'uppercase' as const,
          letterSpacing: 2, fontWeight: 600, marginBottom: 8,
        }}>NoUI Proof of Concept</div>
        <div style={{
          fontSize: 24, fontWeight: 700, color: '#1a2e2e',
          fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8,
        }}>Retirement Application Workspace</div>
        <div style={{
          fontSize: 13, color: '#4a6363', marginBottom: 40, maxWidth: 560,
          textAlign: 'center' as const, lineHeight: 1.6,
        }}>
          Built from DERP governing documents — 52 business rules traced to the Revised Municipal Code.
          The rules engine calculates; the workspace shows the right information for each situation.
        </div>

        {/* Case cards */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16, width: '100%', maxWidth: 720, marginBottom: 32,
        }}>
          {DEMO_CASES.map((c, i) => {
            const details = CASE_DETAILS[c.id]
            const color = TIER_COLORS[c.tier]
            const tm = tierMeta[c.tier]
            return (
              <button key={c.id} onClick={() => navigate(`/staff/case/${c.id}/guided`)} style={{
                padding: 20, background: '#fff',
                border: '1px solid #d4e0e0', borderRadius: 12, borderLeft: `4px solid ${color}`,
                cursor: 'pointer', textAlign: 'left' as const,
                boxShadow: '0 2px 8px rgba(0,54,58,0.06)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,54,58,0.10)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,54,58,0.06)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: '#5a7878', fontWeight: 600 }}>CASE {i + 1}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color, background: tm.muted,
                    padding: '2px 8px', borderRadius: 4,
                  }}>Tier {c.tier}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2e2e', marginBottom: 4 }}>
                  {c.name}{c.id === '10004' ? ' + DRO' : ''}
                </div>
                <div style={{ fontSize: 11.5, color: '#4a6363', lineHeight: 1.5, marginBottom: 10 }}>
                  {details.desc}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                  {details.features.map(f => (
                    <span key={f} style={{
                      fontSize: 9.5, color: '#5a7878', background: '#f0f5f5',
                      padding: '2px 7px', borderRadius: 3,
                    }}>{f}</span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Secondary links */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12, width: '100%', maxWidth: 720,
        }}>
          <button onClick={() => navigate('/demos/data-quality')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d4e0e0', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c62828' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4e0e0' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e2e', marginBottom: 3 }}>
              Data Quality
            </div>
            <div style={{ fontSize: 11, color: '#5a7878' }}>45 findings across 6 detector types</div>
          </button>
          <button onClick={() => navigate('/demos/operational')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d4e0e0', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565c0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4e0e0' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e2e', marginBottom: 3 }}>
              Population Analysis
            </div>
            <div style={{ fontSize: 11, color: '#5a7878' }}>Eligibility projections and workload</div>
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '16px 20px', background: '#fff',
            border: '1px solid #d4e0e0', borderRadius: 10,
            cursor: 'pointer', textAlign: 'left' as const,
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#00796b' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d4e0e0' }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2e2e', marginBottom: 3 }}>
              Full Platform
            </div>
            <div style={{ fontSize: 11, color: '#5a7878' }}>All capabilities and demo services</div>
          </button>
        </div>

        {/* Footer */}
        <div style={{
          fontSize: 10, color: '#9bb0b0', marginTop: 40, textAlign: 'center' as const,
          maxWidth: 500, lineHeight: 1.6,
        }}>
          The rules engine is configured with certified plan provisions from the Revised Municipal Code.
          AI composes the workspace to show the right information for each situation.
          Every calculation is transparent and verifiable.
        </div>
      </div>
    </div>
  )
}
