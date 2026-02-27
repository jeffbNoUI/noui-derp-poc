/**
 * Life event types — triage questions, event definitions, form bundle submissions.
 * Consumed by: life-events.ts, LifeEventHub, LifeEventFlow, form-submission-store
 * Depends on: Nothing (pure type definitions)
 */

export interface TriageQuestion {
  id: string
  question: string
  type: 'radio' | 'checkbox'
  options: { value: string; label: string; helpText?: string }[]
}

export interface LifeEventDef {
  eventId: string
  title: string
  description: string
  iconLabel: string
  color: string
  colorBg: string
  triage: TriageQuestion[]
  formResolver: (answers: Record<string, string>) => string[]
}

export type BundleStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'ACTION_NEEDED' | 'COMPLETE'

export interface FormBundleSubmission {
  bundleId: string
  eventId: string
  memberId: string
  forms: FormSubmission[]
  status: BundleStatus
  createdAt: string
  submittedAt: string | null
  triageAnswers: Record<string, string>
}

export interface FormSubmission {
  submissionId: string
  formId: string
  formName: string
  data: Record<string, unknown>
  status: 'DRAFT' | 'COMPLETED' | 'SUBMITTED'
}
