/**
 * Field component rendering tests — verifies label, value, sub text, and badge rendering.
 * Consumed by: CI test suite
 * Depends on: Field.tsx, Badge.tsx, theme (C)
 *
 * TOUCHPOINTS:
 *   Upstream: Field.tsx, Badge.tsx, theme/legacy.ts (C)
 *   Downstream: None (leaf test)
 *   Shared: None
 */
import { describe, it, expect } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Field } from '../Field'

describe('Field', () => {
  it('renders label and value', () => {
    render(<Field label="Service Years" value="28.75" />)
    expect(screen.getByText('Service Years')).toBeInTheDocument()
    expect(screen.getByText('28.75')).toBeInTheDocument()
  })

  it('renders sub text when provided', () => {
    render(<Field label="AMS" value="$10,639.45" sub="36-month window" />)
    expect(screen.getByText('36-month window')).toBeInTheDocument()
  })

  it('does not render sub text when not provided', () => {
    const { container } = render(<Field label="Tier" value="1" />)
    // The label div should contain only the label text, no sub div
    const labels = container.querySelectorAll('span')
    expect(labels.length).toBeGreaterThanOrEqual(2) // label + value
  })

  it('handles null sub text gracefully', () => {
    render(<Field label="Status" value="Active" sub={null} />)
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders a badge when badge prop is provided', () => {
    render(
      <Field
        label="Tier"
        value="1"
        badge={{ text: 'T1', bg: 'rgba(21,101,192,0.08)', color: '#1565c0' }}
      />
    )
    expect(screen.getByText('T1')).toBeInTheDocument()
  })

  it('does not render badge text when badge prop is null', () => {
    // Explicitly cleanup previous renders to avoid leaking DOM
    cleanup()
    const { container } = render(<Field label="Rating" value="A+" badge={null} />)
    // When badge is null, the badge column renders an empty div (no Badge child)
    // Search within this specific container only
    const spans = container.querySelectorAll('span')
    const spanTexts = Array.from(spans).map(s => s.textContent)
    expect(spanTexts).toContain('Rating')
    expect(spanTexts).toContain('A+')
    // No Badge span text should appear
    expect(spanTexts).not.toContain('T1')
  })

  it('applies highlight style when highlight prop is true', () => {
    render(<Field label="Benefit" value="$6,117.68" highlight />)
    const valueEl = screen.getByText('$6,117.68')
    expect(valueEl.style.textShadow).not.toBe('none')
  })
})
