/**
 * Member Lookup — 360-degree member profile view with search.
 * Card-based layout showing personal info, employment, service credit, eligibility, and benefit data.
 * Non-calculated fields are editable; calculated fields show formula breakdown on click.
 * Consumed by: router.tsx (staff/members and staff/members/:memberId routes)
 * Depends on: theme (C, tierMeta, fmt), Badge, useMember hooks, employer-demo-data (all-member list)
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { fmt } from '@/lib/constants'
import { DEMO_EMPLOYER_EMPLOYEES, DEMO_DEPARTMENTS } from '@/api/employer-demo-data'
import { useMember, useEmployment, useServiceCredit } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation } from '@/hooks/useCalculations'
import { DEFAULT_RETIREMENT_DATES } from '@/lib/constants'
import type { EmployerEmployee } from '@/types/Employer'

// ─── Search / Directory ──────────────────────────────────────────────────────

export function MemberLookup() {
  const { memberId } = useParams()

  if (memberId) return <MemberProfile memberId={memberId} />
  return <MemberDirectory />
}

function MemberDirectory() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  // Only show results when the user has typed a search query (no browsing)
  const hasQuery = search.trim().length >= 2
  const results = hasQuery
    ? DEMO_EMPLOYER_EMPLOYEES.filter(e =>
        `${e.first_name} ${e.last_name} ${e.member_id}`
          .toLowerCase().includes(search.toLowerCase()))
    : []

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px', textAlign: 'center' as const }}>
          <div style={{ color: C.text, fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Member Lookup
          </div>
          <div style={{ color: C.textSecondary, fontSize: '11px', maxWidth: '360px', margin: '0 auto' }}>
            Search by name or member ID to open a member record.
          </div>
        </div>

        {/* Search */}
        <div style={{ maxWidth: '480px', margin: '0 auto 16px' }}>
          <input
            type="text"
            autoFocus
            placeholder="Search by name or member ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '8px', fontSize: '13px',
              border: `1px solid ${C.border}`, background: C.surface, color: C.text,
              outline: 'none', fontFamily: 'system-ui, sans-serif',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={e => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>

        {/* Results — only shown when searching */}
        {hasQuery ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
            {results.length > 0 && (
              <div style={{ color: C.textDim, fontSize: '10px', marginBottom: '2px' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
            )}
            {results.map(emp => (
              <MemberRow key={emp.member_id} emp={emp} onClick={() => navigate(`/staff/members/${emp.member_id}`)} />
            ))}
            {results.length === 0 && (
              <div style={{ color: C.textMuted, fontSize: '12px', padding: '20px', textAlign: 'center' as const }}>
                No members match &ldquo;{search}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' as const, padding: '40px 20px' }}>
            <div style={{ fontSize: '28px', opacity: 0.2, marginBottom: '10px' }}>&#x1F50D;</div>
            <div style={{ color: C.textMuted, fontSize: '12px', lineHeight: '1.6' }}>
              Enter a name or member ID to look up a record.<br />
              <span style={{ color: C.textDim, fontSize: '10px' }}>
                Member files should be accessed in response to a contact &mdash; phone, email, office visit, or online request.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MemberRow({ emp, onClick }: { emp: EmployerEmployee; onClick: () => void }) {
  const t = tierMeta[emp.tier]
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 14px', background: C.surface,
      border: `1px solid ${C.border}`, borderRadius: '8px',
      cursor: 'pointer', textAlign: 'left' as const,
      transition: 'border-color 0.15s', width: '100%',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
    >
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '50%',
        background: t.muted, color: t.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: 700, flexShrink: 0,
      }}>
        {emp.first_name[0]}{emp.last_name[0]}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: C.text, fontWeight: 600, fontSize: '12.5px' }}>
            {emp.first_name} {emp.last_name}
          </span>
          <Badge text={`T${emp.tier}`} bg={t.muted} color={t.color} />
          {emp.retirement_status === 'pending' && (
            <Badge text="Retiring" bg={C.warmMuted} color={C.warm} />
          )}
        </div>
        <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>
          ID {emp.member_id} &middot; {emp.years_of_service.toFixed(1)}y service &middot; {fmt(emp.monthly_salary)}/mo
        </div>
      </div>
    </button>
  )
}

// ─── 360-Degree Member Profile ───────────────────────────────────────────────

function MemberProfile({ memberId }: { memberId: string }) {
  const navigate = useNavigate()
  const { data: member, isLoading: memberLoading } = useMember(memberId)
  const { data: employment } = useEmployment(memberId)
  const { data: sc } = useServiceCredit(memberId)
  const retDate = DEFAULT_RETIREMENT_DATES[memberId as keyof typeof DEFAULT_RETIREMENT_DATES] || '2026-04-01'
  const { data: eligibility } = useEligibility(memberId, retDate)
  const { data: benefit } = useBenefitCalculation(memberId, retDate)

  // Fall back to employer data if member isn't in the main demo-data registry
  const empFallback = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === memberId)

  // Editable overrides for non-calculated fields (local state, demo only)
  const [overrides, setOverrides] = useState<Record<string, string>>({})
  const setField = (key: string, val: string) => setOverrides(prev => ({ ...prev, [key]: val }))
  const getField = (key: string, original: string) => overrides[key] ?? original

  if (memberLoading && !empFallback) {
    return <div style={{ padding: '24px', color: C.textMuted, fontSize: '12px' }}>Loading...</div>
  }

  const name = member
    ? `${member.first_name} ${member.last_name}`
    : empFallback ? `${empFallback.first_name} ${empFallback.last_name}` : 'Unknown'
  const tier = member?.tier ?? empFallback?.tier ?? 1
  const tc = tierMeta[tier] || tierMeta[1]

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        {/* Back link */}
        <button onClick={() => navigate('/staff/members')} style={{
          background: 'none', border: 'none', color: C.accent, cursor: 'pointer',
          fontSize: '11px', padding: 0, marginBottom: '12px',
        }}>&larr; Back to Member Lookup</button>

        {/* Header card */}
        <div style={{
          padding: '16px', background: C.surface, borderRadius: '10px',
          border: `1px solid ${C.border}`, marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: tc.muted, color: tc.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', fontWeight: 800, flexShrink: 0,
          }}>
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: C.text, fontWeight: 700, fontSize: '16px' }}>{name}</span>
              <Badge text={tc.label} bg={tc.muted} color={tc.color} />
            </div>
            <div style={{ color: C.textSecondary, fontSize: '11px', marginTop: '2px' }}>
              ID {memberId}
              {member && <> &middot; {member.department} &middot; {member.position}</>}
              {!member && empFallback && <> &middot; Dept {empFallback.department}</>}
            </div>
          </div>
          {/* Quick action: open case if this is a demo case */}
          {['10001', '10002', '10003', '10004'].includes(memberId) && (
            <button onClick={() => navigate(`/staff/case/${memberId}`)} style={{
              padding: '6px 12px', borderRadius: '6px', fontSize: '10.5px',
              border: `1px solid ${C.accent}`, background: C.accentMuted,
              color: C.accent, cursor: 'pointer', fontWeight: 600, flexShrink: 0,
            }}>Open Case</button>
          )}
        </div>

        {/* Card grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '10px',
        }}>
          {/* Personal Info — source fields are editable */}
          <ProfileCard title="Personal Information">
            <EditableField label="Date of Birth"
              value={getField('dob', member?.date_of_birth || 'N/A')}
              onChange={v => setField('dob', v)} />
            <EditableField label="Hire Date"
              value={getField('hire', member?.hire_date ?? empFallback?.hire_date ?? 'N/A')}
              onChange={v => setField('hire', v)} />
            <EditableField label="Status"
              value={getField('status', member?.status ?? empFallback?.status ?? 'N/A')}
              onChange={v => setField('status', v)} />
            <CalculatedField label="Tier" value={tc.label}
              badge={<Badge text={tc.sub} bg={tc.muted} color={tc.color} />}
              formula="Determined by hire date: Before Sept 2004 = Tier 1, Sept 2004 - June 2011 = Tier 2, After July 2011 = Tier 3" />
          </ProfileCard>

          {/* Service Credit */}
          <ProfileCard title="Service Credit">
            {sc ? (
              <>
                <ProfileField label="Earned" value={`${sc.earned_service_years} years`} />
                {sc.purchased_service_years > 0 && (
                  <ProfileField label="Purchased" value={`${sc.purchased_service_years} years`}
                    badge={<Badge text="Benefit Only" bg={C.warmMuted} color={C.warm} />} />
                )}
                {sc.military_service_years > 0 && (
                  <ProfileField label="Military" value={`${sc.military_service_years} years`} />
                )}
                <CalculatedField label="Total (Benefit)" value={`${sc.total_for_benefit} years`} highlight
                  formula={`Earned (${sc.earned_service_years}y) + Purchased (${sc.purchased_service_years}y)${sc.military_service_years > 0 ? ` + Military (${sc.military_service_years}y)` : ''} = ${sc.total_for_benefit}y`} />
                <CalculatedField label="Vesting"
                  value={sc.earned_service_years >= 5 ? 'Vested' : `${sc.earned_service_years}y / 5y`}
                  badge={sc.earned_service_years >= 5
                    ? <Badge text="Met" bg={C.successMuted} color={C.success} />
                    : <Badge text="Not Met" bg={C.dangerMuted} color={C.danger} />}
                  formula={`${sc.earned_service_years} earned years ${sc.earned_service_years >= 5 ? '>=' : '<'} 5 year requirement (RMC \u00A718-403)`} />
              </>
            ) : empFallback ? (
              <ProfileField label="Years of Service" value={`${empFallback.years_of_service.toFixed(1)} years`} />
            ) : (
              <div style={{ color: C.textMuted, fontSize: '11px' }}>Not available</div>
            )}
          </ProfileCard>

          {/* Eligibility */}
          {eligibility && (
            <ProfileCard title="Eligibility">
              <CalculatedField label="Type" value={eligibility.retirement_type}
                formula={`Age ${eligibility.age_at_retirement} at retirement with Tier ${eligibility.tier} provisions${eligibility.rule_of_n_value ? ` \u2014 Rule of ${eligibility.tier === 3 ? '85' : '75'} value: ${eligibility.rule_of_n_value}` : ''}`} />
              <CalculatedField label="Eligible"
                value={eligibility.eligible ? 'Yes' : 'No'}
                badge={eligibility.eligible
                  ? <Badge text="Eligible" bg={C.successMuted} color={C.success} />
                  : <Badge text="Ineligible" bg={C.dangerMuted} color={C.danger} />}
                formula={`Conditions met: ${eligibility.conditions_met.join(', ') || 'None'}${eligibility.conditions_unmet.length ? `\nConditions unmet: ${eligibility.conditions_unmet.join(', ')}` : ''}`} />
              {eligibility.reduction_factor != null && eligibility.reduction_factor < 1 && (
                <CalculatedField label="Reduction"
                  value={`${((1 - eligibility.reduction_factor) * 100).toFixed(0)}%`}
                  badge={<Badge text="Early" bg={C.warmMuted} color={C.warm} />}
                  formula={`${eligibility.tier === 3 ? '6%' : '3%'} per year under age 65 \u2014 reduction factor ${eligibility.reduction_factor.toFixed(2)}`} />
              )}
            </ProfileCard>
          )}

          {/* Benefit */}
          {benefit && (
            <ProfileCard title="Benefit Calculation">
              <CalculatedField label="AMS" value={fmt(benefit.ams)}
                formula={`Average Monthly Salary over highest ${benefit.ams_window_months} consecutive months`} />
              <CalculatedField label="Multiplier" value={`${(benefit.multiplier * 100).toFixed(1)}%`}
                formula={`Tier ${benefit.tier}: ${benefit.tier === 1 ? '2.0%' : '1.5%'} per year of service`} />
              <ProfileField label="Service" value={`${benefit.service_years_for_benefit} years`} />
              <CalculatedField label="Monthly Benefit" value={fmt(benefit.net_monthly_benefit)} highlight
                formula={benefit.formula_display} />
            </ProfileCard>
          )}

          {/* Employment History */}
          {employment && employment.length > 0 && (
            <ProfileCard title="Employment History">
              {employment.map((evt, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '4px 0',
                  borderBottom: i < employment.length - 1 ? `1px solid ${C.borderSubtle}` : 'none',
                }}>
                  <div style={{
                    width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                    background: i === employment.length - 1 ? C.accent : C.textDim,
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ color: C.text, fontSize: '11px', fontWeight: 500 }}>{evt.position}</span>
                    {evt.event_type !== 'hire' && (
                      <span style={{
                        marginLeft: '6px', fontSize: '9px', padding: '0 4px',
                        borderRadius: '3px', background: C.accentMuted, color: C.accent,
                      }}>{evt.event_type}</span>
                    )}
                  </div>
                  <span style={{
                    color: C.textMuted, fontSize: '10px', fontFamily: "'SF Mono',monospace",
                  }}>{evt.effective_date}</span>
                </div>
              ))}
            </ProfileCard>
          )}

          {/* Compensation */}
          {empFallback && (
            <ProfileCard title="Compensation">
              <ProfileField label="Monthly Salary" value={fmt(empFallback.monthly_salary)} highlight />
              <CalculatedField label="Annual Salary" value={fmt(empFallback.monthly_salary * 12)}
                formula={`${fmt(empFallback.monthly_salary)} \u00D7 12 months`} />
              <CalculatedField label="EE Contribution (8.45%)"
                value={fmt(empFallback.monthly_salary * 0.0845)}
                formula={`${fmt(empFallback.monthly_salary)} \u00D7 8.45% = ${fmt(empFallback.monthly_salary * 0.0845)} (RMC \u00A718-407)`} />
              <CalculatedField label="ER Contribution (17.95%)"
                value={fmt(empFallback.monthly_salary * 0.1795)}
                formula={`${fmt(empFallback.monthly_salary)} \u00D7 17.95% = ${fmt(empFallback.monthly_salary * 0.1795)} (RMC \u00A718-407)`} />
            </ProfileCard>
          )}

          {/* Employer Associations — a member may work for multiple employers */}
          {(() => {
            const associations = DEMO_EMPLOYER_EMPLOYEES.filter(e => e.member_id === memberId)
            if (associations.length === 0) return null
            return (
              <ProfileCard title="Employer Associations">
                {associations.map((assoc, i) => {
                  const dept = DEMO_DEPARTMENTS.find(d => d.dept_id === assoc.department)
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 0', borderBottom: i < associations.length - 1 ? `1px solid ${C.borderSubtle}` : 'none',
                    }}>
                      <div>
                        <button onClick={() => navigate(`/staff/employers/${assoc.department}`)} style={{
                          background: 'none', border: 'none', color: C.accent, cursor: 'pointer',
                          fontSize: '12px', fontWeight: 600, padding: 0,
                        }}>{dept?.name || assoc.department}</button>
                        <div style={{ color: C.textMuted, fontSize: '10px', marginTop: '1px' }}>
                          {assoc.status} &middot; Hired {assoc.hire_date}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' as const }}>
                        <div style={{ fontSize: '11px', color: C.text, fontFamily: "'SF Mono',monospace" }}>
                          {fmt(assoc.monthly_salary)}/mo
                        </div>
                        <div style={{ fontSize: '9px', color: C.textDim }}>
                          {assoc.years_of_service.toFixed(1)}y service
                        </div>
                      </div>
                    </div>
                  )
                })}
                {associations.length > 1 && (
                  <div style={{
                    marginTop: '6px', padding: '6px 8px', borderRadius: '4px',
                    background: C.warmMuted, fontSize: '10px', color: C.warm,
                  }}>
                    Multiple concurrent employers — contributions from all employers count toward benefit.
                  </div>
                )}
              </ProfileCard>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ─── Profile Card + Field Helpers ────────────────────────────────────────────

function ProfileCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: C.surface, borderRadius: '8px',
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', background: C.elevated, fontSize: '9px', fontWeight: 600,
        color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        borderBottom: `1px solid ${C.border}`,
      }}>{title}</div>
      <div style={{ padding: '6px 12px' }}>{children}</div>
    </div>
  )
}

