/**
 * Annual benefit statement — print-friendly member statement with service, benefit estimate,
 * eligibility status, contributions, and beneficiary information.
 * Consumed by: router.tsx (/portal/statement route)
 * Depends on: useTheme, usePortalAuth, useMember hooks, useCalculations hooks, Member types
 */
import { useTheme } from '@/theme'
import { usePortalAuth } from '@/portal/auth/AuthContext'
import { useMember, useServiceCredit } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation } from '@/hooks/useCalculations'
import { DEFAULT_RETIREMENT_DATES, fmt } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { PortalTheme } from '@/theme'

// Print-friendly styles
const printStyles = (T: PortalTheme) => ({
  page: {
    maxWidth: 700, margin: '0 auto', padding: '24px 20px',
    fontFamily: "'Inter', 'Segoe UI', sans-serif", color: T.text.primary,
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const, borderBottom: `2px solid ${T.border.base}`,
    paddingBottom: 14, marginBottom: 20,
  } as React.CSSProperties,
  title: {
    fontSize: 16, fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase' as const, marginBottom: 4,
  } as React.CSSProperties,
  subtitle: { fontSize: 12, color: T.text.secondary } as React.CSSProperties,
  section: {
    marginBottom: 16, background: T.surface.card,
    borderRadius: 10, border: `1px solid ${T.border.base}`,
    overflow: 'hidden', pageBreakInside: 'avoid' as const,
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: 12, fontWeight: 700, padding: '10px 16px',
    borderBottom: `1px solid ${T.border.subtle}`,
  } as React.CSSProperties,
  row: {
    display: 'flex', justifyContent: 'space-between',
    padding: '6px 16px', borderBottom: `1px solid ${T.border.subtle}`,
    fontSize: 13,
  } as React.CSSProperties,
  label: { color: T.text.secondary } as React.CSSProperties,
  value: {
    fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
  } as React.CSSProperties,
  disclaimer: {
    marginTop: 20, padding: '12px 16px', borderRadius: 8,
    background: T.status.warningBg, borderLeft: `3px solid ${T.status.warning}`,
    fontSize: 11, color: T.text.secondary, lineHeight: 1.5,
  } as React.CSSProperties,
})

function Row({ label, value, T }: { label: string; value: string; T: PortalTheme }) {
  const S = printStyles(T)
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={S.value}>{value}</span>
    </div>
  )
}

