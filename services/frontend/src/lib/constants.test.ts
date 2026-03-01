/**
 * Regression tests for shared constants — ensures single-source-of-truth values
 * remain correct after refactoring. Any change here should be intentional.
 * Tests: DEFAULT_RETIREMENT_DATES, DEMO_CASES, fmt utility
 */
import { describe, it, expect } from 'vitest'
import { DEFAULT_RETIREMENT_DATES, DEMO_CASES, fmt } from './constants'

describe('Shared Constants', () => {
  describe('DEFAULT_RETIREMENT_DATES', () => {
    it('contains all 3 COPERA demo cases', () => {
      expect(Object.keys(DEFAULT_RETIREMENT_DATES)).toEqual(['COPERA-001', 'COPERA-002', 'COPERA-003'])
    })

    it('has correct dates per case', () => {
      expect(DEFAULT_RETIREMENT_DATES['COPERA-001']).toBe('2026-01-01')
      expect(DEFAULT_RETIREMENT_DATES['COPERA-002']).toBe('2026-07-01')
      expect(DEFAULT_RETIREMENT_DATES['COPERA-003']).toBe('2026-06-01')
    })
  })

  describe('DEMO_CASES', () => {
    it('contains exactly 3 cases', () => {
      expect(DEMO_CASES).toHaveLength(3)
    })

    it('has correct IDs in order', () => {
      expect(DEMO_CASES.map(c => c.id)).toEqual(['COPERA-001', 'COPERA-002', 'COPERA-003'])
    })

    it('has correct division and has_table assignments', () => {
      expect(DEMO_CASES[0].division).toBe('State')     // Maria Garcia
      expect(DEMO_CASES[0].has_table).toBe(1)
      expect(DEMO_CASES[1].division).toBe('School')    // James Chen
      expect(DEMO_CASES[1].has_table).toBe(6)
      expect(DEMO_CASES[2].division).toBe('DPS')       // Sarah Williams
      expect(DEMO_CASES[2].has_table).toBe(10)
    })
  })

  describe('fmt — currency formatter', () => {
    it('formats positive numbers with 2 decimal places', () => {
      expect(fmt(6117.68)).toBe('$6,117.68')
      expect(fmt(1000)).toBe('$1,000.00')
      expect(fmt(0)).toBe('$0.00')
    })

    it('returns em dash for null/undefined', () => {
      expect(fmt(null)).toBe('—')
      expect(fmt(undefined)).toBe('—')
    })

    it('handles large numbers', () => {
      expect(fmt(52000)).toBe('$52,000.00')
      expect(fmt(123456.78)).toBe('$123,456.78')
    })

    it('formats fractional cents correctly', () => {
      // fmt should round to 2 decimal places
      expect(fmt(100.005)).toBe('$100.01')
      expect(fmt(100.004)).toBe('$100.00')
    })
  })
})
