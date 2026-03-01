/**
 * Printable retirement calculation worksheet — full-page print-optimized layout.
 * Shows complete calculation chain: eligibility, salary/AMS, benefit, payment options, supplemental.
 * Consumed by: StaffWorksheetView.tsx (via /staff/case/:memberId/worksheet route)
 * Depends on: Member types, theme (fmt, divisionMeta, hasTableMeta)
 */
import { fmt } from '@/lib/constants'
import { divisionMeta, hasTableMeta } from '@/theme'
import type { Member, BenefitResult, EligibilityResult, PaymentOptionsResult, DROResult, ServiceCreditSummary } from '@/types/Member'

// Salary period data for demo display (same as BenefitWorkspace)
// COPERA demo cases — salary data populated from demo-data fixtures
const SALARY_ROWS: Record<string, { period: string; months: number; monthly: number }[]> = {
  'COPERA-001': [
    { period: '2023 (Jan-Dec)', months: 12, monthly: 7500.00 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 7725.00 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 7956.75 },
  ],
  'COPERA-002': [
    { period: '2023 (Jul-Dec)', months: 6, monthly: 5500.00 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 5665.00 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 5835.00 },
    { period: '2026 (Jan-Jun)', months: 6, monthly: 6010.00 },
  ],
  'COPERA-003': [
    { period: '2023 (Jan-Dec)', months: 12, monthly: 9200.00 },
    { period: '2024 (Jan-Dec)', months: 12, monthly: 9476.00 },
    { period: '2025 (Jan-Dec)', months: 12, monthly: 9760.28 },
  ],
}

const LEAVE_PAYOUTS: Record<string, number> = {
  'COPERA-001': 0, 'COPERA-002': 0, 'COPERA-003': 0,
}

interface RetirementWorksheetProps {
  member: Member
  eligibility: EligibilityResult
  benefit: BenefitResult
  paymentOptions: PaymentOptionsResult | undefined
  droCalc: DROResult | undefined
  serviceCredit: ServiceCreditSummary | undefined
  retirementDate: string
  electedOption: string
  caseId?: number | null
}

// Print-friendly styles — light background, black text, clear structure
const S = {
  page: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#1a1a1a',
    background: '#ffffff',
    padding: '24px 32px',
    maxWidth: 800,
    margin: '0 auto',
    fontSize: 12,
    lineHeight: 1.5,
  } as React.CSSProperties,
  header: {
    textAlign: 'center' as const,
    borderBottom: '2px solid #333',
    paddingBottom: 12,
    marginBottom: 16,
  } as React.CSSProperties,
  title: {
    fontSize: 16, fontWeight: 700, letterSpacing: 1,
    textTransform: 'uppercase' as const, marginBottom: 4,
  } as React.CSSProperties,
  subtitle: { fontSize: 12, color: '#555' } as React.CSSProperties,
  section: { marginBottom: 14, pageBreakInside: 'avoid' as const } as React.CSSProperties,
  sectionTitle: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: 1, borderBottom: '1px solid #aaa',
    paddingBottom: 3, marginBottom: 6, color: '#333',
  } as React.CSSProperties,
  row: {
    display: 'flex', justifyContent: 'space-between',
    padding: '2px 0', borderBottom: '1px dotted #ddd',
  } as React.CSSProperties,
  label: { color: '#555' } as React.CSSProperties,
  value: { fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 } as React.CSSProperties,
  highlight: {
    fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#0066cc',
  } as React.CSSProperties,
  table: {
    width: '100%', borderCollapse: 'collapse' as const, fontSize: 11, marginBottom: 6,
  } as React.CSSProperties,
  th: {
    textAlign: 'left' as const, borderBottom: '1px solid #aaa',
    padding: '3px 6px', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase' as const, color: '#555',
  } as React.CSSProperties,
  td: {
    padding: '3px 6px', borderBottom: '1px solid #eee',
    fontFamily: "'JetBrains Mono', monospace",
  } as React.CSSProperties,
  formula: {
    textAlign: 'center' as const, padding: '10px 16px',
    border: '1px solid #ccc', borderRadius: 4,
    background: '#f8f8f8', marginBottom: 8,
  } as React.CSSProperties,
  footer: {
    marginTop: 20, paddingTop: 10, borderTop: '1px solid #aaa',
    fontSize: 10, color: '#777', lineHeight: 1.4,
  } as React.CSSProperties,
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={S.row}>
      <span style={S.label}>{label}</span>
      <span style={highlight ? S.highlight : S.value}>{value}</span>
    </div>
  )
}

