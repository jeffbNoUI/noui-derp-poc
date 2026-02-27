/**
 * Form submission store — in-memory mutable state for form bundles (portal-to-staff bridge).
 * Same pattern as portalDemoApi's runtimeApplications.
 * Consumed by: useFormSubmission hooks, LifeEventFlow, WorkQueue, SubmissionReview
 * Depends on: LifeEvent types (FormBundleSubmission, FormSubmission)
 */
import type { FormBundleSubmission, BundleStatus } from '@/types/LifeEvent'

function delay<T>(data: T, ms = 200): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(data), ms))
}

// Module-level mutable state — same pattern as portal-demo-data.ts
const bundles: Record<string, FormBundleSubmission> = {}

// Seed demo bundles so staff queue is not empty on first load
const now = new Date().toISOString()
const yesterday = new Date(Date.now() - 86400000).toISOString()

bundles['BUNDLE-DEMO-1'] = {
  bundleId: 'BUNDLE-DEMO-1',
  eventId: 'retirement',
  memberId: '10002',
  forms: [
    { submissionId: 'SUB-D1-F01', formId: 'F01', formName: 'Retirement Application', data: {}, status: 'COMPLETED' },
    { submissionId: 'SUB-D1-F13', formId: 'F13', formName: 'Health Insurance Election', data: {}, status: 'DRAFT' },
  ],
  status: 'IN_PROGRESS',
  createdAt: yesterday,
  submittedAt: null,
  triageAnswers: { marital_status: 'married', insurance_interest: 'yes' },
}

bundles['BUNDLE-DEMO-2'] = {
  bundleId: 'BUNDLE-DEMO-2',
  eventId: 'account',
  memberId: '10003',
  forms: [
    { submissionId: 'SUB-D2-F18', formId: 'F18', formName: 'Information Release Authorization', data: { release_to: 'Financial Advisor', purpose: 'Retirement planning consultation' }, status: 'SUBMITTED' },
  ],
  status: 'SUBMITTED',
  createdAt: yesterday,
  submittedAt: now,
  triageAnswers: { account_need: 'info_release' },
}

export const formSubmissionApi = {
  createBundle(memberId: string, eventId: string, triageAnswers: Record<string, string>, forms: { formId: string; formName: string }[]): Promise<FormBundleSubmission> {
    const bundleId = `BUNDLE-${Date.now()}`
    const bundle: FormBundleSubmission = {
      bundleId,
      eventId,
      memberId,
      forms: forms.map(f => ({
        submissionId: `SUB-${Date.now()}-${f.formId}`,
        formId: f.formId,
        formName: f.formName,
        data: {},
        status: 'DRAFT',
      })),
      status: 'IN_PROGRESS',
      createdAt: new Date().toISOString(),
      submittedAt: null,
      triageAnswers,
    }
    bundles[bundleId] = bundle
    return delay(bundle)
  },

  getBundle(bundleId: string): Promise<FormBundleSubmission | null> {
    return delay(bundles[bundleId] || null)
  },

  getBundlesForMember(memberId: string): Promise<FormBundleSubmission[]> {
    return delay(Object.values(bundles).filter(b => b.memberId === memberId))
  },

  getAllPending(): Promise<FormBundleSubmission[]> {
    return delay(Object.values(bundles).filter(b => b.status === 'SUBMITTED' || b.status === 'UNDER_REVIEW'))
  },

  updateFormInBundle(bundleId: string, formId: string, data: Record<string, unknown>): Promise<void> {
    const bundle = bundles[bundleId]
    if (!bundle) return delay(undefined)
    const form = bundle.forms.find(f => f.formId === formId)
    if (form) { form.data = { ...form.data, ...data } }
    return delay(undefined)
  },

  completeFormInBundle(bundleId: string, formId: string): Promise<void> {
    const bundle = bundles[bundleId]
    if (!bundle) return delay(undefined)
    const form = bundle.forms.find(f => f.formId === formId)
    if (form) { form.status = 'COMPLETED' }
    return delay(undefined)
  },

  submitBundle(bundleId: string): Promise<void> {
    const bundle = bundles[bundleId]
    if (!bundle) return delay(undefined)
    bundle.status = 'SUBMITTED'
    bundle.submittedAt = new Date().toISOString()
    // Mark all completed forms as submitted
    bundle.forms.forEach(f => { if (f.status === 'COMPLETED') f.status = 'SUBMITTED' })
    return delay(undefined, 600)
  },

  updateBundleStatus(bundleId: string, status: BundleStatus): Promise<void> {
    const bundle = bundles[bundleId]
    if (bundle) { bundle.status = status }
    return delay(undefined)
  },
}
