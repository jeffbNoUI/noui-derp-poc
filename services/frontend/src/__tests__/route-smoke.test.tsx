/**
 * Route smoke tests — verifies key page components render without crashing.
 * Wraps each component in MemoryRouter since they use react-router-dom hooks.
 * Uses cleanup() + within(container) to prevent DOM accumulation between tests.
 * Consumed by: CI test suite
 * Depends on: PortalSwitcher, DemoLanding, StaffWelcomeScreen, test-utils
 *
 * TOUCHPOINTS:
 *   Upstream: PortalSwitcher.tsx, DemoLanding.tsx, StaffWelcomeScreen.tsx, constants.ts, theme
 *   Downstream: None (leaf test)
 *   Shared: renderWithRouter (test-utils)
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { cleanup, within } from '@testing-library/react'
import { renderWithRouter } from '@/test-utils'
import { PortalSwitcher } from '@/pages/PortalSwitcher'
import { DemoLanding } from '@/pages/DemoLanding'
import { StaffWelcomeScreen } from '@/pages/StaffWelcomeScreen'

// Ensure DOM is clean before each test to prevent element accumulation
beforeEach(() => { cleanup() })

describe('Route Smoke Tests', () => {

  describe('PortalSwitcher (/)', () => {
    it('renders without crashing', () => {
      renderWithRouter(<PortalSwitcher />)
    })

    it('displays the platform title and sections', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Denver Employees Retirement Plan')).toBeInTheDocument()
      expect(view.getByText('NoUI Platform')).toBeInTheDocument()
    })

    it('renders all three section headers', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Core Workspaces')).toBeInTheDocument()
      expect(view.getByText('Productivity Services')).toBeInTheDocument()
      expect(view.getByText('Platform Intelligence')).toBeInTheDocument()
    })

    it('renders all four core workspace cards', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Staff Portal')).toBeInTheDocument()
      expect(view.getByText('Member Portal')).toBeInTheDocument()
      expect(view.getByText('Employer Portal')).toBeInTheDocument()
      expect(view.getByText('Vendor Portal')).toBeInTheDocument()
    })

    it('renders productivity service cards', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Knowledge Assistant')).toBeInTheDocument()
      expect(view.getByText('Correspondence Composer')).toBeInTheDocument()
      expect(view.getByText('Data Entry Validator')).toBeInTheDocument()
    })

    it('renders platform intelligence cards', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText('Learning Engine')).toBeInTheDocument()
      expect(view.getByText('Workflow Dashboard')).toBeInTheDocument()
      expect(view.getByText('Operational Dashboard')).toBeInTheDocument()
      expect(view.getByText('Data Quality')).toBeInTheDocument()
    })

    it('renders the transparency footer', () => {
      const { container } = renderWithRouter(<PortalSwitcher />)
      const view = within(container)
      expect(view.getByText(/rules engine is configured/i)).toBeInTheDocument()
    })
  })

  describe('DemoLanding (/demo)', () => {
    it('renders without crashing', () => {
      renderWithRouter(<DemoLanding />)
    })

    it('displays the main heading and POC label', () => {
      const { container } = renderWithRouter(<DemoLanding />)
      const view = within(container)
      expect(view.getByText('Staff Processing Workspaces')).toBeInTheDocument()
      expect(view.getByText('NoUI Proof of Concept')).toBeInTheDocument()
    })

    it('renders all three process type sections', () => {
      const { container } = renderWithRouter(<DemoLanding />)
      const view = within(container)
      expect(view.getByText('Retirement Application')).toBeInTheDocument()
      expect(view.getByText('Contribution Refund')).toBeInTheDocument()
      expect(view.getByText('Death & Survivor Benefits')).toBeInTheDocument()
    })

    it('renders case count badges', () => {
      const { container } = renderWithRouter(<DemoLanding />)
      const view = within(container)
      expect(view.getByText('4 Cases')).toBeInTheDocument()
      expect(view.getAllByText('2 Cases')).toHaveLength(2)
    })

    it('renders the role selector with default Benefits Analyst', () => {
      const { container } = renderWithRouter(<DemoLanding />)
      const view = within(container)
      expect(view.getByText('Role:')).toBeInTheDocument()
      expect(view.getByDisplayValue('Benefits Analyst')).toBeInTheDocument()
    })

    it('renders demo case names', () => {
      const { container } = renderWithRouter(<DemoLanding />)
      const view = within(container)
      expect(view.getByText('Robert Martinez + DRO')).toBeInTheDocument()
      expect(view.getByText('Jennifer Kim')).toBeInTheDocument()
      expect(view.getByText('David Washington')).toBeInTheDocument()
      expect(view.getByText('Maria Santos')).toBeInTheDocument()
      expect(view.getByText('Thomas Chen')).toBeInTheDocument()
      expect(view.getByText('Margaret Thompson')).toBeInTheDocument()
      expect(view.getByText('James Rivera')).toBeInTheDocument()
    })

    it('renders secondary link buttons', () => {
      const { container } = renderWithRouter(<DemoLanding />)
      const view = within(container)
      expect(view.getAllByText('Data Quality').length).toBeGreaterThanOrEqual(1)
      expect(view.getByText('Population Analysis')).toBeInTheDocument()
      expect(view.getByText('Full Platform')).toBeInTheDocument()
    })
  })

  describe('StaffWelcomeScreen (/staff)', () => {
    it('renders without crashing', () => {
      renderWithRouter(<StaffWelcomeScreen />)
    })

    it('displays the Staff Workspace title and phase', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getByText('Staff Workspace')).toBeInTheDocument()
      expect(view.getByText('Phase 1: Transparent')).toBeInTheDocument()
    })

    it('renders retirement application section with 4 Cases badge', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getByText('Retirement Application')).toBeInTheDocument()
      expect(view.getByText('4 Cases')).toBeInTheDocument()
    })

    it('renders contribution refund and death & survivor sections', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getByText('Contribution Refund')).toBeInTheDocument()
      expect(view.getByText('Death & Survivor Benefits')).toBeInTheDocument()
      expect(view.getAllByText('2 Cases').length).toBeGreaterThanOrEqual(2)
    })

    it('renders mode toggle (Expert/Guided)', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getByText('Expert')).toBeInTheDocument()
      expect(view.getByText('Guided')).toBeInTheDocument()
    })

    it('renders all demo case names', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getAllByText('Robert Martinez').length).toBeGreaterThanOrEqual(1)
      expect(view.getByText('Jennifer Kim')).toBeInTheDocument()
      expect(view.getByText('David Washington')).toBeInTheDocument()
      expect(view.getByText('Maria Santos')).toBeInTheDocument()
      expect(view.getByText('Thomas Chen')).toBeInTheDocument()
      expect(view.getByText('Margaret Thompson')).toBeInTheDocument()
      expect(view.getByText('James Rivera')).toBeInTheDocument()
    })

    it('renders quick action buttons', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getByText(/Compare Cases/)).toBeInTheDocument()
      expect(view.getByText(/Start Guided Tour/)).toBeInTheDocument()
    })

    it('renders the transparency footer', () => {
      const { container } = renderWithRouter(<StaffWelcomeScreen />)
      const view = within(container)
      expect(view.getByText(/rules engine is configured/i)).toBeInTheDocument()
    })
  })

  describe('Module exports', () => {
    it('PortalSwitcher is a function component', () => {
      expect(typeof PortalSwitcher).toBe('function')
    })

    it('DemoLanding is a function component', () => {
      expect(typeof DemoLanding).toBe('function')
    })

    it('StaffWelcomeScreen is a function component', () => {
      expect(typeof StaffWelcomeScreen).toBe('function')
    })
  })
})
