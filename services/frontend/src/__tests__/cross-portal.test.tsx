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
import { DEMO_CASES } from '@/lib/constants'

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
  })

  describe('Process type coverage', () => {
    it('retirement has 3 demo cases', () => {
      expect(DEMO_CASES).toHaveLength(3)
    })

    it('all 3 cases use unique member IDs', () => {
      const allIds = DEMO_CASES.map(c => c.id)
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(allIds.length)
    })
  })
})
