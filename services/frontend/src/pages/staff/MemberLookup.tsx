/**
 * Member Lookup — 360-degree member profile view with search.
 * Card-based layout showing personal info, employment, service credit, eligibility, and benefit data.
 * Consumed by: router.tsx (staff/members and staff/members/:memberId routes)
 * Depends on: theme (C, tierMeta, fmt), Badge, Field, useMember hooks, employer-demo-data (all-member list)
 */
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { C, tierMeta } from '@/theme'
import { Badge } from '@/components/shared/Badge'
import { fmt } from '@/lib/constants'
import { DEMO_EMPLOYER_EMPLOYEES } from '@/api/employer-demo-data'
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
  const [deptFilter, setDeptFilter] = useState<string>('all')

  const departments = [...new Set(DEMO_EMPLOYER_EMPLOYEES.map(e => e.department))]
  const filtered = DEMO_EMPLOYER_EMPLOYEES.filter(e => {
    const matchesSearch = !search || `${e.first_name} ${e.last_name} ${e.member_id}`
      .toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === 'all' || e.department === deptFilter
    return matchesSearch && matchesDept
  })

  const DEPT_NAMES: Record<string, string> = {
    PW: 'Public Works', PR: 'Parks & Recreation', FIN: 'Finance',
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '24px 16px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ color: C.text, fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Member Lookup
          </div>
          <div style={{ color: C.textSecondary, fontSize: '11px' }}>
            Search by name or member ID for a 360-degree profile view.
          </div>
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: '6px', fontSize: '12px',
              border: `1px solid ${C.border}`, background: C.surface, color: C.text,
              outline: 'none', fontFamily: 'system-ui, sans-serif',
            }}
          />
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            style={{
              padding: '8px 10px', borderRadius: '6px', fontSize: '11px',
              border: `1px solid ${C.border}`, background: C.surface, color: C.text,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d} value={d}>{DEPT_NAMES[d] || d}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '6px' }}>
          {filtered.map(emp => (
            <MemberRow key={emp.member_id} emp={emp} onClick={() => navigate(`/staff/members/${emp.member_id}`)} />
          ))}
          {filtered.length === 0 && (
            <div style={{ color: C.textMuted, fontSize: '12px', padding: '20px', textAlign: 'center' as const }}>
              No members match your search.
            </div>
          )}
        </div>
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
      border: `1px solid ${C.borderSubtle}`, borderRadius: '8px',
      cursor: 'pointer', textAlign: 'left' as const,
      transition: 'border-color 0.15s', width: '100%',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = t.color)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = C.borderSubtle)}
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
          border: `1px solid ${C.borderSubtle}`, marginBottom: '12px',
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
          {/* Personal Info */}
          <ProfileCard title="Personal Information">
            <ProfileField label="Date of Birth" value={member?.date_of_birth || 'N/A'} />
            <ProfileField label="Hire Date" value={member?.hire_date ?? empFallback?.hire_date ?? 'N/A'} />
            <ProfileField label="Status" value={member?.status ?? empFallback?.status ?? 'N/A'} />
            <ProfileField label="Tier" value={tc.label}
              badge={<Badge text={tc.sub} bg={tc.muted} color={tc.color} />} />
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
                <ProfileField label="Total (Benefit)" value={`${sc.total_for_benefit} years`} highlight />
                <ProfileField label="Vesting"
                  value={sc.earned_service_years >= 5 ? 'Vested' : `${sc.earned_service_years}y / 5y`}
                  badge={sc.earned_service_years >= 5
                    ? <Badge text="Met" bg={C.successMuted} color={C.success} />
                    : <Badge text="Not Met" bg={C.dangerMuted} color={C.danger} />} />
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
              <ProfileField label="Type" value={eligibility.retirement_type} />
              <ProfileField label="Eligible"
                value={eligibility.eligible ? 'Yes' : 'No'}
                badge={eligibility.eligible
                  ? <Badge text="Eligible" bg={C.successMuted} color={C.success} />
                  : <Badge text="Ineligible" bg={C.dangerMuted} color={C.danger} />} />
              {eligibility.reduction_factor != null && eligibility.reduction_factor < 1 && (
                <ProfileField label="Reduction"
                  value={`${((1 - eligibility.reduction_factor) * 100).toFixed(0)}%`}
                  badge={<Badge text="Early" bg={C.warmMuted} color={C.warm} />} />
              )}
            </ProfileCard>
          )}

          {/* Benefit */}
          {benefit && (
            <ProfileCard title="Benefit Calculation">
              <ProfileField label="AMS" value={fmt(benefit.ams)} />
              <ProfileField label="Multiplier" value={`${(benefit.multiplier * 100).toFixed(1)}%`} />
              <ProfileField label="Service" value={`${benefit.service_years_for_benefit} years`} />
              <ProfileField label="Monthly Benefit" value={fmt(benefit.net_monthly_benefit)} highlight />
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
              <ProfileField label="Annual Salary" value={fmt(empFallback.monthly_salary * 12)} />
              <ProfileField label="EE Contribution (8.45%)"
                value={fmt(empFallback.monthly_salary * 0.0845)} />
              <ProfileField label="ER Contribution (17.95%)"
                value={fmt(empFallback.monthly_salary * 0.1795)} />
            </ProfileCard>
          )}
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
      border: `1px solid ${C.borderSubtle}`, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', background: C.elevated, fontSize: '9px', fontWeight: 600,
        color: C.textMuted, textTransform: 'uppercase' as const, letterSpacing: '1px',
        borderBottom: `1px solid ${C.borderSubtle}`,
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