export function BenefitStatement() {
  const T = useTheme()
  const { memberId } = usePortalAuth()
  const retDate = DEFAULT_RETIREMENT_DATES[memberId] || '2026-04-01'

  const member = useMember(memberId)
  const service = useServiceCredit(memberId)
  const eligibility = useEligibility(memberId, retDate)
  const benefit = useBenefitCalculation(memberId, retDate)

  const m = member.data
  const svc = service.data
  const elig = eligibility.data
  const ben = benefit.data
  const S = printStyles(T)

  if (!m || !svc || !elig || !ben) {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: T.text.muted }}>Loading benefit statement...</div>
      </div>
    )
  }

  const tierLabel = m.has_table_name || `${m.division} ${m.has_table}`
  // Rule of N threshold comes from eligibility data
  const ruleTarget = elig.rule_of_n_threshold ?? 80
  const ruleType = elig.rule_of_n_label ?? `Rule of ${ruleTarget}`
  const ruleSum = elig.rule_of_n_value ?? 0
  const ruleMet = elig.retirement_type === 'rule_of_75' || elig.retirement_type === 'rule_of_85'
  const reductionPct = Math.round((1 - elig.reduction_factor) * 100)

  return (
    <div data-print="benefit-statement" style={S.page}>
      {/* Screen-only toolbar */}
      <div className="no-print" style={{
        display: 'flex', gap: 8, marginBottom: 16,
      }}>
        <button onClick={() => window.print()} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: T.accent.primary, color: T.accent.on, border: 'none', cursor: 'pointer',
        }}>Print Statement</button>
        <button onClick={() => window.history.back()} style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: 'transparent', border: `1px solid ${T.border.base}`,
          color: T.text.secondary, cursor: 'pointer',
        }}>Back to Dashboard</button>
      </div>

      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>Colorado Public Employees' Retirement Association</div>
        <div style={S.title}>Annual Benefit Statement</div>
        <div style={S.subtitle}>
          Statement Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Member Information */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Member Information</div>
        <Row label="Name" value={`${m.first_name} ${m.last_name}`} T={T} />
        <Row label="Member ID" value={m.member_id} T={T} />
        <Row label="Division / HAS Table" value={tierLabel} T={T} />
        <Row label="Department" value={m.department} T={T} />
        <Row label="Hire Date" value={formatDate(m.hire_date)} T={T} />
        <Row label="Status" value={m.status === 'A' ? 'Active' : m.status} T={T} />
      </div>

      {/* Service Credit Summary */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Service Credit Summary</div>
        <Row label="Earned Service" value={`${svc.earned_service_years} years`} T={T} />
        {svc.purchased_service_years > 0 && (
          <Row label="Purchased Service" value={`${svc.purchased_service_years} years`} T={T} />
        )}
        {svc.military_service_years > 0 && (
          <Row label="Military Service" value={`${svc.military_service_years} years`} T={T} />
        )}
        <Row label="Total for Benefit" value={`${svc.total_for_benefit} years`} T={T} />
        <Row label="Total for Eligibility" value={`${svc.total_for_eligibility} years`} T={T} />
      </div>

      {/* Benefit Estimate */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Benefit Estimate (as of {retDate})</div>
        <div style={{
          padding: '16px', textAlign: 'center' as const,
          background: T.accent.surface, borderBottom: `1px solid ${T.border.subtle}`,
        }}>
          <div style={{
            fontSize: 11, color: T.text.muted, letterSpacing: 1,
            textTransform: 'uppercase' as const, marginBottom: 4,
          }}>Estimated Monthly Benefit</div>
          <div style={{
            fontSize: 32, fontWeight: 800, color: T.accent.primary,
            fontFamily: "'JetBrains Mono', monospace",
          }}>{fmt(ben.net_monthly_benefit)}</div>
          <div style={{ fontSize: 11, color: T.text.secondary, marginTop: 4 }}>
            {ben.formula_display}
          </div>
        </div>
        <Row label="AMS" value={fmt(ben.ams)} T={T} />
        <Row label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}%`} T={T} />
        <Row label="Service (for benefit)" value={`${ben.service_years_for_benefit} years`} T={T} />
        <Row label="Gross Monthly" value={fmt(ben.gross_monthly_benefit)} T={T} />
        {reductionPct > 0 && (
          <Row label={`Reduction (${reductionPct}%)`} value={`-${fmt(ben.gross_monthly_benefit - ben.net_monthly_benefit)}`} T={T} />
        )}
        <Row label="Annual Benefit" value={fmt(ben.net_monthly_benefit * 12)} T={T} />
      </div>

      {/* Eligibility Status */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Eligibility Status</div>
        <Row label="Vested" value={svc.total_for_eligibility >= 5 ? 'Yes' : 'No'} T={T} />
        <Row label={ruleType} value={`${ruleSum.toFixed(2)} / ${ruleTarget} ${ruleMet ? '(Met)' : '(Not Met)'}`} T={T} />
        <Row label="Normal Retirement" value="Age 65 with 5 years service" T={T} />
        <Row label="Retirement Type" value={elig.retirement_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} T={T} />
        {reductionPct > 0 && (
          <Row label="Early Retirement Reduction" value={`${reductionPct}%`} T={T} />
        )}
      </div>

      {/* Supplemental Benefits */}
      {(ben.annual_increase || ben.death_benefit) && (
        <div style={S.section}>
          <div style={S.sectionTitle}>Supplemental Benefits</div>
          {ben.annual_increase && (
            <>
              <Row label="Annual Increase Rate" value={`${(ben.annual_increase.rate * 100).toFixed(1)}% (compound)`} T={T} />
              <Row label="First Eligible" value={ben.annual_increase.first_eligible_date} T={T} />
            </>
          )}
          {ben.death_benefit && (
            <Row label="Death Benefit" value={fmt(ben.death_benefit.amount)} T={T} />
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={S.disclaimer}>
        <strong>Important:</strong> This is an estimate based on current service and salary information.
        Your actual benefit will be determined at the time of retirement based on the plan provisions
        in effect, your actual salary history, and your service credit on file. Contact Colorado PERA at
        1-800-759-7372 for questions.
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 16, textAlign: 'center' as const,
        fontSize: 10, color: T.text.muted, lineHeight: 1.5,
      }}>
        Colorado PERA · 1301 Pennsylvania Street · Denver, CO 80203
        <br />
        Generated by deterministic rules engine executing certified plan provisions.
      </div>
    </div>
  )
}
