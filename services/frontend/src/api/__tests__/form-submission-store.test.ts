/**
 * Form submission store tests — validates CRUD operations, filtering, and status transitions.
 * Consumed by: CI test suite
 * Depends on: formSubmissionApi, LifeEvent types
 *
 * TOUCHPOINTS:
 *   Upstream: form-submission-store.ts
 *   Downstream: None (leaf test)
 *   Shared: FormBundleSubmission, BundleStatus types
 */
import { describe, it, expect } from 'vitest'
import { formSubmissionApi } from '@/api/form-submission-store'

describe('Form Submission Store', () => {

  describe('seeded demo data', () => {
    it('has seeded BUNDLE-DEMO-1 for member 10002', async () => {
      const bundle = await formSubmissionApi.getBundle('BUNDLE-DEMO-1')
      expect(bundle).not.toBeNull()
      expect(bundle!.memberId).toBe('10002')
      expect(bundle!.eventId).toBe('retirement')
      expect(bundle!.forms).toHaveLength(2)
    })

    it('has seeded BUNDLE-DEMO-2 for member 10003', async () => {
      const bundle = await formSubmissionApi.getBundle('BUNDLE-DEMO-2')
      expect(bundle).not.toBeNull()
      expect(bundle!.memberId).toBe('10003')
      expect(bundle!.eventId).toBe('account')
      expect(bundle!.status).toBe('SUBMITTED')
    })
  })

  describe('createBundle', () => {
    it('creates a new bundle and returns it', async () => {
      const bundle = await formSubmissionApi.createBundle(
        '10001', 'retirement', { marital_status: 'single' },
        [{ formId: 'F01', formName: 'Retirement Application' }]
      )
      expect(bundle.bundleId).toBeTruthy()
      expect(bundle.memberId).toBe('10001')
      expect(bundle.eventId).toBe('retirement')
      expect(bundle.status).toBe('IN_PROGRESS')
      expect(bundle.forms).toHaveLength(1)
      expect(bundle.forms[0].status).toBe('DRAFT')
      expect(bundle.submittedAt).toBeNull()
    })

    it('created bundle is retrievable', async () => {
      const created = await formSubmissionApi.createBundle(
        '10001', 'account', { account_need: 'info_release' },
        [{ formId: 'F18', formName: 'Info Release' }]
      )
      const retrieved = await formSubmissionApi.getBundle(created.bundleId)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.bundleId).toBe(created.bundleId)
    })
  })

  describe('getBundlesForMember', () => {
    it('returns bundles filtered by member ID', async () => {
      const bundles = await formSubmissionApi.getBundlesForMember('10002')
      expect(bundles.length).toBeGreaterThanOrEqual(1)
      expect(bundles.every(b => b.memberId === '10002')).toBe(true)
    })

    it('returns empty array for member with no bundles', async () => {
      const bundles = await formSubmissionApi.getBundlesForMember('99999')
      expect(bundles).toEqual([])
    })
  })

  describe('getAllPending', () => {
    it('returns SUBMITTED and UNDER_REVIEW bundles', async () => {
      const pending = await formSubmissionApi.getAllPending()
      expect(pending.length).toBeGreaterThanOrEqual(1)
      for (const b of pending) {
        expect(['SUBMITTED', 'UNDER_REVIEW']).toContain(b.status)
      }
    })
  })

  describe('updateFormInBundle', () => {
    it('merges data into form within bundle', async () => {
      const bundle = await formSubmissionApi.createBundle(
        '10001', 'disability', {},
        [{ formId: 'F16', formName: 'Disability Application' }]
      )
      await formSubmissionApi.updateFormInBundle(bundle.bundleId, 'F16', { condition: 'back injury' })
      const updated = await formSubmissionApi.getBundle(bundle.bundleId)
      expect(updated!.forms[0].data).toEqual({ condition: 'back injury' })
    })
  })

  describe('completeFormInBundle', () => {
    it('marks a form as COMPLETED', async () => {
      const bundle = await formSubmissionApi.createBundle(
        '10001', 'leaving', {},
        [{ formId: 'F15', formName: 'Direct Withdrawal' }]
      )
      await formSubmissionApi.completeFormInBundle(bundle.bundleId, 'F15')
      const updated = await formSubmissionApi.getBundle(bundle.bundleId)
      expect(updated!.forms[0].status).toBe('COMPLETED')
    })
  })

  describe('submitBundle', () => {
    it('sets bundle status to SUBMITTED and marks completed forms as SUBMITTED', async () => {
      const bundle = await formSubmissionApi.createBundle(
        '10001', 'life-change', { change_type: 'beneficiary' },
        [{ formId: 'F03', formName: 'Spousal Consent Pre-Retirement' }]
      )
      await formSubmissionApi.completeFormInBundle(bundle.bundleId, 'F03')
      await formSubmissionApi.submitBundle(bundle.bundleId)
      const updated = await formSubmissionApi.getBundle(bundle.bundleId)
      expect(updated!.status).toBe('SUBMITTED')
      expect(updated!.submittedAt).toBeTruthy()
      expect(updated!.forms[0].status).toBe('SUBMITTED')
    })
  })

  describe('updateBundleStatus', () => {
    it('transitions bundle status (staff actions)', async () => {
      await formSubmissionApi.updateBundleStatus('BUNDLE-DEMO-2', 'UNDER_REVIEW')
      const bundle = await formSubmissionApi.getBundle('BUNDLE-DEMO-2')
      expect(bundle!.status).toBe('UNDER_REVIEW')

      await formSubmissionApi.updateBundleStatus('BUNDLE-DEMO-2', 'COMPLETE')
      const completed = await formSubmissionApi.getBundle('BUNDLE-DEMO-2')
      expect(completed!.status).toBe('COMPLETE')
    })
  })

  describe('getBundle with unknown ID', () => {
    it('returns null', async () => {
      const result = await formSubmissionApi.getBundle('NONEXISTENT')
      expect(result).toBeNull()
    })
  })
})
