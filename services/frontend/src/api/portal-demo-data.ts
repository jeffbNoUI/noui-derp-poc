/**
 * Portal demo data fixtures — application states, documents, messages, status history.
 * Case 1 (10001): Clean slate — no application
 * Case 2 (10002): Pre-seeded at SUBMITTED
 * Case 3 (10003): Pre-seeded at CALCULATION
 * Case 4 (10004): Clean slate — no application
 */
import type { ApplicationSubmission, ApplicationDocument, ApplicationMessage, StatusTransition } from '@/types/Portal'

// ─── Application Submissions ─────────────────────────────────────────────────

const case2Application: ApplicationSubmission = {
  app_id: 'APP-2001',
  member_id: '10002',
  status: 'SUBMITTED',
  retirement_date: '2026-05-01',
  last_day_worked: '2026-04-30',
  retirement_type: 'early',
  payment_option: 'maximum',
  beneficiary_name: null,
  beneficiary_relationship: null,
  insurance_elected: false,
  death_benefit_election: 'DRAW_50',
  acknowledgements_complete: true,
  created_at: '2026-02-10T14:30:00Z',
  updated_at: '2026-02-10T15:45:00Z',
  submitted_at: '2026-02-10T15:45:00Z',
  notarized_received_at: null,
}

const case3Application: ApplicationSubmission = {
  app_id: 'APP-3001',
  member_id: '10003',
  status: 'CALCULATION',
  retirement_date: '2026-04-01',
  last_day_worked: '2026-03-31',
  retirement_type: 'early',
  payment_option: 'j&s_75',
  beneficiary_name: 'Michelle Washington',
  beneficiary_relationship: 'Spouse',
  insurance_elected: true,
  death_benefit_election: 'DRAW_100',
  acknowledgements_complete: true,
  created_at: '2026-01-15T09:00:00Z',
  updated_at: '2026-02-18T11:30:00Z',
  submitted_at: '2026-01-15T10:20:00Z',
  notarized_received_at: '2026-01-22T14:00:00Z',
}

const DEMO_APPLICATIONS: Record<string, ApplicationSubmission | null> = {
  '10001': null,
  '10002': case2Application,
  '10003': case3Application,
  '10004': null,
}

// ─── Document Checklists ─────────────────────────────────────────────────────