function ProfileField({ label, value, badge, highlight }: {
  label: string; value: string; badge?: React.ReactNode; highlight?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 0', borderBottom: `1px solid ${C.borderSubtle}`,
      gap: '8px',
    }}>
      <span style={{ color: C.textSecondary, fontSize: '11px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {badge}
        <span style={{
          color: highlight ? C.accent : C.text, fontWeight: 600,
          fontFamily: "'SF Mono',monospace", fontSize: '12px',
        }}>{value}</span>
      </div>
    </div>
  )
}

/** Editable field — click the value to toggle inline editing */
function EditableField({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 0', borderBottom: `1px solid ${C.borderSubtle}`,
      gap: '8px',
    }}>
      <span style={{ color: C.textSecondary, fontSize: '11px' }}>{label}</span>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={() => setEditing(false)}
          onKeyDown={e => { if (e.key === 'Enter') setEditing(false) }}
          style={{
            border: `1px solid ${C.accent}`, borderRadius: '4px',
            padding: '2px 6px', fontSize: '12px', fontWeight: 600,
            fontFamily: "'SF Mono',monospace", color: C.text,
            background: C.surface, outline: 'none', textAlign: 'right' as const,
            width: '140px',
          }}
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          title="Click to edit"
          style={{
            color: C.text, fontWeight: 600,
            fontFamily: "'SF Mono',monospace", fontSize: '12px',
            cursor: 'text', borderBottom: `1px dashed ${C.textDim}`,
            paddingBottom: '1px',
          }}
        >{value}</span>
      )}
    </div>
  )
}