export function RetirementWorksheet({
  member: m, eligibility: elig, benefit: ben, paymentOptions: opts,
  droCalc: dro, serviceCredit: sc, retirementDate, electedOption, caseId,
}: RetirementWorksheetProps) {
  const tc = divisionMeta[m.division] || divisionMeta['State']
  const ht = hasTableMeta[m.has_table] || hasTableMeta[1]
  const ruleType = elig.rule_of_n_label ?? `Rule of ${ht.ruleOfN}`
  const ruleTarget = elig.rule_of_n_threshold ?? ht.ruleOfN
  const ruleSum = elig.rule_of_n_value ?? 0
  const ruleMet = elig.retirement_type === 'rule_of_n'
  const reductionPct = Math.round((1 - elig.reduction_factor) * 100)
  const yrsUnder65 = Math.max(0, 65 - elig.age_at_retirement)
  const reductionRate = reductionPct > 0 && yrsUnder65 > 0 ? Math.round(reductionPct / yrsUnder65) : 0
  const salaryRows = SALARY_ROWS[m.member_id] || []
  const leavePayout = LEAVE_PAYOUTS[m.member_id] || 0
  const elOpt = opts?.options.find(o => o.option_type === electedOption)
  const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div data-print="worksheet" style={S.page}>
      {/* Header */}
      <div data-print="worksheet-header" style={S.header}>
        <div style={S.title}>Colorado Public Employees' Retirement Association</div>
        <div style={S.title}>Retirement Calculation Worksheet</div>
        <div style={S.subtitle}>
          Member: {m.first_name} {m.last_name} ({m.member_id})
          {' \u00B7 '} Retirement Date: {retirementDate}
          {' \u00B7 '} {tc.label} {' \u00B7 '} {ht.name}
          {caseId ? ` \u00B7 Case #${caseId}` : ''}
        </div>
      </div>

      {/* Eligibility */}
      <div data-print="worksheet-section" style={S.section}>
        <div style={S.sectionTitle}>Eligibility</div>
        <Row label="Retirement Type" value={elig.retirement_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
        <Row label="Age at Retirement" value={`${elig.age_at_retirement}`} />
        <Row label="Service (earned)" value={`${sc?.earned_service_years ?? ben.service_years_for_benefit}y`} />
        {sc && sc.purchased_service_years > 0 && (
          <Row label="Service (purchased — excluded from eligibility)" value={`${sc.purchased_service_years}y`} />
        )}
        <Row label={`${ruleType}: ${elig.age_at_retirement} + ${sc?.total_for_eligibility ?? ben.service_years_for_benefit}`}
          value={`${ruleSum.toFixed(2)} ${ruleMet ? '\u2265' : '<'} ${ruleTarget} [${ruleMet ? 'PASS' : 'FAIL'}]`}
          highlight={ruleMet} />
        {reductionPct > 0 && (
          <Row label="Early Reduction" value={`${yrsUnder65} years x ${reductionRate}%/yr = ${reductionPct}%`} />
        )}
      </div>

      {/* Salary / AMS */}
      <div data-print="worksheet-section" style={S.section}>
        <div style={S.sectionTitle}>Salary / AMS ({ben.ams_window_months}-month window)</div>
        {salaryRows.length > 0 && (
          <table data-print="worksheet-table" style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Period</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Months</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Monthly</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {salaryRows.map(r => (
                <tr key={r.period}>
                  <td style={S.td}>{r.period}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{r.months}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{fmt(r.monthly)}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{fmt(r.monthly * r.months)}</td>
                </tr>
              ))}
              {leavePayout > 0 && (
                <tr>
                  <td style={S.td}>Leave Payout (final month)</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>—</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>—</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{fmt(leavePayout)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <Row label={`\u00F7 ${ben.ams_window_months} months`} value={fmt(ben.ams)} highlight />
      </div>

      {/* Benefit Calculation */}
      <div data-print="worksheet-section" style={S.section}>
        <div style={S.sectionTitle}>Benefit Calculation</div>
        <div data-print="formula" style={S.formula}>
          <div style={{ fontSize: 10, color: '#777', marginBottom: 2 }}>
            {(ben.multiplier * 100).toFixed(1)}% x AMS x Service{reductionPct > 0 ? ` x ${elig.reduction_factor.toFixed(2)}` : ''}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            {fmt(ben.net_monthly_benefit)}/mo
          </div>
          <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', marginTop: 2 }}>
            {ben.formula_display}
          </div>
        </div>
        <Row label="Multiplier" value={`${(ben.multiplier * 100).toFixed(1)}% (${ht.name})`} />
        <Row label="AMS" value={fmt(ben.ams)} />
        <Row label="Service (for benefit)" value={`${ben.service_years_for_benefit}y`} />
        <Row label="Gross Monthly" value={fmt(ben.gross_monthly_benefit)} />
        {reductionPct > 0 && (
          <Row label={`Reduction (x${elig.reduction_factor.toFixed(2)})`} value={`-${fmt(ben.gross_monthly_benefit - ben.net_monthly_benefit)}`} />
        )}
        <Row label="Net Monthly" value={fmt(ben.net_monthly_benefit)} highlight />
        <Row label="Annual" value={fmt(ben.net_monthly_benefit * 12)} />
      </div>

      {/* Payment Options */}
      {opts && (
        <div data-print="worksheet-section" style={S.section}>
          <div style={S.sectionTitle}>Payment Options</div>
          <table data-print="worksheet-table" style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Option</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Factor</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Monthly</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Survivor</th>
                <th style={{ ...S.th, textAlign: 'center' }}>Elected</th>
              </tr>
            </thead>
            <tbody>
              {opts.options.map(o => (
                <tr key={o.option_type} style={{
                  background: o.option_type === electedOption ? '#e8f4fd' : undefined,
                }}>
                  <td style={S.td}>{o.option_name}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{o.reduction_factor.toFixed(4)}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>{fmt(o.monthly_amount)}</td>
                  <td style={{ ...S.td, textAlign: 'right' }}>
                    {o.survivor_pct ? `${fmt(o.monthly_amount * o.survivor_pct / 100)} (${o.survivor_pct}%)` : 'None'}
                  </td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    {o.option_type === electedOption ? '\u2713' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {elOpt && (
            <Row label="Elected" value={`${elOpt.option_name}: ${fmt(elOpt.monthly_amount)}/mo`} highlight />
          )}
        </div>
      )}

      {/* DRO Impact (conditional) */}
      {dro && (
        <div data-print="worksheet-section" style={S.section}>
          <div style={S.sectionTitle}>DRO Impact</div>
          <Row label="Alternate Payee" value={dro.alternate_payee_name} />
          <Row label="Marital Service" value={`${dro.marital_service_years}y / ${dro.total_service_years}y`} />
          <Row label="Marital Fraction" value={`${(dro.marital_fraction * 100).toFixed(2)}%`} />
          <Row label="Payee Amount" value={fmt(dro.alternate_payee_amount)} />
          <Row label="Member After DRO" value={fmt(dro.member_net_after_dro)} highlight />
        </div>
      )}

      {/* Supplemental */}
      <div data-print="worksheet-section" style={S.section}>
        <div style={S.sectionTitle}>Supplemental</div>
        {ben.annual_increase && (
          <Row label="Annual Increase" value={`${(ben.annual_increase.rate * 100).toFixed(1)}% compound, starting ${ben.annual_increase.first_eligible_date}`} />
        )}
        {ben.death_benefit && (
          <Row label="Death Benefit" value={fmt(ben.death_benefit.amount)} />
        )}
      </div>

      {/* Certification Footer */}
      <div data-print="audit" style={S.footer}>
        Calculated by deterministic rules engine executing certified plan provisions.
        All formulas, inputs, and intermediate steps available in calculation audit trail.
        <br />
        Generated: {timestamp}
        {caseId ? ` \u00B7 Case #${caseId}` : ''}
        {` \u00B7 Member: ${m.member_id}`}
      </div>
    </div>
  )
}
