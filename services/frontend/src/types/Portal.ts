/**
 * Portal types — application lifecycle state machine, status display metadata,
 * progress stages, submission/document/message/transition interfaces, and
 * ApplicationDraft form type for the 7-step wizard.
 * Consumed by: portal pages, usePortal hooks, portal-demo-data
 * Depends on: Nothing (pure type definitions)
 */

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'NOTARIZED_RECEIVED'
  | 'ELIGIBILITY_REVIEW'
  | 'CALCULATION'
  | 'PENDING_INFO'
  | 'SUPERVISOR_REVIEW'
  | 'APPROVED'
  | 'DENIED'

/** Member-facing status with simplified language */
export const STATUS_DISPLAY: Record<ApplicationStatus, { label: string; detail: string; progress: number }> = {
  DRAFT: { label: 'In Progress', detail: "You're still working on your application. It's saved automatically.", progress: 0 },
  SUBMITTED: { label: 'Submitted', detail: "We've received your digital application. Please print, sign before a notary, and submit the notarized copy.", progress: 20 },
  NOTARIZED_RECEIVED: { label: 'Under Review', detail: "We've received your notarized application and have started our review.", progress: 35 },
  ELIGIBILITY_REVIEW: { label: 'Eligibility Verification', detail: "We're verifying your eligibility for retirement benefits.", progress: 50 },
  CALCULATION: { label: 'Benefit Calculation', detail: "We're calculating your retirement benefit based on your service and salary history.", progress: 70 },
  PENDING_INFO: { label: 'Action Needed', detail: 'We need additional information from you. Please check your messages.', progress: -1 },
  SUPERVISOR_REVIEW: { label: 'Final Review', detail: 'Your benefit calculation is being reviewed by a supervisor for final approval.', progress: 85 },
  APPROVED: { label: 'Approved', detail: 'Your retirement application has been approved!', progress: 100 },
  DENIED: { label: 'Denied', detail: 'We were unable to approve your application. Please check your messages for details.', progress: -1 },
}

/** Progress bar stages visible to member */
export const PROGRESS_STAGES = [
  { key: 'SUBMITTED', label: 'Submitted', pct: 20 },
  { key: 'NOTARIZED_RECEIVED', label: 'Notarized Received', pct: 35 },
  { key: 'ELIGIBILITY_REVIEW', label: 'Eligibility', pct: 50 },
  { key: 'CALCULATION', label: 'Calculation', pct: 70 },
  { key: 'SUPERVISOR_REVIEW', label: 'Final Review', pct: 85 },
  { key: 'APPROVED', label: 'Approved', pct: 100 },
] as const

export interface ApplicationSubmission {
  app_id: string
  member_id: string
  status: ApplicationStatus
  retirement_date: string | null
  last_day_worked: string | null
  retirement_type: string | null
  payment_option: string | null
  beneficiary_name: string | null
  beneficiary_relationship: string | null
  insurance_elected: boolean | null
  death_benefit_election: string | null
  acknowledgements_complete: boolean
  created_at: string
  updated_at: string
  submitted_at: string | null
  notarized_received_at: string | null
}

export interface ApplicationDocument {
  doc_id: string
  doc_type: string
  doc_name: string
  required: boolean
  status: 'PENDING' | 'RECEIVED' | 'WAIVED' | 'NOT_APPLICABLE'
  received_date: string | null
  notes: string | null
}

export interface ApplicationMessage {
  msg_id: string
  sender_type: 'MEMBER' | 'STAFF'
  sender_name: string
  msg_text: string
  msg_type: 'INFO' | 'ACTION_REQUIRED' | 'RESPONSE' | 'STATUS_UPDATE'
  created_at: string
  read: boolean
}

export interface StatusTransition {
  from_status: ApplicationStatus | null
  to_status: ApplicationStatus
  changed_by: string
  changed_at: string
  reason: string | null
}

/** Wizard draft form state */
export interface ApplicationDraft {
  step: number
  personal_confirmed: boolean
  retirement_date: string
  last_day_worked: string
  payment_option: 'maximum' | 'j&s_100' | 'j&s_75' | 'j&s_50' | ''
  death_benefit_election: 'DRAW_50' | 'DRAW_100' | 'NO_DRAW' | ''
  insurance_elected: boolean | null
  tax_federal_election: 'NONE' | 'TABLE' | 'FIXED'
  tax_co_election: 'NONE' | 'TABLE' | 'FIXED'
  ack_irrevocable: boolean
  ack_notarize: boolean
  ack_reemployment: boolean
  ack_electronic_comm: boolean
}

export const INITIAL_DRAFT: ApplicationDraft = {
  step: 0,
  personal_confirmed: false,
  retirement_date: '',
  last_day_worked: '',
  payment_option: '',
  death_benefit_election: '',
  insurance_elected: null,
  tax_federal_election: 'TABLE',
  tax_co_election: 'TABLE',
  ack_irrevocable: false,
  ack_notarize: false,
  ack_reemployment: false,
  ack_electronic_comm: false,
}