/** Calculated field — click to reveal the formula/breakdown */
function CalculatedField({ label, value, badge, highlight, formula }: {
  label: string; value: string; badge?: React.ReactNode; highlight?: boolean; formula: string
}) {
  const [showFormula, setShowFormula] = useState(false)

  return (
    <div style={{ borderBottom: `1px solid ${C.borderSubtle}` }}>
      <div
        onClick={() => setShowFormula(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 0', gap: '8px', cursor: 'pointer',
        }}
        title="Click to show calculation"
      >
        <span style={{ color: C.textSecondary, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          {label}
          <span style={{ fontSize: '9px', color: C.textDim }}>{showFormula ? '\u25B4' : '\u25BE'}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {badge}
          <span style={{
            color: highlight ? C.accent : C.text, fontWeight: 600,
            fontFamily: "'SF Mono',monospace", fontSize: '12px',
          }}>{value}</span>
        </div>
      </div>
      {showFormula && (
        <div style={{
          padding: '4px 8px 6px', marginBottom: '2px',
          background: C.elevated, borderRadius: '4px',
          fontSize: '10px', color: C.textSecondary, lineHeight: '1.5',
          fontFamily: "'SF Mono',monospace", whiteSpace: 'pre-wrap' as const,
        }}>
          {formula}
        </div>
      )}
    </div>
  )
}
