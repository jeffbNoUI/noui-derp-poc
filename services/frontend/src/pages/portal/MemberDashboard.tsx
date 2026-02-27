/**
 * Member dashboard — retirement readiness card, application status, quick links.
 * Shows hero benefit amount from rules engine, application progress if one exists,
 * and "Start Application" button if no application is in progress.
 * Consumed by: router.tsx (index route under /portal)
 * Depends on: useTheme, usePortalAuth, useMember hooks, useApplication, constants (fmt, dates)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useMember, useServiceCredit } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation, useScenarios } from '@/hooks/useCalculations'
import { useApplication } from '@/hooks/usePortal'
import { STATUS_DISPLAY, PROGRESS_STAGES } from '@/types/Portal'
import { DEFAULT_RETIREMENT_DATES, fmt } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { ApplicationStatus as AppStatus } from '@/types/Portal'


export function MemberDashboard() {
  const T = useTheme()
  const navigate = useNavigate()
  const { memberId } = usePortalAuth()
  const retDate = DEFAULT_RETIREMENT_DATES[memberId] || '2026-04-01'

  const member = useMember(memberId)
  const service = useServiceCredit(memberId)
  const eligibility = useEligibility(memberId, retDate)
  const benefit = useBenefitCalculation(memberId, retDate)
  const application = useApplication(memberId)

  const m = member.data
  const svc = service.data
  const elig = eligibility.data
  const ben = benefit.data
  const app = application.data

  // What-If scenario calculator state
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const scenarioDates = (() => {
    const base = new Date(retDate)
    const dates: string[] = []
    for (let offset = -2; offset <= 3; offset++) {
      const d = new Date(base)
      d.setFullYear(d.getFullYear() + offset)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  })()
  const scenarios = useScenarios(memberId, scenarioOpen ? scenarioDates : [])

  if (member.isLoading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 13, color: T.text.muted }}>Loading your information...</div>
      </div>
    )
  }

  const tierLabel = m ? `Tier ${m.tier}` : ''

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      {/* Welcome */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          fontSize: 20, fontWeight: 700, color: T.text.primary,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>Welcome back, {m?.first_name || 'Member'}</div>
        <div style={{ fontSize: 13, color: T.text.secondary, marginTop: 4 }}>
          Here's your retirement readiness summary.
        </div>
      </div>

      {/* Retirement Readiness Card */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadowLg,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.border.subtle}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Retirement Readiness</span>
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 99,
            background: T.tier[`t${m?.tier || 1}bg` as keyof typeof T.tier],
            color: T.tier[`t${m?.tier || 1}` as keyof typeof T.tier],
            fontWeight: 700, textTransform: 'uppercase' as const,
          }}>{tierLabel}</span>
        </div>
        <div style={{ padding: '20px' }}>
          {/* Benefit hero */}
          <div style={{
            padding: 20, background: T.accent.surface, borderRadius: 10,
            border: `1px solid ${T.accent.light}`, textAlign: 'center' as const,
            marginBottom: 20,
          }}>
            <div style={{
              fontSize: 11, color: T.text.muted, letterSpacing: 1,
              textTransform: 'uppercase' as const, marginBottom: 4,
            }}>Estimated Monthly Benefit</div>
            <div style={{
              fontSize: 36, fontWeight: 800, color: T.accent.primary,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{fmt(ben?.net_monthly_benefit)}</div>
            {ben && (
              <div style={{ fontSize: 12, color: T.text.secondary, marginTop: 6 }}>
                {(ben.multiplier * 100).toFixed(1)}% x {fmt(ben.ams)} x {ben.service_years_for_benefit} years
              </div>
            )}
          </div>

          {/* Quick stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
            {[
              ['Years of Service', svc ? `${svc.total_service_years} years` : '--'],
              ['Retirement Type', elig?.retirement_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '--'],
              ['Target Date', retDate ? formatDate(retDate) : '--'],
              ['Reduction', elig ? (elig.reduction_factor < 1 ? `${((1 - elig.reduction_factor) * 100).toFixed(0)}%` : 'None') : '--'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{
                  fontSize: 11, color: T.text.muted, marginBottom: 2,
                  textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600,
                }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text.primary }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Eligibility callout */}
          {elig && (
            <div style={{
              marginTop: 16, padding: '10px 14px', borderRadius: 8,
              background: elig.reduction_factor >= 1 ? T.status.successBg : T.status.warningBg,
              borderLeft: `3px solid ${elig.reduction_factor >= 1 ? T.status.success : T.status.warning}`,
            }}>
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: elig.reduction_factor >= 1 ? T.status.success : T.status.warning,
              }}>
                {elig.reduction_factor >= 1
                  ? `Rule of ${elig.rule_of_n_threshold} Met — No Reduction`
                  : `Early Retirement — ${((1 - elig.reduction_factor) * 100).toFixed(0)}% Reduction`
                }
              </div>
              <div style={{
                fontSize: 11, marginTop: 2,
                color: elig.reduction_factor >= 1 ? T.status.success : T.status.warning,
              }}>
                {elig.conditions_met[elig.conditions_met.length - 1]}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Status Card */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Your Application</span>
        </div>
        <div style={{ padding: '20px' }}>
          {app ? (
            <>
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {PROGRESS_STAGES.map((stage, i) => {
                  const stageIdx = PROGRESS_STAGES.findIndex(s => s.key === app.status)
                  const isComplete = i < stageIdx
                  const isCurrent = i === stageIdx
                  return (
                    <div key={stage.key} style={{ flex: 1, textAlign: 'center' as const }}>
                      <div style={{
                        height: 4, borderRadius: 2,
                        background: isComplete ? T.status.success : isCurrent ? T.accent.primary : T.border.subtle,
                        transition: 'background 0.3s', marginBottom: 6,
                      }} />
                      <div style={{
                        fontSize: 9, fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? T.accent.primary : isComplete ? T.status.success : T.text.muted,
                      }}>{stage.label}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{
                padding: '10px 14px', background: T.accent.surface, borderRadius: 8,
                borderLeft: `3px solid ${T.accent.primary}`,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.accent.primary }}>
                  {STATUS_DISPLAY[app.status as AppStatus]?.label || app.status}
                </div>
                <div style={{ fontSize: 12, color: T.text.secondary, marginTop: 2 }}>
                  {STATUS_DISPLAY[app.status as AppStatus]?.detail}
                </div>
              </div>
              <button onClick={() => navigate(`/portal/status/${app.app_id}`)} style={{
                marginTop: 14, padding: '8px 20px', borderRadius: 8,
                background: 'transparent', border: `1px solid ${T.border.base}`,
                color: T.text.secondary, fontSize: 12, fontWeight: 600,
                cursor: 'pointer',
              }}>View Full Status</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: T.text.secondary, marginBottom: 14, lineHeight: 1.5 }}>
                You haven't started a retirement application yet. When you're ready,
                we'll walk you through each step.
              </div>
              <button onClick={() => navigate('/portal/apply/new')} style={{
                padding: '10px 28px', borderRadius: 8, fontSize: 14, fontWeight: 700,
                border: 'none', background: T.accent.primary, color: T.accent.on,
                cursor: 'pointer',
              }}>Start Your Application</button>
            </>
          )}
        </div>
      </div>

      {/* Life Events — visually rich navigable cards */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>Life Events</span>
          <span onClick={() => navigate('/portal/life-events')} style={{
            fontSize: 11, color: T.accent.primary, cursor: 'pointer', fontWeight: 600,
          }}>See all events &rarr;</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            {
              label: "I'm Ready to Retire",
              desc: 'Start your retirement application and see your estimated benefit',
              icon: '\u2600', color: '#00796b', bg: '#e0f2f1', gradFrom: '#e0f2f1', gradTo: '#b2dfdb',
              eventId: 'retirement',
            },
            {
              label: 'Something Changed',
              desc: 'Report a marriage, divorce, name change, or other life update',
              icon: '\u21C4', color: '#16a34a', bg: '#dcfce7', gradFrom: '#dcfce7', gradTo: '#bbf7d0',
              eventId: 'life-change',
            },
            {
              label: 'Manage Account',
              desc: 'Update beneficiaries, tax withholding, or contact preferences',
              icon: '\u2699', color: '#475569', bg: '#f1f5f9', gradFrom: '#f1f5f9', gradTo: '#e2e8f0',
              eventId: 'account',
            },
          ].map(item => (
            <button
              key={item.eventId}
              onClick={() => navigate(`/portal/life-events/${item.eventId}`)}
              style={{
                padding: 0, background: T.surface.card, borderRadius: 12,
                border: `1px solid ${T.border.base}`, cursor: 'pointer',
                textAlign: 'left' as const, fontFamily: 'inherit',
                boxShadow: T.shadow, overflow: 'hidden',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = T.shadowLg
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = T.shadow
              }}
            >
              {/* Colored header strip */}
              <div style={{
                background: `linear-gradient(135deg, ${item.gradFrom}, ${item.gradTo})`,
                padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#ffffff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: item.color, flexShrink: 0,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}>{item.icon}</div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: item.color, lineHeight: 1.3,
                }}>{item.label}</div>
              </div>
              {/* Description */}
              <div style={{
                padding: '12px 16px 14px', fontSize: 11, lineHeight: 1.5,
                color: T.text.secondary,
              }}>{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* What-If Benefit Calculator */}
      <div style={{
        background: T.surface.card, borderRadius: 12,
        border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
        overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${T.border.subtle}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.text.primary }}>What-If Calculator</span>
          <button onClick={() => setScenarioOpen(v => !v)} style={{
            fontSize: 11, fontWeight: 600, color: T.accent.primary,
            background: scenarioOpen ? T.accent.surface : 'transparent',
            border: `1px solid ${scenarioOpen ? T.accent.light : T.border.base}`,
            padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
          }}>{scenarioOpen ? 'Hide Scenarios' : 'Compare Dates'}</button>
        </div>
        {!scenarioOpen ? (
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, color: T.text.secondary, lineHeight: 1.5 }}>
              See how your benefit changes based on different retirement dates.
              Compare up to 6 scenarios side by side.
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px 20px' }}>
            {scenarios.isLoading ? (
              <div style={{ fontSize: 12, color: T.text.muted, textAlign: 'center' as const, padding: 20 }}>
                Calculating scenarios...
              </div>
            ) : scenarios.data ? (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {scenarios.data.map(s => {
                  const isBase = s.retirement_date === retDate
                  const diff = ben ? s.net_monthly_benefit - ben.net_monthly_benefit : 0
                  return (
                    <div key={s.retirement_date} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 8,
                      background: isBase ? T.accent.surface : T.surface.cardAlt,
                      border: `1px solid ${isBase ? T.accent.light : T.border.subtle}`,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 12, fontWeight: isBase ? 700 : 500,
                          color: isBase ? T.accent.primary : T.text.primary,
                        }}>
                          {formatDate(s.retirement_date)}
                          {isBase && <span style={{ fontSize: 10, marginLeft: 6, fontWeight: 400 }}>(current)</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>
                          Age {s.age_at_retirement.toFixed(1)} · {s.retirement_type?.replace(/_/g, ' ')}
                          {s.reduction_factor < 1 && ` · ${((1 - s.reduction_factor) * 100).toFixed(0)}% reduction`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{
                          fontSize: 15, fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          color: isBase ? T.accent.primary : T.text.primary,
                        }}>{fmt(s.net_monthly_benefit)}</div>
                        {!isBase && diff !== 0 && (
                          <div style={{
                            fontSize: 10, fontWeight: 600,
                            color: diff > 0 ? T.status.success : T.status.danger,
                          }}>{diff > 0 ? '+' : ''}{fmt(diff)}/mo</div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div style={{
                  fontSize: 10, color: T.text.muted, marginTop: 4, fontStyle: 'italic',
                }}>
                  Estimates from the rules engine. Actual benefit determined at retirement.
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'IPR Estimate', value: ben?.ipr ? fmt(ben.ipr.monthly_amount) + '/mo' : '--', sub: 'Insurance Premium Reduction', path: '' },
          { label: 'Death Benefit', value: ben?.death_benefit ? fmt(ben.death_benefit.amount) : '--', sub: 'Lump sum benefit', path: '' },
          { label: 'My Profile', value: '\u270E', sub: 'Update demographics & address', path: '/portal/profile' },
          { label: 'Contact DERP', value: '(303) 839-5419', sub: 'Mon-Fri 8am-5pm', path: '' },
        ].map(item => (
          <div key={item.label} onClick={() => item.path && navigate(item.path)} style={{
            padding: 16, background: T.surface.card, borderRadius: 8,
            border: `1px solid ${T.border.base}`, boxShadow: T.shadow,
            cursor: item.path ? 'pointer' : 'default',
            transition: item.path ? 'transform 0.15s' : 'none',
          }}
            onMouseEnter={e => { if (item.path) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { if (item.path) e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{
              fontSize: 10, color: T.text.muted, letterSpacing: 0.5,
              textTransform: 'uppercase' as const, fontWeight: 600,
            }}>{item.label}</div>
            <div style={{
              fontSize: 18, fontWeight: 800, color: item.path ? T.accent.primary : T.text.primary,
              fontFamily: "'JetBrains Mono', monospace", marginTop: 4,
            }}>{item.value}</div>
            <div style={{ fontSize: 10, color: T.text.muted, marginTop: 2 }}>{item.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
