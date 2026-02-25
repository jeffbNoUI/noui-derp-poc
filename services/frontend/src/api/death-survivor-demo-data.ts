/**
 * Demo data fixtures for Death & Survivor Benefits domain.
 * Case 9: Margaret Thompson — retired Tier 1 member, 75% J&S, died March 15, 2026.
 * Case 10: James Rivera — active Tier 3 member, non-vested, died February 10, 2026.
 *
 * Values verified against hand calculations in:
 *   demo-cases/case9-thompson-retired-death/calculation.md
 *   demo-cases/case10-active-member-death/calculation.md
 *
 * Consumed by: death stage components, death-survivor-demo-data.test.ts
 * Depends on: types/DeathSurvivor.ts, types/Member.ts
 */
import type {
  DeathRecord,
  SurvivorClaim,
  DeathBenefitElection,
  OverpaymentRecord,
  DeathBenefitStatus,
  OverpaymentInfo,
  SurvivorBenefitResult,
  InstallmentCalcResult,
  ActiveMemberDeathResult,
  DeathProcessingSummary,
} from '@/types/DeathSurvivor.ts'

import type { Member } from '@/types/Member.ts'

// ─── Case 9: Margaret Thompson — Retired Member Death ─────────────────────

export const case9Member: Member = {
  member_id: '10009',
  first_name: 'Margaret',
  last_name: 'Thompson',
  date_of_birth: '1958-07-12',
  hire_date: '1990-03-01',
  tier: 1,
  status: 'Retired',
  department: 'Human Resources',
  position: 'HR Director',
  termination_date: '2023-12-31',
}

export const case9DeathRecord: DeathRecord = {
  death_record_id: 1,
  member_id: '10009',
  death_date: '2026-03-15',
  notification_date: '2026-03-16',
  notification_source: 'FAMILY',
  notification_contact: 'William Thompson',
  previous_member_status: 'R',
  current_member_status: 'S',
  status: 'VERIFIED',
  suspend_date: '2026-03-16',
  final_payment_date: '2026-03-01',
  certificate_received_date: '2026-03-20',
  certificate_verified_date: '2026-03-21',
  certificate_verified_by: 'STAFF_001',
  overpayment_detected: false,
  overpayment_amount: 0,
}

export const case9SurvivorClaim: SurvivorClaim = {
  claim_id: 1,
  death_record_id: 1,
  member_id: '10009',
  survivor_first_name: 'William',
  survivor_last_name: 'Thompson',
  survivor_date_of_birth: '1956-01-05',
  survivor_relationship: 'SPOUSE',
  claim_type: 'JS_SURVIVOR',
  js_percentage: 75,
  // 75% of $3,248.00 = $2,436.00 — verified against hand calculation
  monthly_amount: 2436.00,
  effective_date: '2026-04-01',
  first_payment_date: '2026-04-01',
  status: 'APPROVED',
  approved_date: '2026-03-22',
  approved_by: 'STAFF_001',
}

export const case9DeathBenefitElection: DeathBenefitElection = {
  election_id: 1,
  member_id: '10009',
  lump_sum_amount: 5000.00,
  num_installments: 100,
  // $5,000 / 100 = $50.00 per installment
  installment_amount: 50.00,
  effective_date: '2024-01-01',
  // Jan 2024 through Mar 2026 = 27 installments paid
  installments_paid: 27,
  installments_remaining: 73,
  // 73 × $50.00 = $3,650.00 remaining
  remaining_amount: 3650.00,
  beneficiary_first_name: 'William',
  beneficiary_last_name: 'Thompson',
  beneficiary_relationship: 'SPOUSE',
  status: 'TRANSFERRED',
}

export const case9OverpaymentRecords: OverpaymentRecord[] = []
// No overpayments — March payment deposited March 1 before March 15 death

export const case9DeathBenefitStatus: DeathBenefitStatus = {
  member_id: '10009',
  has_death_record: true,
  death_record: case9DeathRecord,
  survivor_claims: [case9SurvivorClaim],
  death_benefit_election: case9DeathBenefitElection,
  overpayment_records: case9OverpaymentRecords,
  processing_complete: true,
}

export const case9OverpaymentInfo: OverpaymentInfo = {
  overpayment_count: 0,
  overpayment_total: 0.00,
  valid_payments: 3,
  payment_details: [
    { deposit_date: '2026-01-01', amount: 3248.00, valid: true, reason: 'Deposited 2026-01-01, before death date 2026-03-15' },
    { deposit_date: '2026-02-01', amount: 3248.00, valid: true, reason: 'Deposited 2026-02-01, before death date 2026-03-15' },
    { deposit_date: '2026-03-01', amount: 3248.00, valid: true, reason: 'Deposited 2026-03-01, before death date 2026-03-15' },
  ],
}

