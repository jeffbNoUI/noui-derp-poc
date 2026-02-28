/**
 * CSV export utility tests — verifies header/row generation and RFC 4180 escaping.
 * Consumed by: vitest
 * Depends on: csv-export.ts
 */
import { describe, it, expect } from 'vitest'
import { generateCSV } from '../csv-export'

describe('generateCSV', () => {
  it('generates basic CSV with headers and rows', () => {
    const csv = generateCSV(['Name', 'Age'], [['Alice', '30'], ['Bob', '25']])
    expect(csv).toBe('Name,Age\nAlice,30\nBob,25')
  })

  it('escapes cells containing commas', () => {
    const csv = generateCSV(['Name', 'Location'], [['Smith, John', 'Denver']])
    expect(csv).toBe('Name,Location\n"Smith, John",Denver')
  })

  it('escapes cells containing double quotes', () => {
    const csv = generateCSV(['Title'], [['The "Big" One']])
    expect(csv).toBe('Title\n"The ""Big"" One"')
  })

  it('escapes cells containing newlines', () => {
    const csv = generateCSV(['Notes'], [['Line 1\nLine 2']])
    expect(csv).toBe('Notes\n"Line 1\nLine 2"')
  })

  it('handles empty rows array', () => {
    const csv = generateCSV(['A', 'B'], [])
    expect(csv).toBe('A,B')
  })

  it('handles single column', () => {
    const csv = generateCSV(['ID'], [['1'], ['2'], ['3']])
    expect(csv).toBe('ID\n1\n2\n3')
  })

  it('handles empty string cells', () => {
    const csv = generateCSV(['A', 'B'], [['', 'x'], ['y', '']])
    expect(csv).toBe('A,B\n,x\ny,')
  })
})
