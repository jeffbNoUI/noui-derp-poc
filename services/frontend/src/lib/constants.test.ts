/**
 * Regression tests for shared constants — ensures single-source-of-truth values
 * remain correct after refactoring. Any change here should be intentional.
 * Tests: DEFAULT_RETIREMENT_DATES, DEMO_CASES, fmt utility
 */
import { describe, it, expect } from 'vitest'
import { DEFAULT_RETIREMENT_DATES, DEMO_CASES, fmt } from './constants'

describe('Shared Constants', () => {
  describe('DEFAULT_RETIREMENT_DATES', () => {
    it('contains all 4 demo cases', () => {
      expect(Object.keys(DEFAULT_RETIREMENT_DATES)).toEqual(['10001', '10002', '10003', '10004'])
    })

    it('has correct dates per case', () => {
      expect(DEFAULT_RETIREMENT_DATES['10001']).toBe('2026-04-01')
      expect(DEFAULT_RETIREMENT_DATES['10002']).toBe('2026-05-01')
      expect(DEFAULT_RETIREMENT_DATES['10003']).toBe('2026-04-01')
      expect(DEFAULT_RETIREMENT_DATES['10004']).toBe('2026-04-01')
    })
  })

  describe('DEMO_CASES', () => {
    it('contains exactly 4 cases', () => {
      expect(DEMO_CASES).toHaveLength(4)
    })

    it('has correct IDs in order', () => {
      expect(DEMO_CASES.map(c => c.id)).toEqual(['10001', '10002', '10003', '10004'])
    })

    it('has correct tier assignments', () => {
      expect(DEMO_CASES[0].tier).toBe(1) // Robert Martinez
      expect(DEMO_CASES[1].tier).toBe(2) // Jennifer Kim
      expect(DEMO_CASES[2].tier).toBe(3) // David Washington
      expect(DEMO_CASES[3].tier).toBe(1) // Robert Martinez DRO
    })

    it('only case 4 has DRO suffix', () => {
      const withSuffix = DEMO_CASES.filter(c => 'suffix' in c)
      expect(withSuffix).toHaveLength(1)
      expect(withSuffix[0].id).toBe('10004')
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
