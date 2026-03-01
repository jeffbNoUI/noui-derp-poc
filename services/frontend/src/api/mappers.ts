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
  BenefitResult, AnnualIncreaseInfo, DeathBenefitResult, PaymentOption,
  PaymentOptionsResult, ScenarioResult, DROResult, AuditEntry,
  ApplicationIntake, Beneficiary,
} from '@/types/Member'

// ─── ID Mapping ──────────────────────────────────────────────────────────────

/** Convert backend member ID (M-100001) to frontend short ID (100001). Pass through if no prefix. */
export function fromBackendId(id: string): string {
  if (id.startsWith('M-')) return id.slice(2).replace(/^0+/, '') || '0'
  return id
}

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
    member_id: fromBackendId(String(raw.member_id ?? '')),
    first_name: String(raw.first_name ?? ''),
    last_name: String(raw.last_name ?? ''),
    date_of_birth: toDateStr(raw.date_of_birth as string),
    hire_date: toDateStr(raw.hire_date as string),
    division: String(raw.division ?? ''),
    has_table: Number(raw.has_table ?? 0),
    has_table_name: String(raw.has_table_name ?? ''),
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
  // Intelligence service returns camelCase; support both conventions
  const retType = String(raw.retirement_type ?? raw.retirementType ?? 'not_eligible')
  const eligible = retType !== 'not_eligible' && retType !== 'deferred'

  // Build conditions_met / conditions_unmet from bool flags
  const met: string[] = []
  const unmet: string[] = []

  if (raw.vested) met.push('Vested (5+ years)')
  else unmet.push('Vested (5+ years)')

  const normalElig = raw.normal_retirement_eligible ?? raw.normalRetirementEligible
  if (normalElig) met.push('Normal retirement age (65)')
  else unmet.push('Normal retirement age (65)')

  const ruleApplicable = String(raw.rule_of_n_applicable ?? raw.ruleOfNApplicable ?? '')
  const ruleQualifies = raw.rule_of_n_qualifies ?? raw.ruleOfNQualifies
  const ruleMinAge = raw.rule_of_n_min_age_met ?? raw.ruleOfNMinAgeMet
  if (ruleApplicable) {
    const label = `Rule of ${ruleApplicable}`
    if (ruleQualifies && ruleMinAge) met.push(label)
    else unmet.push(label)
  }

  const earlyElig = raw.early_retirement_eligible ?? raw.earlyRetirementEligible
  const ageAtRet = Number(raw.age_at_retirement ?? raw.ageAtRetirement ?? 0)
  if (earlyElig) met.push('Early retirement eligible')
  else if (ageAtRet >= 55) unmet.push('Early retirement eligible')

  const totalSvcYears = Number(raw.total_service_years ?? raw.totalServiceYears ?? 0)
  const ruleOfNSum = raw.rule_of_n_sum ?? raw.ruleOfNSum
  const reductionPct = Number(raw.early_retirement_reduction_percent ?? raw.earlyRetirementReductionPercent ?? 0)
  const reductionFactor = Number(raw.reduction_factor ?? raw.reductionFactor ?? 1)

  // Build audit trail from the raw flags
  const audit: AuditEntry[] = []
  audit.push({
    rule_id: 'ELIG-VEST',
    rule_name: 'Vesting',
    description: `Vested: ${raw.vested ? 'Yes' : 'No'} (${totalSvcYears.toFixed(2)} years)`,
    result: raw.vested ? 'PASS' : 'FAIL',
    source_reference: 'C.R.S. §24-51-401',
  })
  if (ruleApplicable) {
    audit.push({
      rule_id: `ELIG-RULE-${ruleApplicable}`,
      rule_name: `Rule of ${ruleApplicable}`,
      description: `Sum: ${Number(ruleOfNSum ?? 0).toFixed(2)}, min age met: ${ruleMinAge ? 'Yes' : 'No'}`,
      result: ruleQualifies && ruleMinAge ? 'PASS' : 'FAIL',
      source_reference: `C.R.S. §24-51-401`,
    })
  }
  audit.push({
    rule_id: 'ELIG-REDUCTION',
    rule_name: 'Early Retirement Reduction',
    description: `Reduction: ${reductionPct}%, factor: ${reductionFactor}`,
    result: 'INFO',
    source_reference: 'C.R.S. §24-51-605',
  })

  // Determine rule_of_n_value — Go returns ruleOfNSum (camelCase) or rule_of_n_sum
  const ruleOfNValue = ruleOfNSum != null ? Number(ruleOfNSum) : undefined
  const ruleOfNThreshold = ruleApplicable ? Number(ruleApplicable) : undefined

  return {
    member_id: fromBackendId(String(raw.member_id ?? raw.memberId ?? '')),
    retirement_date: retirementDate,
    division: String(raw.division ?? ''),
    has_table: Number(raw.has_table ?? 0),
    has_table_name: String(raw.has_table_name ?? ''),
    age_at_retirement: ageAtRet,
    eligible,
    retirement_type: retType,
    rule_of_n_value: ruleOfNValue,
    rule_of_n_threshold: ruleOfNThreshold,
    reduction_factor: reductionFactor,
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
  // Intelligence service returns camelCase; support both conventions
  // AMS is nested under ams_calculation (snake) or amsCalculation (camel) in Go
  const amsObj = (raw.ams_calculation ?? raw.amsCalculation ?? {}) as Record<string, unknown>
  const amsValue = Number(amsObj.ams ?? amsObj.amount ?? raw.ams ?? 0)
  const amsWindowMonths = Number(amsObj.window_months ?? amsObj.windowMonths ?? raw.ams_window_months ?? 0)

  const multiplier = Number(raw.multiplier ?? 0)
  const serviceYears = Number(raw.service_years_for_benefit ?? raw.serviceYearsForBenefit ?? 0)
  const reductionFactor = Number(raw.reduction_factor ?? raw.reductionFactor ?? 1)
  const retirementType = String(raw.retirement_type ?? raw.retirementType ?? '')

  // Go has unreducedMonthlyBenefit, reducedMonthlyBenefit, maximumMonthlyBenefit (camelCase)
  const unreducedMonthly = Number(raw.unreduced_monthly_benefit ?? raw.unreducedMonthlyBenefit ?? 0)
  const reducedMonthly = Number(raw.reduced_monthly_benefit ?? raw.reducedMonthlyBenefit ?? raw.maximum_monthly_benefit ?? raw.maximumMonthlyBenefit ?? 0)
  const maxMonthly = Number(raw.maximum_monthly_benefit ?? raw.maximumMonthlyBenefit ?? reducedMonthly)

  const grossMonthly = unreducedMonthly || (amsValue * multiplier * serviceYears / 12)
  const grossAnnual = grossMonthly * 12

  // Formula string
  const formula = String(raw.formula ?? `$${amsValue.toFixed(2)} × ${(multiplier * 100).toFixed(1)}% × ${serviceYears.toFixed(2)} years`)

  // Map annual increase — COPERA uses compound annual increases instead of IPR
  const aiObj = (raw.annual_increase ?? raw.annualIncrease) as Record<string, unknown> | undefined
  let annual_increase: AnnualIncreaseInfo | undefined
  if (aiObj) {
    annual_increase = {
      rate: Number(aiObj.rate ?? 0),
      first_eligible_date: String(aiObj.first_eligible_date ?? aiObj.firstEligibleDate ?? ''),
      compound_method: String(aiObj.compound_method ?? aiObj.compoundMethod ?? 'compound'),
      note: String(aiObj.note ?? ''),
    }
  }

  // Map death benefit — Go returns deathBenefit (camelCase)
  const dbObj = (raw.death_benefit ?? raw.deathBenefit) as Record<string, unknown> | undefined
  let deathBenefit: DeathBenefitResult | undefined
  if (dbObj) {
    deathBenefit = {
      amount: Number(dbObj.lump_sum_amount ?? dbObj.lumpSumAmount ?? dbObj.amount ?? 0),
      has_table: Number(dbObj.has_table ?? raw.has_table ?? 0),
      retirement_type: String(dbObj.retirement_type ?? dbObj.retirementType ?? retirementType),
      description: String(dbObj.description ?? ''),
    }
  }

  // Build audit trail
  const audit: AuditEntry[] = []
  audit.push({
    rule_id: 'BENEFIT-AMS',
    rule_name: 'Average Monthly Salary',
    description: `AMS: $${amsValue.toFixed(2)} (${amsWindowMonths}-month window)`,
    result: 'CALCULATED',
    source_reference: 'C.R.S. §24-51-101',
  })
  audit.push({
    rule_id: 'BENEFIT-FORMULA',
    rule_name: 'Benefit Formula',
    description: formula,
    result: 'CALCULATED',
    source_reference: 'C.R.S. §24-51-602',
  })
  if (reductionFactor < 1) {
    audit.push({
      rule_id: 'BENEFIT-REDUCTION',
      rule_name: 'Early Retirement Reduction',
      description: `Factor: ${reductionFactor.toFixed(4)} (${((1 - reductionFactor) * 100).toFixed(1)}% reduction)`,
      result: 'APPLIED',
      source_reference: 'C.R.S. §24-51-605',
    })
  }

  return {
    member_id: fromBackendId(String(raw.member_id ?? raw.memberId ?? '')),
    retirement_date: String(raw.retirement_date ?? raw.retirementDate ?? ''),
    division: String(raw.division ?? ''),
    has_table: Number(raw.has_table ?? 0),
    has_table_name: String(raw.has_table_name ?? ''),
    ams: amsValue,
    ams_window_months: amsWindowMonths,
    annual_has: Number(raw.annual_has ?? amsValue * 12),
    service_years_for_benefit: serviceYears,
    multiplier,
    gross_annual_benefit: grossAnnual,
    gross_monthly_benefit: grossMonthly,
    reduction_factor: reductionFactor,
    retirement_type: retirementType,
    net_monthly_benefit: maxMonthly,
    formula_display: formula,
    anti_spiking_applied: Boolean(raw.anti_spiking_applied ?? raw.antiSpikingApplied ?? false),
    annual_increase,
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
  // Intelligence handler wraps in {"paymentOptions": ..., "dro": ...} (camelCase)
  const po = (raw.payment_options ?? raw.paymentOptions ?? raw) as Record<string, unknown>
  const baseBenefit = Number(po.base_benefit ?? po.baseBenefit ?? po.base_monthly_benefit ?? 0)

  const options: PaymentOption[] = []

  // Maximum option
  const max = po.maximum as Record<string, unknown> | undefined
  if (max) {
    options.push({
      option_name: String(max.name ?? 'Maximum'),
      option_type: 'maximum',
      display_name: String(max.display_name ?? max.displayName ?? 'Option 1 — Maximum'),
      monthly_amount: Number(max.monthly_benefit ?? max.monthlyBenefit ?? 0),
      reduction_factor: Number(max.factor ?? 1),
      description: 'Maximum monthly benefit with no survivor benefit',
    })
  }

  // J&S options — intelligence uses camelCase keys (jointSurvivor100, etc.)
  for (const [snakeKey, camelKey, label, pct] of [
    ['joint_survivor_100', 'jointSurvivor100', 'Joint & 100% Survivor', 100],
    ['joint_survivor_75', 'jointSurvivor75', 'Joint & 75% Survivor', 75],
    ['joint_survivor_50', 'jointSurvivor50', 'Joint & 50% Survivor', 50],
  ] as const) {
    const opt = (po[snakeKey] ?? po[camelKey]) as Record<string, unknown> | null | undefined
    if (opt) {
      options.push({
        option_name: String(opt.name ?? label),
        option_type: snakeKey,
        display_name: String(opt.display_name ?? opt.displayName ?? label),
        monthly_amount: Number(opt.monthly_benefit ?? opt.monthlyBenefit ?? 0),
        reduction_factor: Number(opt.factor ?? 1),
        survivor_pct: Number(pct),
        description: `${pct}% of benefit continues to survivor`,
      })
    }
  }

  return {
    base_monthly_benefit: baseBenefit,
    division: String(po.division ?? ''),
    options,
  }
}

// ─── mapScenarios ─────────────────────────────────────────────────────────────

/**
 * Go returns {member_id, scenarios: [{retirement_date, eligibility: {...}, benefit: {...}}]}.
 * TS expects flat ScenarioResult[].
 */
export function mapScenarios(raw: Record<string, unknown>): ScenarioResult[] {
  // Intelligence returns ScenarioResponse with camelCase fields
  const list = (raw.scenarios ?? []) as Record<string, unknown>[]
  if (!Array.isArray(list)) return []
  return list.map((s) => {
    const elig = (s.eligibility ?? {}) as Record<string, unknown>
    const ben = s.benefit as Record<string, unknown> | null | undefined
    const retType = String(elig.retirement_type ?? elig.retirementType ?? 'not_eligible')
    const eligible = retType !== 'not_eligible' && retType !== 'deferred'
    const maxBenefit = ben ? Number(ben.maximum_monthly_benefit ?? ben.maximumMonthlyBenefit ?? 0) : 0
    return {
      retirement_date: String(s.retirement_date ?? s.retirementDate ?? ''),
      age_at_retirement: Number(elig.age_at_retirement ?? elig.ageAtRetirement ?? 0),
      eligible,
      retirement_type: retType,
      reduction_factor: Number(elig.reduction_factor ?? elig.reductionFactor ?? 1),
      net_monthly_benefit: maxBenefit,
      annual_benefit: maxBenefit * 12,
    }
  })
}

// ─── mapDROResult ─────────────────────────────────────────────────────────────

/**
 * Go returns {dro_calculation: {...}, payment_options: {...}, benefit: {...}}.
 * TS expects flat DROResult.
 */
export function mapDROResult(raw: Record<string, unknown>): DROResult {
  // Intelligence handler wraps in {"droCalculation": ..., "paymentOptions": ..., "benefit": ...} (camelCase)
  const d = (raw.dro_calculation ?? raw.droCalculation ?? raw) as Record<string, unknown>
  const maritalFraction = Number(d.marital_fraction ?? d.maritalFraction ?? 0)
  const droPercentage = Number(d.dro_percentage ?? d.droPercentage ?? 0)
  return {
    dro_id: String(d.dro_id ?? d.droId ?? ''),
    total_service_years: Number(d.total_service_years ?? d.totalServiceYears ?? 0),
    marital_service_years: Number(d.service_during_marriage_years ?? d.serviceDuringMarriageYears ?? d.marital_service_years ?? 0),
    marital_fraction: maritalFraction,
    member_gross_benefit: Number(d.maximum_benefit ?? d.maximumBenefit ?? d.member_gross_benefit ?? 0),
    marital_share: Number(d.marital_share_of_benefit ?? d.maritalShareOfBenefit ?? d.marital_share ?? 0),
    alternate_payee_amount: Number(d.alternate_payee_share ?? d.alternatePayeeShare ?? d.alternate_payee_amount ?? 0),
    member_net_after_dro: Number(d.member_remaining_benefit ?? d.memberRemainingBenefit ?? d.member_net_after_dro ?? 0),
    division_method: String(d.division_method ?? d.divisionMethod ?? ''),
    alternate_payee_name: String(d.alternate_payee_name ?? d.alternatePayeeName ?? ''),
    audit_trail: [{
      rule_id: 'DRO-CALC',
      rule_name: 'DRO Division',
      description: `Marital fraction: ${maritalFraction.toFixed(4)}, DRO%: ${droPercentage.toFixed(1)}%`,
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
