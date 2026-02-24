/**
 * Member profile rail — narrow left panel showing member summary at a glance.
 * Displayed on wide (1200px+) and ultra (1600px+) layout tiers.
 * Consumed by: GuidedWorkspace (wide/ultra tier layouts)
 * Depends on: Member, ServiceCreditSummary, EligibilityResult, BenefitResult types, theme (C, tierMeta, fmt)
 */
import { C, tierMeta, fmt } from '@/theme'
import type { Member } from '@/types/Member'
import type { ServiceCreditSummary, EligibilityResult, BenefitResult } from '@/types/Member'

interface MemberProfileRailProps {
  member: Member
  serviceCredit?: ServiceCreditSummary
  eligibility?: EligibilityResult
  benefit?: BenefitResult
  retirementDate: string
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '8px', fontWeight: 700, color: C.textDim,
        textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: '4px',
      }}>{label}</div>
      {children}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '2px 0' }}>
      <span style={{ fontSize: '10px', color: C.textMuted }}>{label}</span>
      <span style={{
        fontSize: '10.5px', fontWeight: 600, color: color || C.text,
        fontFamily: "'SF Mono',monospace",
      }}>{value}</span>
    </div>
  )
}

export function MemberProfileRail({ member, serviceCredit, eligibility, benefit, retirementDate }: MemberProfileRailProps) {
  const tc = tierMeta[member.tier] || tierMeta[1]
  const age = eligibility?.age_at_retirement ?? 0

  const retType = eligibility?.retirement_type ?? ''
  const isEarlyRetirement = retType === 'early'
  const isRuleOfN = retType === 'rule_of_75' || retType === 'rule_of_85'
  const eligLabel = isRuleOfN
    ? (member.tier === 3 ? 'Rule of 85' : 'Rule of 75')
    : isEarlyRetirement ? 'Early' : retType === 'normal' ? 'Normal' : '\u2014'
  const eligColor = isRuleOfN || retType === 'normal' ? C.success : isEarlyRetirement ? C.warm : C.textMuted

  return (
    <div style={{
      width: 'clamp(180px, 16%, 260px)', flexShrink: 0,
      borderRight: `1px solid ${C.borderSubtle}`,
      background: C.elevated, overflow: 'auto',
      padding: '12px', display: 'flex', flexDirection: 'column' as const,
    }}>
      {/* Avatar + Name */}
      <div style={{ textAlign: 'center' as const, marginBottom: '14px' }}>
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          background: tc.muted, border: `2px solid ${tc.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: tc.color, fontSize: '12px',
          margin: '0 auto 6px',
        }}>T{member.tier}</div>
        <div style={{ color: C.text, fontWeight: 700, fontSize: '12.5px' }}>
          {member.first_name} {member.last_name}
        </div>
        <div style={{ color: C.textMuted, fontSize: '9.5px' }}>
          {member.member_id}
        </div>
        <div style={{
          display: 'inline-block', marginTop: '4px',
          padding: '1px 8px', borderRadius: '4px',
          background: tc.muted, border: `1px solid ${tc.color}`,
          fontSize: '9px', fontWeight: 700, color: tc.color,
        }}>{tc.label} {'\u00B7'} {tc.sub}</div>
      </div>

      {/* Employment */}
      <Section label="Employment">
        <Stat label="Department" value={member.department} />
        <Stat label="Position" value={member.position || '\u2014'} />
        <Stat label="Hire Date" value={member.hire_date?.slice(0, 10) ?? '\u2014'} />
      </Section>

      {/* Retirement */}
      <Section label="Retirement">
        <Stat label="Ret. Date" value={retirementDate?.slice(0, 10) || '\u2014'} />
        <Stat label="Age at Ret." value={age ? String(age) : '\u2014'} />
        <Stat label="Type" value={eligLabel} color={eligColor} />
      </Section>

      {/* Service */}
      {serviceCredit && (
        <Section label="Service Credit">
          <Stat label="Total" value={`${serviceCredit.total_service_years.toFixed(2)}y`} />
          <Stat label="Earned" value={`${serviceCredit.earned_service_years.toFixed(2)}y`} />
          {serviceCredit.purchased_service_years > 0 && (
            <Stat label="Purchased" value={`${serviceCredit.purchased_service_years.toFixed(2)}y`} />
          )}
          {serviceCredit.military_service_years > 0 && (
            <Stat label="Military" value={`${serviceCredit.military_service_years.toFixed(2)}y`} />
          )}
        </Section>
      )}

      {/* Eligibility */}
      {eligibility && (
        <Section label="Eligibility">
          <Stat
            label={member.tier === 3 ? 'Rule of 85' : 'Rule of 75'}
            value={eligibility.rule_of_n_value != null
              ? `${eligibility.rule_of_n_value.toFixed(2)} / ${eligibility.rule_of_n_threshold ?? (member.tier === 3 ? 85 : 75)}`
              : '\u2014'}
            color={isRuleOfN ? C.success : C.warm}
          />
          {isEarlyRetirement && (
            <Stat
              label="Reduction"
              value={`${Math.round((1 - eligibility.reduction_factor) * 100)}%`}
              color={C.warm}
            />
          )}
        </Section>
      )}

      {/* Benefit */}
      {benefit && (
        <Section label="Benefit">
          <Stat label="AMS" value={fmt(benefit.ams)} />
          <Stat label="Gross" value={fmt(benefit.gross_monthly_benefit)} />
          <Stat label="Net" value={fmt(benefit.net_monthly_benefit)} color={C.accent} />
          {benefit.ipr && (
            <Stat label="IPR" value={`${fmt(benefit.ipr.monthly_amount)}/mo`} />
          )}
        </Section>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{
        fontSize: '8px', color: C.textDim, textAlign: 'center' as const,
        paddingTop: '8px', borderTop: `1px solid ${C.borderSubtle}`,
      }}>
        Member Profile Rail
      </div>
    </div>
  )
}
