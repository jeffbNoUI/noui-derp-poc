/**
 * Staff welcome screen — process type sections with demo case cards.
 * Three sections: Retirement Application (Cases 1-4), Contribution Refund (Cases 7-8),
 * Death & Survivor Benefits (Cases 9-10). Each routes to its dedicated workspace.
 * Consumed by: router.tsx (index route under /staff)
 * Depends on: Badge, DEMO_CASES, DEMO_REFUND_CASES, DEMO_DEATH_CASES, theme (C, tierMeta)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { DEMO_CASES, DEMO_REFUND_CASES, DEMO_DEATH_CASES } from '@/lib/constants'
import { usePendingSubmissions } from '@/hooks/useFormSubmission'
import { useSubmittedReports } from '@/hooks/useContributionReview'
import { LIFE_EVENTS } from '@/lib/life-events'
import { fmt } from '@/lib/constants'

const DEPT_NAMES: Record<string, string> = {
  PW: 'Public Works',
  PR: 'Parks & Recreation',
  FIN: 'Finance',
}

const MEMBER_NAMES: Record<string, string> = {
  '10001': 'Robert Martinez',
  '10002': 'Jennifer Kim',
  '10003': 'David Washington',
  '10004': 'Robert Martinez',
}


export function StaffWelcomeScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'expert' | 'guided'>('expert')
  const { data: pending = [] } = usePendingSubmissions()
  const { data: submittedReports = [] } = useSubmittedReports()

  return (
    <div style={{
      flex: 1, overflow: 'auto', padding: '24px 16px',
    }}>
      <div style={{
        maxWidth: '640px', margin: '0 auto',
        display: 'flex', flexDirection: 'column' as const, gap: '20px',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center' as const }}>
          <div style={{
            fontSize: '11px', color: C.accent, textTransform: 'uppercase' as const,
            letterSpacing: '2px', fontWeight: 600,
          }}>Phase 1: Transparent</div>
          <div style={{ color: C.text, fontSize: '18px', fontWeight: 700, marginTop: '4px' }}>
            Staff Workspace
          </div>
          <div style={{
            color: C.textSecondary, fontSize: '12px', maxWidth: '400px',
            margin: '4px auto 0', lineHeight: '1.5',
          }}>
            Select a process type and demo case. Every calculation is transparent and verifiable.
          </div>
        </div>

        {/* ── Incoming Work ── */}
        {pending.length > 0 && (
          <div>
            <SectionHeader title="Incoming Work" badge={`${pending.length} Pending`} color="#16a34a" />
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px',
            }}>
              {pending.slice(0, 4).map(b => {
                const event = LIFE_EVENTS.find(e => e.eventId === b.eventId)
                return (
                  <button key={b.bundleId} onClick={() => navigate(`/staff/queue/${b.bundleId}`)} style={{
                    padding: '14px', background: C.surface, border: `1px solid ${C.borderSubtle}`,
                    borderRadius: '8px', cursor: 'pointer', textAlign: 'left' as const,
                    transition: 'border-color 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#16a34a')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: C.text, fontWeight: 600, fontSize: '12.5px' }}>
                        {MEMBER_NAMES[b.memberId] || `Member ${b.memberId}`}
                      </span>
                      <Badge text="New" bg="#16a34a20" color="#16a34a" />
                    </div>
                    <div style={{ color: C.textMuted, fontSize: '10px' }}>{event?.title || b.eventId}</div>
                    <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
                      {b.forms.length} form{b.forms.length !== 1 ? 's' : ''} · {b.submittedAt ? new Date(b.submittedAt).toLocaleDateString() : 'Pending'}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => navigate('/staff/queue')} style={{
              width: '100%', padding: '8px', borderRadius: '6px', fontSize: '10.5px',
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.textSecondary, cursor: 'pointer', fontWeight: 500,
              marginBottom: '8px',
            }}>View Full Work Queue</button>
          </div>
        )}

        {/* ── Contribution Reports ── */}
        {submittedReports.length > 0 && (
          <div>
            <SectionHeader title="Contribution Reports" badge={`${submittedReports.length} Pending`} color="#0d9488" />
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px',
            }}>
              {submittedReports.slice(0, 4).map(r => (
                <button key={r.report_id} onClick={() => navigate(`/staff/contributions/${r.report_id}`)} style={{
                  padding: '14px', background: C.surface, border: `1px solid ${C.borderSubtle}`,
                  borderRadius: '8px', cursor: 'pointer', textAlign: 'left' as const,
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#0d9488')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: C.text, fontWeight: 600, fontSize: '12.5px' }}>
                      {DEPT_NAMES[r.department] || r.department}
                    </span>
                    <Badge text="New" bg="#0d948820" color="#0d9488" />
                  </div>
                  <div style={{ color: C.textMuted, fontSize: '10px' }}>{r.period}</div>
                  <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>
                    {fmt(r.total_gross_payroll)} · {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : 'Pending'}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => navigate('/staff/contributions')} style={{
              width: '100%', padding: '8px', borderRadius: '6px', fontSize: '10.5px',
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.textSecondary, cursor: 'pointer', fontWeight: 500,
              marginBottom: '8px',
            }}>View All Contribution Reports</button>
          </div>
        )}

        {/* ── Retirement Application Section ── */}
        <div>
          <SectionHeader title="Retirement Application" badge="4 Cases" color={C.accent} />
          {/* Mode selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div data-discovery="mode-toggle" style={{
              display: 'flex', borderRadius: '6px', overflow: 'hidden',
              border: `1px solid ${C.border}`,
            }}>
              <button onClick={() => setMode('expert')} style={{
                padding: '5px 14px', border: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: mode === 'expert' ? 600 : 400,
                color: mode === 'expert' ? C.accent : C.textMuted,
                background: mode === 'expert' ? C.accentMuted : 'transparent',
                letterSpacing: '0.5px',
              }}>Expert</button>
              <button onClick={() => setMode('guided')} style={{
                padding: '5px 14px', border: 'none', borderLeft: `1px solid ${C.border}`,
                cursor: 'pointer', fontSize: '10px', fontWeight: mode === 'guided' ? 600 : 400,
                color: mode === 'guided' ? C.accent : C.textMuted,
                background: mode === 'guided' ? C.accentMuted : 'transparent',
                letterSpacing: '0.5px',
              }}>Guided</button>
            </div>
            <span style={{ color: C.textDim, fontSize: '9px' }}>
              {mode === 'expert' ? 'All panels visible' : 'Step-by-step processing'}
            </span>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
          }}>
            {DEMO_CASES.map(c => (
                <CaseCard
                  key={c.id}
                  name={c.name}
                  caseNum={c.id === '10004' ? '4' : String(Number(c.id) - 10000)}
                  label={c.label}
                  tier={c.tier}
                  onClick={() => navigate(`/staff/case/${c.id}${mode === 'guided' ? '/guided' : ''}`)}
                />
            ))}
          </div>
        </div>

        {/* ── Contribution Refund Section ── */}
        <div>
          <SectionHeader title="Contribution Refund" badge="2 Cases" color={C.warm} />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
          }}>
            {DEMO_REFUND_CASES.map(c => (
              <CaseCard
                key={c.id}
                name={c.name}
                caseNum={String(Number(c.id) - 10000)}
                label={c.label}
                tier={c.tier}
                onClick={() => navigate(`/staff/refund/${c.id}`)}
              />
            ))}
          </div>
        </div>

        {/* ── Death & Survivor Section ── */}
        <div>
          <SectionHeader title="Death & Survivor Benefits" badge="2 Cases" color={C.danger} />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
          }}>
            {DEMO_DEATH_CASES.map(c => (
              <CaseCard
                key={c.id}
                name={c.name}
                caseNum={String(Number(c.id) - 10000)}
                label={c.label}
                tier={c.tier}
                onClick={() => navigate(`/staff/death/${c.id}`)}
              />
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/staff/compare')} style={{
            padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px',
            border: `1px solid ${C.border}`, background: 'transparent',
            color: C.textSecondary, cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary }}
          >{'\u2194\uFE0F'} Compare Cases</button>
          <button onClick={() => {
            window.dispatchEvent(new CustomEvent('noui:start-walkthrough', { detail: 'full-case-processing' }))
          }} style={{
            padding: '7px 14px', borderRadius: '6px', fontSize: '10.5px',
            border: `1px solid ${C.accent}`, background: C.accentMuted,
            color: C.accent, cursor: 'pointer', fontWeight: 600,
            transition: 'all 0.15s',
          }}>{'\uD83C\uDF93'} Start Guided Tour</button>
        </div>
        <div style={{
          color: C.textDim, fontSize: '10px', maxWidth: '350px',
          textAlign: 'center' as const, margin: '0 auto',
        }}>
          The rules engine is configured with certified plan provisions.
          AI composes the workspace; the rules engine determines the numbers.
        </div>
      </div>
    </div>
  )
}

