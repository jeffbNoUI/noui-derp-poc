/**
 * Cross-portal integration tests — verifies all 4 portals are linked, demo data
 * is consistent across portals, and shared member IDs resolve in each domain.
 * Consumed by: CI test suite
 * Depends on: demo-data.ts, employer-demo-data.ts, vendor-demo-data.ts, portal-demo-data.ts, PortalSwitcher
 *
 * TOUCHPOINTS:
 *   Upstream: PortalSwitcher.tsx, demo-data.ts, employer-demo-data.ts, vendor-demo-data.ts, portal-demo-data.ts
 *   Downstream: None (leaf test)
 *   Shared: renderWithRouter (test-utils)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { cleanup, within } from '@testing-library/react'
import { renderWithRouter } from '@/test-utils'
import { PortalSwitcher } from '@/pages/PortalSwitcher'
import { demoApi } from '@/api/demo-data'
import { DEMO_EMPLOYER_EMPLOYEES } from '@/api/employer-demo-data'
import { DEMO_ENROLLMENT_QUEUE, DEMO_IPR_VERIFICATIONS } from '@/api/vendor-demo-data'
import { DEMO_CASES, DEMO_REFUND_CASES, DEMO_DEATH_CASES } from '@/lib/constants'

beforeEach(() => { cleanup() })

describe('Cross-Portal Integration', () => {

  describe('PortalSwitcher renders all 4 portals', () => {
    it('shows all 4 core workspace cards', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Staff Portal')).toBeInTheDocument()
      expect(view.getByText('Member Portal')).toBeInTheDocument()
      expect(view.getByText('Employer Portal')).toBeInTheDocument()
      expect(view.getByText('Vendor Portal')).toBeInTheDocument()
    })

    it('each portal card has a distinct subtitle', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Benefits Analyst Workspace')).toBeInTheDocument()
      expect(view.getByText(/Your Retirement Journey/)).toBeInTheDocument()
      expect(view.getByText('Department Reporting')).toBeInTheDocument()
      expect(view.getByText('Insurance Enrollment')).toBeInTheDocument()
    })
  })

  describe('Demo data consistency — shared member IDs', () => {
    it('retirement cases exist in staff demo data', async () => {
      for (const c of DEMO_CASES) {
        const member = await demoApi.getMember(c.id)
        expect(member).toBeDefined()
        expect(member!.last_name).toBeTruthy()
      }
    })

    it('employer employees include retirement case members', () => {
      const employerIds = DEMO_EMPLOYER_EMPLOYEES.map(e => e.member_id)
      // Cases 1, 2, 3 should appear in employer roster
      expect(employerIds).toContain('10001') // Robert Martinez
      expect(employerIds).toContain('10002') // Jennifer Kim
      expect(employerIds).toContain('10003') // David Washington
    })

    it('vendor enrollment queue includes retirement case members', () => {
      const vendorIds = DEMO_ENROLLMENT_QUEUE.map(e => e.member_id)
      expect(vendorIds).toContain('10001') // Robert Martinez
      expect(vendorIds).toContain('10002') // Jennifer Kim
      expect(vendorIds).toContain('10003') // David Washington
    })

    it('vendor IPR verifications match enrolled members', () => {
      const iprIds = Object.keys(DEMO_IPR_VERIFICATIONS)
      expect(iprIds).toContain('10001')
      expect(iprIds).toContain('10002')
      expect(iprIds).toContain('10003')
    })

    it('refund cases use distinct member IDs from retirement', () => {
      const retirementIds = DEMO_CASES.map(c => c.id)
      for (const rc of DEMO_REFUND_CASES) {
        expect(retirementIds).not.toContain(rc.id)
      }
    })

    it('death cases use distinct member IDs from retirement and refund', () => {
      const retirementIds = DEMO_CASES.map(c => c.id)
      const refundIds = DEMO_REFUND_CASES.map(c => c.id)
      for (const dc of DEMO_DEATH_CASES) {
        expect(retirementIds).not.toContain(dc.id)
        expect(refundIds).not.toContain(dc.id)
      }
    })
  })

  describe('Member name consistency across portals', () => {
    it('Robert Martinez name matches across employer and vendor data', () => {
      const employer = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === '10001')
      const vendor = DEMO_ENROLLMENT_QUEUE.find(e => e.member_id === '10001')
      expect(employer?.first_name).toBe('Robert')
      expect(employer?.last_name).toBe('Martinez')
      expect(vendor?.member_name).toContain('Martinez')
    })

    it('Jennifer Kim name matches across employer and vendor data', () => {
      const employer = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === '10002')
      const vendor = DEMO_ENROLLMENT_QUEUE.find(e => e.member_id === '10002')
      expect(employer?.first_name).toBe('Jennifer')
      expect(employer?.last_name).toBe('Kim')
      expect(vendor?.member_name).toContain('Kim')
    })

    it('David Washington name matches across employer and vendor data', () => {
      const employer = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === '10003')
      const vendor = DEMO_ENROLLMENT_QUEUE.find(e => e.member_id === '10003')
      expect(employer?.first_name).toBe('David')
      expect(employer?.last_name).toBe('Washington')
      expect(vendor?.member_name).toContain('Washington')
    })
  })

  describe('Tier consistency across portals', () => {
    it('member tiers match between employer and vendor data', () => {
      for (const memberId of ['10001', '10002', '10003']) {
        const employer = DEMO_EMPLOYER_EMPLOYEES.find(e => e.member_id === memberId)
        const vendor = DEMO_ENROLLMENT_QUEUE.find(e => e.member_id === memberId)
        expect(employer?.tier).toBe(vendor?.tier)
      }
    })
  })

  describe('Process type coverage', () => {
    it('retirement has 4 demo cases', () => {
      expect(DEMO_CASES).toHaveLength(4)
    })

    it('refund has 2 demo cases', () => {
      expect(DEMO_REFUND_CASES).toHaveLength(2)
    })

    it('death has 2 demo cases', () => {
      expect(DEMO_DEATH_CASES).toHaveLength(2)
    })

    it('all 8 cases use unique member IDs', () => {
      const allIds = [
        ...DEMO_CASES.map(c => c.id),
        ...DEMO_REFUND_CASES.map(c => c.id),
        ...DEMO_DEATH_CASES.map(c => c.id),
      ]
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(allIds.length)
    })
  })
})
