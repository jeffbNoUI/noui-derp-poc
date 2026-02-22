/**
 * Theme barrel export verification — ensures all expected symbols are
 * re-exported from @/theme. Catches accidental removal during refactoring.
 * Tests: legacy theme (C, tierMeta, fmt), new theme system (types, themes, provider)
 */
import { describe, it, expect } from 'vitest'
import { C, tierMeta, fmt, memberTheme, staffTheme, ThemeProvider, useTheme } from './index'

describe('Theme Barrel Exports', () => {
  describe('Legacy theme', () => {
    it('exports C color object with expected keys', () => {
      expect(C).toBeDefined()
      expect(C.bg).toBe('#0B1017')
      expect(C.accent).toBe('#22D3EE')
      expect(C.text).toBe('#E2E8F0')
    })

    it('exports tierMeta with 3 tiers', () => {
      expect(tierMeta).toBeDefined()
      expect(tierMeta[1]).toBeDefined()
      expect(tierMeta[2]).toBeDefined()
      expect(tierMeta[3]).toBeDefined()
      expect(tierMeta[1].label).toBe('Tier 1')
    })

    it('exports fmt function (delegates to @/lib/constants)', () => {
      expect(typeof fmt).toBe('function')
      expect(fmt(100)).toBe('$100.00')
      expect(fmt(null)).toBe('—')
    })
  })

  describe('New theme system', () => {
    it('exports memberTheme with light surface', () => {
      expect(memberTheme).toBeDefined()
      expect(memberTheme.id).toBe('member')
      expect(memberTheme.layout).toBe('topnav')
      expect(memberTheme.density).toBe('comfortable')
    })

    it('exports staffTheme with dark surface', () => {
      expect(staffTheme).toBeDefined()
      expect(staffTheme.id).toBe('staff')
      expect(staffTheme.layout).toBe('sidebar')
      expect(staffTheme.density).toBe('high')
    })

    it('exports ThemeProvider and useTheme', () => {
      expect(ThemeProvider).toBeDefined()
      expect(useTheme).toBeDefined()
      expect(typeof ThemeProvider).toBe('function')
      expect(typeof useTheme).toBe('function')
    })

    it('both themes have consistent structure', () => {
      const keys = Object.keys(memberTheme).sort()
      const staffKeys = Object.keys(staffTheme).sort()
      expect(keys).toEqual(staffKeys)
    })
  })
})