// ─── Section Header ────────────────────────────────────────────────────

function SectionHeader({ title, badge, color }: { title: string; badge: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      marginBottom: '8px', paddingBottom: '4px',
      borderBottom: `1px solid ${C.borderSubtle}`,
    }}>
      <span style={{ color: C.text, fontWeight: 600, fontSize: '13px' }}>{title}</span>
      <Badge text={badge} bg={`${color}20`} color={color} />
    </div>
  )
}

// ─── Case Card ─────────────────────────────────────────────────────────

function CaseCard({ name, caseNum, label, tier, onClick }: {
  name: string; caseNum: string; label: string; tier: number; onClick: () => void
}) {
  const t = tierMeta[tier]
  return (
    <button onClick={onClick} style={{
      padding: '14px', background: C.surface,
      border: `1px solid ${C.borderSubtle}`, borderRadius: '8px',
      cursor: 'pointer', textAlign: 'left' as const,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ color: C.text, fontWeight: 600, fontSize: '12.5px' }}>{name}</span>
        <Badge text={`T${tier}`} bg={t.muted} color={t.color} />
      </div>
      <div style={{ color: C.textMuted, fontSize: '10px' }}>Case {caseNum}</div>
      <div style={{ color: C.textSecondary, fontSize: '10px', marginTop: '2px' }}>{label}</div>
    </button>
  )
}