export const case9SurvivorBenefit: SurvivorBenefitResult = {
  // 75% × $3,248.00 = $2,436.00 — TO THE PENNY
  survivor_monthly_benefit: 2436.00,
  survivor_name: 'William Thompson',
  js_percentage: 0.75,
  effective_date: '2026-04-01',
  duration: "Survivor's lifetime",
  formula: '$3,248.00 x 75% = $2,436.00',
}

export const case9Installments: InstallmentCalcResult = {
  installment_amount: 50.00,
  installments_paid: 27,
  installments_remaining: 73,
  remaining_total: 3650.00,
  formula: '$5,000.00 / 100 = $50.00 per installment; 27 paid, 73 remaining; $3,650.00 total remaining',
}

export const case9ProcessingSummary: DeathProcessingSummary = {
  member_id: '10009',
  notification: {
    benefit_suspended: true,
    certificate_required: true,
    status_transition: 'RETIRED -> SUSPENDED',
    note: 'Benefit payments suspended pending death certificate verification.',
  },
  overpayment: case9OverpaymentInfo,
  survivor_benefit: case9SurvivorBenefit,
  death_benefit_installments: case9Installments,
  record_transition: {
    status_sequence: ['RETIRED', 'SUSPENDED', 'DECEASED'],
    survivor_record_created: true,
    benefit_terminated: false,
  },
  calculation_trace: [
    {
      step: 1,
      rule_id: 'RULE-DEATH-NOTIFY',
      rule_name: 'Death Notification',
      description: 'Process death notification and suspend benefits',
      inputs: 'member=10009, status=retired, death=2026-03-15',
      result: 'Benefit suspended, certificate required',
      source_reference: 'DERP Operating Procedures',
    },
    {
      step: 2,
      rule_id: 'RULE-OVERPAY-DETECT',
      rule_name: 'Overpayment Detection',
      description: 'Check for payments deposited after date of death',
      inputs: 'death=2026-03-15, payments=3',
      result: 'Overpayments: 0, total $0.00',
      source_reference: 'DERP Operating Procedures',
    },
    {
      step: 3,
      rule_id: 'RULE-SURVIVOR-JS',
      rule_name: 'Survivor Benefit Continuation',
      description: 'Calculate 75% J&S survivor benefit for William Thompson',
      inputs: 'benefit=$3,248.00, js=75%',
      result: 'Survivor benefit: $2,436.00/month for lifetime',
      source_reference: 'RMC §18-410(a)(1)',
    },
    {
      step: 4,
      rule_id: 'RULE-DEATH-INSTALLMENTS',
      rule_name: 'Death Benefit Installments',
      description: 'Calculate remaining death benefit installments',
      inputs: 'lump=$5,000.00, elect=100, retired=2024-01-01, death=2026-03-15',
      result: 'Paid: 27, remaining: 73, total remaining: $3,650.00',
      source_reference: 'RMC §18-411(d)',
    },
    {
      step: 5,
      rule_id: 'RULE-DEATH-RECORD-TRANSITION',
      rule_name: 'Record Transition',
      description: 'Member status: RETIRED -> SUSPENDED -> DECEASED. Survivor record created.',
      inputs: 'status=retired, cert_verified=true, option=75_js',
      result: 'Sequence: [RETIRED, SUSPENDED, DECEASED], survivor created',
      source_reference: 'DERP Operating Procedures',
    },
  ],
}

// ─── Case 10: James Rivera — Active Member Death (Non-Vested) ─────────────

export const case10Member: Member = {
  member_id: '10010',
  first_name: 'James',
  last_name: 'Rivera',
  date_of_birth: '1992-11-03',
  hire_date: '2023-06-15',
  tier: 3,
  status: 'Active',
  department: 'Information Technology',
  position: 'Systems Analyst',
}

export const case10DeathRecord: DeathRecord = {
  death_record_id: 2,
  member_id: '10010',
  death_date: '2026-02-10',
  notification_date: '2026-02-11',
  notification_source: 'EMPLOYER',
  notification_contact: 'IT Department Manager',
  previous_member_status: 'A',
  current_member_status: 'S',
  status: 'VERIFIED',
  suspend_date: '2026-02-11',
  certificate_received_date: '2026-02-18',
  certificate_verified_date: '2026-02-19',
  certificate_verified_by: 'STAFF_002',
  overpayment_detected: false,
  overpayment_amount: 0,
}

