/**
 * Response mappers — transforms Go backend JSON shapes into TypeScript domain types.
 * Consumed by: client.ts liveApi methods
 * Depends on: Member.ts types (target shape), Go service JSON contracts (source shape)
 *
 * Each mapper is a pure function: (raw Go response) => TypeScript type.
 * No network calls, no side effects — just field renaming, restructuring, and type coercion.
 */
import type {
  Member, ServiceCreditSummary, DRORecord, EligibilityResult,
  BenefitResult, IPRResult, DeathBenefitResult, PaymentOption,
  PaymentOptionsResult, ScenarioResult, DROResult, AuditEntry,
  ApplicationIntake, Beneficiary,
} from '@/types/Member'

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Format a Go time.Time (RFC 3339) or date string to YYYY-MM-DD. Returns '' if null/undefined. */
function toDateStr(v: string | null | undefined): string {
  if (!v) return ''
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  // RFC 3339 — take date part
  return v.slice(0, 10)
}

function toOptDateStr(v: string | null | undefined): string | undefined {
  const d = toDateStr(v)
  return d || undefined
}

// ─── mapMember ────────────────────────────────────────────────────────────────

/** Go connector.models.Member → TS Member. Renames status_code→status, formats dates. */
export function mapMember(raw: Record<string, unknown>): Member {
  return {
    member_id: String(raw.member_id ?? ''),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    date_of_birth: toDateStr(raw.date_of_birth as string),
    hire_date: toDateStr(raw.hire_date as string),
    tier: Number(raw.tier ?? 0),
    status: String(raw.status_code ?? raw.status ?? ''),
    department: String(raw.department ?? ''),
    position: String(raw.position ?? ''),
    termination_date: toOptDateStr(raw.termination_date as string),
  }
}

// ─── mapBeneficiaries ─────────────────────────────────────────────────────────

/** Go connector returns {member_id, beneficiaries: [...]}. Extract and map. */
export function mapBeneficiaries(raw: Record<string, unknown>): Beneficiary[] {
  const list = (raw.beneficiaries ?? raw) as Record<string, unknown>[]
  if (!Array.isArray(list)) return []
  return list.map((b) => ({
    name: [b.first_name, b.last_name].filter(Boolean).join(' ') || String(b.name ?? ''),
    relationship: String(b.relationship ?? ''),
    allocation_pct: Number(b.allocation_percentage ?? b.allocation_pct ?? 0),
    date_of_birth: toOptDateStr(b.date_of_birth as string),
  }))
}

// ─── mapServiceCredit ─────────────────────────────────────────────────────────

/**
 * Go returns {member_id, records, summary} where summary has earned_years etc.
 * TS expects a flat ServiceCreditSummary with earned_service_years, total_service_years.
 */
export function mapServiceCredit(raw: Record<string, unknown>): ServiceCreditSummary {
  // The Go response wraps the summary in a .summary field
  const s = (raw.summary ?? raw) as Record<string, unknown>
  const earned = Number(s.earned_years ?? s.earned_service_years ?? 0)
  const purchased = Number(s.purchased_years ?? s.purchased_service_years ?? 0)
  const military = Number(s.military_years ?? s.military_service_years ?? 0)
  const leave = Number(s.leave_years ?? 0)
  const totalForBenefit = Number(s.total_for_benefit ?? 0)
  const totalForEligibility = Number(s.total_for_eligibility ?? 0)

  return {
    earned_service_years: earned,
    purchased_service_years: purchased,
    military_service_years: military,
    total_service_years: earned + purchased + military + leave,
    total_for_eligibility: totalForEligibility,
    total_for_benefit: totalForBenefit,
  }
}

// ─── mapDRORecords ────────────────────────────────────────────────────────────

/** Go returns {member_id, has_dro, dro_count, dros: [...]}. Extract .dros, coerce types. */
export function mapDRORecords(raw: Record<string, unknown>): DRORecord[] {
  const list = (raw.dros ?? raw) as Record<string, unknown>[]
  if (!Array.isArray(list)) return []
  return list.map((d) => ({
    dro_id: String(d.dro_id ?? ''),
    case_number: String(d.case_number ?? ''),
    alternate_payee_name: String(d.alternate_payee_name ?? ''),
    division_method: String(d.division_method ?? ''),
    division_pct: d.division_percentage != null ? Number(d.division_percentage) : (d.division_pct != null ? Number(d.division_pct) : undefined),
    division_amount: d.division_amount != null ? Number(d.division_amount) : undefined,
    marriage_date: toDateStr(d.marriage_date as string),
    divorce_date: toDateStr(d.divorce_date as string),
    status: String(d.status_code ?? d.status ?? ''),
  }))
}

