/**
 * Portal demo data contract tests — verifies pre-seeded application fixtures
 * match expected types and demo narrative states.
 * Case 1 (10001): No application (clean slate for live demo)
 * Case 2 (10002): SUBMITTED status with pending documents
 * Case 3 (10003): CALCULATION status with some documents received
 * Case 4 (10004): No application (clean slate)
 */
import { describe, it, expect } from 'vitest'
import { portalDemoApi } from './portal-demo-data'

describe('Portal Demo Data', () => {
  describe('Application states per demo case', () => {
    it('Case 1 (10001) — no application (clean slate)', async () => {
      const app = await portalDemoApi.getApplication('10001')
      expect(app).toBeNull()
    })

    it('Case 2 (10002) — SUBMITTED status', async () => {
      const app = await portalDemoApi.getApplication('10002')
      expect(app).not.toBeNull()
      expect(app!.status).toBe('SUBMITTED')
      expect(app!.member_id).toBe('10002')
      expect(app!.submitted_at).toBeDefined()
    })

    it('Case 3 (10003) — CALCULATION status', async () => {
      const app = await portalDemoApi.getApplication('10003')
      expect(app).not.toBeNull()
      expect(app!.status).toBe('CALCULATION')
      expect(app!.member_id).toBe('10003')
    })

    it('Case 4 (10004) — no application (clean slate)', async () => {
      const app = await portalDemoApi.getApplication('10004')
      expect(app).toBeNull()
    })
  })

  describe('Document checklists', () => {
    it('Case 2 has pending documents', async () => {
      const docs = await portalDemoApi.getDocuments('10002')
      expect(docs.length).toBeGreaterThan(0)
      // SUBMITTED case should have at least one PENDING document (notarized app)
      const pending = docs.filter(d => d.status === 'PENDING')
      expect(pending.length).toBeGreaterThan(0)
    })

    it('Case 3 has some received documents', async () => {
      const docs = await portalDemoApi.getDocuments('10003')
      expect(docs.length).toBeGreaterThan(0)
      const received = docs.filter(d => d.status === 'RECEIVED')
      expect(received.length).toBeGreaterThan(0)
    })

    it('Case 1 has no documents', async () => {
      const docs = await portalDemoApi.getDocuments('10001')
      expect(docs).toHaveLength(0)
    })
  })

  describe('Status history', () => {
    it('Case 2 has SUBMITTED transition', async () => {
      const hist = await portalDemoApi.getStatusHistory('10002')
      expect(hist.length).toBeGreaterThan(0)
      const submitted = hist.find(h => h.to_status === 'SUBMITTED')
      expect(submitted).toBeDefined()
    })

    it('Case 3 has progression through multiple states', async () => {
      const hist = await portalDemoApi.getStatusHistory('10003')
      // CALCULATION is further along — should have at least 2 transitions
      expect(hist.length).toBeGreaterThanOrEqual(2)
    })

    it('Case 1 has no history', async () => {
      const hist = await portalDemoApi.getStatusHistory('10001')
      expect(hist).toHaveLength(0)
    })
  })

  describe('Messages', () => {
    it('Case 3 has at least one message (further along in processing)', async () => {
      const msgs = await portalDemoApi.getMessages('10003')
      expect(msgs.length).toBeGreaterThan(0)
    })

    it('Cases 1 and 2 have no messages', async () => {
      const msgs1 = await portalDemoApi.getMessages('10001')
      const msgs2 = await portalDemoApi.getMessages('10002')
      expect(msgs1).toHaveLength(0)
      expect(msgs2).toHaveLength(0)
    })
  })
})
