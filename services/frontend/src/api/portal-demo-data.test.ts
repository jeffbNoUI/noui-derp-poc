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
    it('Case 2 has exactly 2 pending documents', async () => {
      const docs = await portalDemoApi.getDocuments('10002')
      expect(docs).toHaveLength(2)
      const pending = docs.filter(d => d.status === 'PENDING')
      expect(pending).toHaveLength(2)
    })

    it('Case 2 documents have valid doc_type strings', async () => {
      const docs = await portalDemoApi.getDocuments('10002')
      const validTypes = ['NOTARIZED_APP', 'BIRTH_CERT', 'MARRIAGE_CERT', 'INSURANCE_FORM', 'VOIDED_CHECK']
      for (const doc of docs) {
        expect(doc.doc_type).toBeTruthy()
        expect(validTypes).toContain(doc.doc_type)
        expect(doc.doc_id).toBeTruthy()
        expect(doc.doc_name).toBeTruthy()
        expect(typeof doc.required).toBe('boolean')
      }
    })

    it('Case 3 has 4 documents: 3 received, 1 pending', async () => {
      const docs = await portalDemoApi.getDocuments('10003')
      expect(docs).toHaveLength(4)
      const received = docs.filter(d => d.status === 'RECEIVED')
      expect(received).toHaveLength(3)
      const pending = docs.filter(d => d.status === 'PENDING')
      expect(pending).toHaveLength(1)
    })

    it('Case 3 received documents have received_date set', async () => {
      const docs = await portalDemoApi.getDocuments('10003')
      const received = docs.filter(d => d.status === 'RECEIVED')
      for (const doc of received) {
        expect(doc.received_date).toBeTruthy()
        // Date should be a valid ISO date string
        expect(new Date(doc.received_date!).toString()).not.toBe('Invalid Date')
      }
    })

    it('Case 1 has no documents', async () => {
      const docs = await portalDemoApi.getDocuments('10001')
      expect(docs).toHaveLength(0)
    })
  })

  describe('Status history', () => {
    it('Case 2 has exactly 2 transitions: DRAFT then SUBMITTED', async () => {
      const hist = await portalDemoApi.getStatusHistory('10002')
      expect(hist).toHaveLength(2)
      expect(hist[0].to_status).toBe('DRAFT')
      expect(hist[1].to_status).toBe('SUBMITTED')
      expect(hist[1].from_status).toBe('DRAFT')
    })

    it('Case 2 transitions have valid changed_by and changed_at', async () => {
      const hist = await portalDemoApi.getStatusHistory('10002')
      for (const h of hist) {
        expect(h.changed_by).toBeTruthy()
        expect(h.changed_at).toBeTruthy()
        expect(new Date(h.changed_at).toString()).not.toBe('Invalid Date')
        expect(h.reason).toBeTruthy()
      }
    })

    it('Case 3 has exactly 5 transitions ending at CALCULATION', async () => {
      const hist = await portalDemoApi.getStatusHistory('10003')
      expect(hist).toHaveLength(5)
      expect(hist[hist.length - 1].to_status).toBe('CALCULATION')
    })

    it('Case 3 status transitions are valid sequences', async () => {
      const hist = await portalDemoApi.getStatusHistory('10003')
      const validStatuses = ['DRAFT', 'SUBMITTED', 'NOTARIZED_RECEIVED', 'ELIGIBILITY_REVIEW', 'CALCULATION']
      for (const h of hist) {
        expect(validStatuses).toContain(h.to_status)
      }
    })

    it('Case 1 has no history', async () => {
      const hist = await portalDemoApi.getStatusHistory('10001')
      expect(hist).toHaveLength(0)
    })
  })

  describe('Messages', () => {
    it('Case 3 has exactly 2 messages', async () => {
      const msgs = await portalDemoApi.getMessages('10003')
      expect(msgs).toHaveLength(2)
    })

    it('Case 3 messages have valid structure', async () => {
      const msgs = await portalDemoApi.getMessages('10003')
      for (const msg of msgs) {
        expect(msg.msg_id).toBeTruthy()
        expect(msg.sender_name).toBeTruthy()
        expect(msg.msg_text.length).toBeGreaterThan(0)
        expect(msg.created_at).toBeTruthy()
        expect(new Date(msg.created_at).toString()).not.toBe('Invalid Date')
        expect(['STAFF', 'MEMBER', 'SYSTEM']).toContain(msg.sender_type)
        expect(['INFO', 'RESPONSE', 'ALERT', 'SYSTEM']).toContain(msg.msg_type)
      }
    })

    it('Case 3 has STAFF and MEMBER messages', async () => {
      const msgs = await portalDemoApi.getMessages('10003')
      const senderTypes = msgs.map(m => m.sender_type)
      expect(senderTypes).toContain('STAFF')
      expect(senderTypes).toContain('MEMBER')
    })

    it('Cases 1 and 2 have no messages', async () => {
      const msgs1 = await portalDemoApi.getMessages('10001')
      const msgs2 = await portalDemoApi.getMessages('10002')
      expect(msgs1).toHaveLength(0)
      expect(msgs2).toHaveLength(0)
    })
  })
})