// ─── mapEligibility ───────────────────────────────────────────────────────────

/**
 * Go EligibilityResult has bool flags (vested, normal_retirement_eligible, etc.) and rule_of_n_sum.
 * TS expects: eligible, rule_of_n_value, conditions_met[], conditions_unmet[], audit_trail[].
 */
export function mapEligibility(raw: Record<string, unknown>, retirementDate: string): EligibilityResult {
  const retType = String(raw.retirement_type ?? 'not_eligible')
  const eligible = retType !== 'not_eligible' && retType !== 'deferred'

  // Build conditions_met / conditions_unmet from bool flags
  const met: string[] = []
  const unmet: string[] = []

  if (raw.vested) met.push('Vested (5+ years)')
  else unmet.push('Vested (5+ years)')

  if (raw.normal_retirement_eligible) met.push('Normal retirement age (65)')
  else unmet.push('Normal retirement age (65)')

  const ruleApplicable = String(raw.rule_of_n_applicable ?? '')
  if (ruleApplicable) {
    const label = `Rule of ${ruleApplicable}`
    if (raw.rule_of_n_qualifies && raw.rule_of_n_min_age_met) met.push(label)
    else unmet.push(label)
  }

  if (raw.early_retirement_eligible) met.push('Early retirement eligible')
  else if (Number(raw.age_at_retirement ?? 0) >= 55) unmet.push('Early retirement eligible')

  // Build audit trail from the raw flags
  const audit: AuditEntry[] = []
  audit.push({
    rule_id: 'ELIG-VEST',
    rule_name: 'Vesting',
    description: `Vested: ${raw.vested ? 'Yes' : 'No'} (${Number(raw.total_service_years ?? 0).toFixed(2)} years)`,
    result: raw.vested ? 'PASS' : 'FAIL',
    source_reference: 'RMC §18-403',
  })
  if (ruleApplicable) {
    audit.push({
      rule_id: `ELIG-RULE-${ruleApplicable}`,
      rule_name: `Rule of ${ruleApplicable}`,
      description: `Sum: ${Number(raw.rule_of_n_sum ?? 0).toFixed(2)}, min age met: ${raw.rule_of_n_min_age_met ? 'Yes' : 'No'}`,
      result: raw.rule_of_n_qualifies && raw.rule_of_n_min_age_met ? 'PASS' : 'FAIL',
      source_reference: `RMC §18-404`,
    })
  }
  audit.push({
    rule_id: 'ELIG-REDUCTION',
    rule_name: 'Early Retirement Reduction',
    description: `Reduction: ${Number(raw.early_retirement_reduction_percent ?? 0)}%, factor: ${Number(raw.reduction_factor ?? 1)}`,
    result: 'INFO',
    source_reference: 'RMC §18-409(b)',
  })

  // Determine rule_of_n_value — Go returns rule_of_n_sum
  const ruleOfNValue = raw.rule_of_n_sum != null ? Number(raw.rule_of_n_sum) : undefined
  const ruleOfNThreshold = ruleApplicable ? Number(ruleApplicable) : undefined

  return {
    member_id: String(raw.member_id ?? ''),
    retirement_date: retirementDate,
    tier: Number(raw.tier ?? 0),
    age_at_retirement: Number(raw.age_at_retirement ?? 0),
    eligible,
    retirement_type: retType,
    rule_of_n_value: ruleOfNValue,
    rule_of_n_threshold: ruleOfNThreshold,
    reduction_factor: Number(raw.reduction_factor ?? 1),
    conditions_met: met,
    conditions_unmet: unmet,
    audit_trail: audit,
  }
}

// ─── mapBenefit ───────────────────────────────────────────────────────────────

/**
 * Go BenefitResult has ams_calculation (nested object), maximum_monthly_benefit, etc.
 * TS expects: ams (number), net_monthly_benefit, gross_annual/monthly, audit_trail[].
 */