const case2Documents: ApplicationDocument[] = [
  { doc_id: 'DOC-201', doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Application', required: true, status: 'PENDING', received_date: null, notes: null },
  { doc_id: 'DOC-202', doc_type: 'BIRTH_CERT', doc_name: 'Birth Certificate', required: true, status: 'PENDING', received_date: null, notes: null },
]

const case3Documents: ApplicationDocument[] = [
  { doc_id: 'DOC-301', doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Application', required: true, status: 'RECEIVED', received_date: '2026-01-22', notes: null },
  { doc_id: 'DOC-302', doc_type: 'BIRTH_CERT', doc_name: 'Birth Certificate', required: true, status: 'RECEIVED', received_date: '2026-01-22', notes: null },
  { doc_id: 'DOC-303', doc_type: 'MARRIAGE_CERT', doc_name: 'Marriage Certificate', required: true, status: 'RECEIVED', received_date: '2026-01-25', notes: null },
  { doc_id: 'DOC-304', doc_type: 'INSURANCE_FORM', doc_name: 'Health Insurance Election Form', required: true, status: 'PENDING', received_date: null, notes: null },
]

const DEMO_DOCUMENTS: Record<string, ApplicationDocument[]> = {
  '10001': [],
  '10002': case2Documents,
  '10003': case3Documents,
  '10004': [],
}

// ─── Messages ────────────────────────────────────────────────────────────────

const case2Messages: ApplicationMessage[] = []

const case3Messages: ApplicationMessage[] = [
  {
    msg_id: 'MSG-301',
    sender_type: 'STAFF',
    sender_name: 'Sarah Chen, Benefits Analyst',
    msg_text: 'We have received your notarized application and all required documents except the Health Insurance Election Form. Your eligibility has been verified and we are now calculating your benefit. Please submit the insurance form at your earliest convenience.',
    msg_type: 'INFO',
    created_at: '2026-02-05T10:15:00Z',
    read: true,
  },
  {
    msg_id: 'MSG-302',
    sender_type: 'MEMBER',
    sender_name: 'David Washington',
    msg_text: 'Thank you for the update. I will submit the insurance form this week.',
    msg_type: 'RESPONSE',
    created_at: '2026-02-05T14:30:00Z',
    read: true,
  },
]

const DEMO_MESSAGES: Record<string, ApplicationMessage[]> = {
  '10001': [],
  '10002': case2Messages,
  '10003': case3Messages,
  '10004': [],
}

// ─── Status History ──────────────────────────────────────────────────────────

const case2History: StatusTransition[] = [
  { from_status: null, to_status: 'DRAFT', changed_by: 'Jennifer Kim', changed_at: '2026-02-10T14:30:00Z', reason: 'Application started' },
  { from_status: 'DRAFT', to_status: 'SUBMITTED', changed_by: 'Jennifer Kim', changed_at: '2026-02-10T15:45:00Z', reason: 'Digital application submitted' },
]

const case3History: StatusTransition[] = [
  { from_status: null, to_status: 'DRAFT', changed_by: 'David Washington', changed_at: '2026-01-15T09:00:00Z', reason: 'Application started' },
  { from_status: 'DRAFT', to_status: 'SUBMITTED', changed_by: 'David Washington', changed_at: '2026-01-15T10:20:00Z', reason: 'Digital application submitted' },
  { from_status: 'SUBMITTED', to_status: 'NOTARIZED_RECEIVED', changed_by: 'Sarah Chen', changed_at: '2026-01-22T14:00:00Z', reason: 'Notarized application received via mail' },
  { from_status: 'NOTARIZED_RECEIVED', to_status: 'ELIGIBILITY_REVIEW', changed_by: 'Sarah Chen', changed_at: '2026-01-23T09:15:00Z', reason: 'Case assigned for review' },
  { from_status: 'ELIGIBILITY_REVIEW', to_status: 'CALCULATION', changed_by: 'System', changed_at: '2026-02-01T11:30:00Z', reason: 'Eligibility confirmed — Tier 3, early retirement with 12% reduction' },
]

const DEMO_STATUS_HISTORY: Record<string, StatusTransition[]> = {
  '10001': [],
  '10002': case2History,
  '10003': case3History,
  '10004': [],
}

// ─── Demo Portal API ─────────────────────────────────────────────────────────

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

// Mutable store for runtime application state (e.g., after member submits via wizard)
const runtimeApplications: Record<string, ApplicationSubmission> = {}
const runtimeDocuments: Record<string, ApplicationDocument[]> = {}
const runtimeHistory: Record<string, StatusTransition[]> = {}

export const portalDemoApi = {
  getApplication: (memberId: string) => {
    const runtime = runtimeApplications[memberId]
    if (runtime) return delay(runtime)
    return delay(DEMO_APPLICATIONS[memberId] ?? null)
  },

  getDocuments: (memberId: string) => {
    const runtime = runtimeDocuments[memberId]
    if (runtime) return delay(runtime)
    return delay(DEMO_DOCUMENTS[memberId] ?? [])
  },

  getMessages: (memberId: string) => {
    return delay(DEMO_MESSAGES[memberId] ?? [])
  },

  getStatusHistory: (memberId: string) => {
    const runtime = runtimeHistory[memberId]
    if (runtime) return delay(runtime)
    return delay(DEMO_STATUS_HISTORY[memberId] ?? [])
  },

  submitApplication: (memberId: string, _retirementDate: string, _paymentOption: string) => {
    const appId = `APP-${memberId}-${Date.now()}`
    const now = new Date().toISOString()
    const app: ApplicationSubmission = {
      app_id: appId,
      member_id: memberId,
      status: 'SUBMITTED',
      retirement_date: _retirementDate,
      last_day_worked: null,
      retirement_type: null,
      payment_option: _paymentOption,
      beneficiary_name: null,
      beneficiary_relationship: null,
      insurance_elected: null,
      death_benefit_election: null,
      acknowledgements_complete: true,
      created_at: now,
      updated_at: now,
      submitted_at: now,
      notarized_received_at: null,
    }
    runtimeApplications[memberId] = app
    runtimeDocuments[memberId] = [
      { doc_id: `DOC-${Date.now()}-1`, doc_type: 'NOTARIZED_APP', doc_name: 'Notarized Application', required: true, status: 'PENDING', received_date: null, notes: null },
      { doc_id: `DOC-${Date.now()}-2`, doc_type: 'BIRTH_CERT', doc_name: 'Birth Certificate', required: true, status: 'PENDING', received_date: null, notes: null },
    ]
    runtimeHistory[memberId] = [
      { from_status: null, to_status: 'DRAFT', changed_by: 'Member', changed_at: now, reason: 'Application started' },
      { from_status: 'DRAFT', to_status: 'SUBMITTED', changed_by: 'Member', changed_at: now, reason: 'Digital application submitted' },
    ]
    return delay({ app_id: appId, status: 'SUBMITTED' }, 600)
  },
}
