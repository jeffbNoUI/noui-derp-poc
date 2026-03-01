/**
 * Theme barrel export verification — ensures all expected symbols are
 * re-exported from @/theme. Catches accidental removal during refactoring.
 * Tests: legacy theme (C, divisionMeta, fmt), new theme system (types, themes, provider)
 */
import { describe, it, expect } from 'vitest'
import { C, tierMeta, divisionMeta, hasTableMeta, fmt, memberTheme, staffTheme, ThemeProvider, useTheme } from './index'

describe('Theme Barrel Exports', () => {
  describe('Legacy theme', () => {
    it('exports C color object with expected keys', () => {
      expect(C).toBeDefined()
      expect(C.bg).toBe('#f5f7fa')
      expect(C.accent).toBe('#003366')
      expect(C.text).toBe('#1a2233')
    })

    it('exports divisionMeta with 5 divisions', () => {
      expect(divisionMeta).toBeDefined()
      expect(divisionMeta['State']).toBeDefined()
      expect(divisionMeta['School']).toBeDefined()
      expect(divisionMeta['DPS']).toBeDefined()
      expect(divisionMeta['State'].label).toBe('State Division')
      // tierMeta is backward-compat alias for divisionMeta
      expect(tierMeta).toBe(divisionMeta)
    })

    it('exports hasTableMeta with 13 HAS tables', () => {
      expect(hasTableMeta).toBeDefined()
      expect(hasTableMeta[1].name).toBe('PERA 1')
      expect(hasTableMeta[10].name).toBe('DPS 1')
      expect(hasTableMeta[13].name).toBe('DPS 4')
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

    it('exports staffTheme with light surface', () => {
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