export function mapBenefit(raw: Record<string, unknown>): BenefitResult {
  // AMS is nested under ams_calculation in Go
  const amsObj = (raw.ams_calculation ?? {}) as Record<string, unknown>
  const amsValue = Number(amsObj.ams ?? raw.ams ?? 0)
  const amsWindowMonths = Number(amsObj.window_months ?? raw.ams_window_months ?? 0)

  const multiplier = Number(raw.multiplier ?? 0)
  const serviceYears = Number(raw.service_years_for_benefit ?? 0)
  const reductionFactor = Number(raw.reduction_factor ?? 1)
  const retirementType = String(raw.retirement_type ?? '')

  // Go has unreduced_monthly_benefit, reduced_monthly_benefit, maximum_monthly_benefit
  const unreducedMonthly = Number(raw.unreduced_monthly_benefit ?? 0)
  const reducedMonthly = Number(raw.reduced_monthly_benefit ?? raw.maximum_monthly_benefit ?? 0)
  const maxMonthly = Number(raw.maximum_monthly_benefit ?? reducedMonthly)

  const grossMonthly = unreducedMonthly || (amsValue * multiplier * serviceYears / 12)
  const grossAnnual = grossMonthly * 12

  // Formula string
  const formula = String(raw.formula ?? `$${amsValue.toFixed(2)} × ${(multiplier * 100).toFixed(1)}% × ${serviceYears.toFixed(2)} years`)

  // Map IPR — Go has different field names
  let ipr: IPRResult | undefined
  if (raw.ipr) {
    const i = raw.ipr as Record<string, unknown>
    ipr = {
      annual_amount: Number(i.pre_medicare_monthly ?? 0) * 12,
      monthly_amount: Number(i.pre_medicare_monthly ?? 0),
      rate_per_year: Number(i.pre_medicare_rate ?? 0),
      eligible_service_years: Number(i.service_years_for_ipr ?? 0),
      medicare_eligible: false,
    }
  }

  // Map death benefit
  let deathBenefit: DeathBenefitResult | undefined
  if (raw.death_benefit) {
    const db = raw.death_benefit as Record<string, unknown>
    deathBenefit = {
      amount: Number(db.lump_sum_amount ?? db.amount ?? 0),
      tier: Number(db.tier ?? raw.tier ?? 0),
      retirement_type: String(db.retirement_type ?? retirementType),
    }
  }

  // Build audit trail
  const audit: AuditEntry[] = []
  audit.push({
    rule_id: 'BENEFIT-AMS',
    rule_name: 'Average Monthly Salary',
    description: `AMS: $${amsValue.toFixed(2)} (${amsWindowMonths}-month window)`,
    result: 'CALCULATED',
    source_reference: 'RMC §18-401',
  })
  audit.push({
    rule_id: 'BENEFIT-FORMULA',
    rule_name: 'Benefit Formula',
    description: formula,
    result: 'CALCULATED',
    source_reference: 'RMC §18-406',
  })
  if (reductionFactor < 1) {
    audit.push({
      rule_id: 'BENEFIT-REDUCTION',
      rule_name: 'Early Retirement Reduction',
      description: `Factor: ${reductionFactor.toFixed(4)} (${((1 - reductionFactor) * 100).toFixed(1)}% reduction)`,
      result: 'APPLIED',
      source_reference: 'RMC §18-409(b)',
    })
  }

  return {
    member_id: String(raw.member_id ?? ''),
    retirement_date: String(raw.retirement_date ?? ''),
    tier: Number(raw.tier ?? 0),
    ams: amsValue,
    ams_window_months: amsWindowMonths,
    service_years_for_benefit: serviceYears,
    multiplier,
    gross_annual_benefit: grossAnnual,
    gross_monthly_benefit: grossMonthly,
    reduction_factor: reductionFactor,
    retirement_type: retirementType,
    net_monthly_benefit: maxMonthly,
    formula_display: formula,
    ipr,
    death_benefit: deathBenefit,
    audit_trail: audit,
  }
}

// ─── mapPaymentOptions ────────────────────────────────────────────────────────

/**
 * Go returns {payment_options: {member_id, base_benefit, maximum, joint_survivor_100/75/50}, dro}.
 * TS expects {base_monthly_benefit, options: PaymentOption[]}.
 */
