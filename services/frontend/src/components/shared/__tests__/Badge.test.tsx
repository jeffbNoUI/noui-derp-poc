/**
 * Badge component rendering tests — verifies text content, color, and background styling.
 * Consumed by: CI test suite
 * Depends on: Badge.tsx (pure presentational component)
 *
 * TOUCHPOINTS:
 *   Upstream: Badge.tsx
 *   Downstream: None (leaf test)
 *   Shared: None
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders the text content', () => {
    render(<Badge text="Tier 1" color="#1565c0" bg="rgba(21,101,192,0.08)" />)
    expect(screen.getByText('Tier 1')).toBeInTheDocument()
  })

  it('applies provided color and background styles', () => {
    render(<Badge text="Active" color="#00796b" bg="rgba(0,121,107,0.08)" />)
    const badge = screen.getByText('Active')
    // jsdom normalizes hex to rgb — accept either format
    expect(badge.style.color === '#00796b' || badge.style.color === 'rgb(0, 121, 107)').toBe(true)
    expect(badge.style.background).toBeTruthy()
  })

  it('handles empty string text without crashing', () => {
    const { container } = render(<Badge text="" color="#000" bg="#fff" />)
    // Should render the span element even with empty text
    const span = container.querySelector('span')
    expect(span).not.toBeNull()
    expect(span!.textContent).toBe('')
  })

  it('renders as inline-block span', () => {
    render(<Badge text="Test" color="#000" bg="#fff" />)
    const badge = screen.getByText('Test')
    expect(badge.tagName).toBe('SPAN')
    expect(badge.style.display).toBe('inline-block')
  })

  it('applies uppercase text transform', () => {
    render(<Badge text="test" color="#000" bg="#fff" />)
    const badge = screen.getByText('test')
    expect(badge.style.textTransform).toBe('uppercase')
  })
})