export const case10SurvivorClaim: SurvivorClaim = {
  claim_id: 2,
  death_record_id: 2,
  member_id: '10010',
  survivor_first_name: 'Maria',
  survivor_last_name: 'Rivera',
  survivor_date_of_birth: '1993-05-22',
  survivor_relationship: 'SPOUSE',
  claim_type: 'CONTRIB_REFUND',
  monthly_amount: 0,
  // Contributions $13,215.30 + interest $487.20 = $13,702.50
  lump_sum_amount: 13702.50,
  effective_date: '2026-02-19',
  status: 'APPROVED',
  approved_date: '2026-02-25',
  approved_by: 'STAFF_002',
}

export const case10ActiveMemberDeath: ActiveMemberDeathResult = {
  benefit_type: 'contribution_refund',
  vested: false,
  refund_amount: 13702.50,
  survivor_annuity_available: false,
  formula: 'Contributions $13,215.30 + Interest $487.20 = $13,702.50 refund',
}

export const case10DeathBenefitStatus: DeathBenefitStatus = {
  member_id: '10010',
  has_death_record: true,
  death_record: case10DeathRecord,
  survivor_claims: [case10SurvivorClaim],
  overpayment_records: [],
  processing_complete: true,
}

export const case10ProcessingSummary: DeathProcessingSummary = {
  member_id: '10010',
  notification: {
    benefit_suspended: true,
    certificate_required: true,
    status_transition: 'ACTIVE -> SUSPENDED',
    note: 'Active member death recorded. Death certificate required for final processing.',
  },
  overpayment: {
    overpayment_count: 0,
    overpayment_total: 0,
    valid_payments: 0,
    payment_details: [],
  },
  active_member_death: case10ActiveMemberDeath,
  record_transition: {
    status_sequence: ['ACTIVE', 'SUSPENDED', 'DECEASED'],
    survivor_record_created: false,
    benefit_terminated: true,
  },
  calculation_trace: [
    {
      step: 1,
      rule_id: 'RULE-DEATH-NOTIFY',
      rule_name: 'Death Notification',
      description: 'Process death notification for active member',
      inputs: 'member=10010, status=active, death=2026-02-10',
      result: 'Employment suspended, certificate required',
      source_reference: 'DERP Operating Procedures',
    },
    {
      step: 2,
      rule_id: 'RULE-ACTIVE-DEATH',
      rule_name: 'Active Member Death',
      description: 'Determine benefit type: non-vested (2.67 years < 5.00 required)',
      inputs: 'service=2.67, contributions=$13,215.30, interest=$487.20',
      result: 'Contribution refund: $13,702.50 to Maria Rivera',
      source_reference: 'RMC §18-411',
    },
    {
      step: 3,
      rule_id: 'RULE-DEATH-RECORD-TRANSITION',
      rule_name: 'Record Transition',
      description: 'Member status: ACTIVE -> SUSPENDED -> DECEASED. No survivor benefit.',
      inputs: 'status=active, cert_verified=true, option=none',
      result: 'Sequence: [ACTIVE, SUSPENDED, DECEASED], no survivor record',
      source_reference: 'DERP Operating Procedures',
    },
  ],
}

// ─── Registry ────────────────────────────────────────────────────────────

export const DEMO_DEATH_RECORDS: Record<string, DeathBenefitStatus> = {
  '10009': case9DeathBenefitStatus,
  '10010': case10DeathBenefitStatus,
}

export const DEMO_DEATH_SUMMARIES: Record<string, DeathProcessingSummary> = {
  '10009': case9ProcessingSummary,
  '10010': case10ProcessingSummary,
}

// ─── Demo API helpers ────────────────────────────────────────────────────

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export const deathSurvivorDemoApi = {
  getDeathStatus: (memberId: string) => {
    const d = DEMO_DEATH_RECORDS[memberId]
    if (!d) return delay({ member_id: memberId, has_death_record: false, survivor_claims: [], overpayment_records: [], processing_complete: false } as DeathBenefitStatus)
    return delay(d)
  },

  getProcessingSummary: (memberId: string) => {
    const s = DEMO_DEATH_SUMMARIES[memberId]
    if (!s) return Promise.reject(new Error(`No death processing summary for ${memberId}`))
    return delay(s)
  },
}