export function mapPaymentOptions(raw: Record<string, unknown>): PaymentOptionsResult {
  // The Go handler wraps in payment_options
  const po = (raw.payment_options ?? raw) as Record<string, unknown>
  const baseBenefit = Number(po.base_benefit ?? po.base_monthly_benefit ?? 0)

  const options: PaymentOption[] = []

  // Maximum option
  const max = po.maximum as Record<string, unknown> | undefined
  if (max) {
    options.push({
      option_name: 'Maximum',
      option_type: 'maximum',
      monthly_amount: Number(max.monthly_benefit ?? 0),
      reduction_factor: Number(max.factor ?? 1),
      description: 'Maximum monthly benefit with no survivor benefit',
    })
  }

  // J&S options
  for (const [key, label, pct] of [
    ['joint_survivor_100', 'Joint & 100% Survivor', 100],
    ['joint_survivor_75', 'Joint & 75% Survivor', 75],
    ['joint_survivor_50', 'Joint & 50% Survivor', 50],
  ] as const) {
    const opt = po[key] as Record<string, unknown> | null | undefined
    if (opt) {
      options.push({
        option_name: label,
        option_type: key,
        monthly_amount: Number(opt.monthly_benefit ?? 0),
        reduction_factor: Number(opt.factor ?? 1),
        survivor_pct: pct,
        description: `${pct}% of benefit continues to survivor`,
      })
    }
  }

  return {
    base_monthly_benefit: baseBenefit,
    options,
  }
}

// ─── mapScenarios ─────────────────────────────────────────────────────────────

/**
 * Go returns {member_id, scenarios: [{retirement_date, eligibility: {...}, benefit: {...}}]}.
 * TS expects flat ScenarioResult[].
 */
export function mapScenarios(raw: Record<string, unknown>): ScenarioResult[] {
  const list = (raw.scenarios ?? []) as Record<string, unknown>[]
  if (!Array.isArray(list)) return []
  return list.map((s) => {
    const elig = (s.eligibility ?? {}) as Record<string, unknown>
    const ben = s.benefit as Record<string, unknown> | null | undefined
    const retType = String(elig.retirement_type ?? 'not_eligible')
    const eligible = retType !== 'not_eligible' && retType !== 'deferred'
    return {
      retirement_date: String(s.retirement_date ?? ''),
      age_at_retirement: Number(elig.age_at_retirement ?? 0),
      eligible,
      retirement_type: retType,
      reduction_factor: Number(elig.reduction_factor ?? 1),
      net_monthly_benefit: ben ? Number((ben as Record<string, unknown>).maximum_monthly_benefit ?? 0) : 0,
      annual_benefit: ben ? Number((ben as Record<string, unknown>).maximum_monthly_benefit ?? 0) * 12 : 0,
    }
  })
}

// ─── mapDROResult ─────────────────────────────────────────────────────────────

/**
 * Go returns {dro_calculation: {...}, payment_options: {...}, benefit: {...}}.
 * TS expects flat DROResult.
 */
export function mapDROResult(raw: Record<string, unknown>): DROResult {
  // Go wraps in dro_calculation
  const d = (raw.dro_calculation ?? raw) as Record<string, unknown>
  return {
    dro_id: String(d.dro_id ?? ''),
    total_service_years: Number(d.total_service_years ?? 0),
    marital_service_years: Number(d.service_during_marriage_years ?? d.marital_service_years ?? 0),
    marital_fraction: Number(d.marital_fraction ?? 0),
    member_gross_benefit: Number(d.maximum_benefit ?? d.member_gross_benefit ?? 0),
    marital_share: Number(d.marital_share_of_benefit ?? d.marital_share ?? 0),
    alternate_payee_amount: Number(d.alternate_payee_share ?? d.alternate_payee_amount ?? 0),
    member_net_after_dro: Number(d.member_remaining_benefit ?? d.member_net_after_dro ?? 0),
    division_method: String(d.division_method ?? ''),
    alternate_payee_name: String(d.alternate_payee_name ?? ''),
    audit_trail: [{
      rule_id: 'DRO-CALC',
      rule_name: 'DRO Division',
      description: `Marital fraction: ${Number(d.marital_fraction ?? 0).toFixed(4)}, DRO%: ${Number(d.dro_percentage ?? 0).toFixed(1)}%`,
      result: 'CALCULATED',
      source_reference: 'Court Order',
    }],
  }
}

// ─── buildSyntheticIntake ─────────────────────────────────────────────────────

/**
 * No Go endpoint exists for application intake (it's process state, not legacy data).
 * Build sensible defaults for live mode so the UI doesn't crash.
 */
export function buildSyntheticIntake(_member: Member): ApplicationIntake {
  return {
    application_received_date: '',
    last_day_worked: '',
    retirement_effective_date: '',
    notarization_confirmed: false,
    notarization_date: null,
    deadline_met: false,
    days_before_last_day: 0,
    payment_cutoff_met: false,
    cutoff_date: '',
    first_payment_date: '',
    combined_payment: false,
    documents: [],
    package_complete: false,
    complete_package_date: null,
  }
}
