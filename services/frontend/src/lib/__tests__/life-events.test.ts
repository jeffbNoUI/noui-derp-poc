/**
 * Life events tests — validates all 7 events have required fields, form resolvers
 * return valid form IDs, and triage answer combinations produce correct form bundles.
 * Consumed by: CI test suite
 * Depends on: LIFE_EVENTS, getLifeEvent, FORM_REGISTRY
 *
 * TOUCHPOINTS:
 *   Upstream: life-events.ts, FORM_REGISTRY barrel
 *   Downstream: None (leaf test)
 *   Shared: LifeEventDef types, FORM_REGISTRY keys
 */
import { describe, it, expect } from 'vitest'
import { LIFE_EVENTS, getLifeEvent } from '@/lib/life-events'
import { FORM_REGISTRY } from '@/lib/form-definitions'

const VALID_FORM_IDS = new Set(Object.keys(FORM_REGISTRY))

describe('Life Events', () => {

  it('defines exactly 7 life events', () => {
    expect(LIFE_EVENTS).toHaveLength(7)
  })

  const expectedIds = ['retirement', 'death', 'divorce', 'disability', 'leaving', 'life-change', 'account']

  it('has all expected event IDs', () => {
    const ids = LIFE_EVENTS.map(e => e.eventId)
    for (const id of expectedIds) {
      expect(ids).toContain(id)
    }
  })

  for (const event of LIFE_EVENTS) {
    describe(`Event: ${event.eventId}`, () => {

      it('has all required fields', () => {
        expect(event.eventId).toBeTruthy()
        expect(event.title).toBeTruthy()
        expect(event.description).toBeTruthy()
        expect(event.iconLabel).toBeTruthy()
        expect(event.color).toMatch(/^#/)
        expect(event.colorBg).toMatch(/^#/)
        expect(Array.isArray(event.triage)).toBe(true)
        expect(typeof event.formResolver).toBe('function')
      })

      it('triage questions have valid structure', () => {
        for (const q of event.triage) {
          expect(q.id).toBeTruthy()
          expect(q.question).toBeTruthy()
          expect(['radio', 'checkbox']).toContain(q.type)
          expect(q.options.length).toBeGreaterThanOrEqual(2)
          for (const opt of q.options) {
            expect(opt.value).toBeTruthy()
            expect(opt.label).toBeTruthy()
          }
        }
      })

      it('formResolver returns only valid FORM_REGISTRY keys', () => {
        // Test with empty answers (default case)
        const defaultForms = event.formResolver({})
        for (const fid of defaultForms) {
          expect(VALID_FORM_IDS.has(fid), `${event.eventId} resolver returned unknown form ID: ${fid}`).toBe(true)
        }

        // Test all triage answer combinations
        if (event.triage.length > 0) {
          const combos = generateCombinations(event.triage)
          for (const answers of combos) {
            const forms = event.formResolver(answers)
            expect(forms.length).toBeGreaterThan(0)
            for (const fid of forms) {
              expect(VALID_FORM_IDS.has(fid), `${event.eventId} with ${JSON.stringify(answers)} returned unknown form: ${fid}`).toBe(true)
            }
          }
        }
      })
    })
  }

  describe('Retirement event triage logic', () => {
    const event = LIFE_EVENTS.find(e => e.eventId === 'retirement')!

    it('single + no insurance → only F01', () => {
      const forms = event.formResolver({ marital_status: 'single', insurance_interest: 'no' })
      expect(forms).toEqual(['F01'])
    })

    it('married → adds F02', () => {
      const forms = event.formResolver({ marital_status: 'married', insurance_interest: 'no' })
      expect(forms).toContain('F01')
      expect(forms).toContain('F02')
    })

    it('insurance interest → adds F13', () => {
      const forms = event.formResolver({ marital_status: 'single', insurance_interest: 'yes' })
      expect(forms).toContain('F01')
      expect(forms).toContain('F13')
    })

    it('married + insurance → F01, F02, F13', () => {
      const forms = event.formResolver({ marital_status: 'married', insurance_interest: 'yes' })
      expect(forms).toEqual(expect.arrayContaining(['F01', 'F02', 'F13']))
    })
  })

  describe('Divorce event triage logic', () => {
    const event = LIFE_EVENTS.find(e => e.eventId === 'divorce')!

    it('member role → F04, F05, F06, F07', () => {
      const forms = event.formResolver({ party_role: 'member' })
      expect(forms).toEqual(expect.arrayContaining(['F04', 'F05', 'F06', 'F07']))
      expect(forms).not.toContain('F08')
      expect(forms).not.toContain('F09')
    })

    it('former spouse role → F04, F05, F06, F08, F09', () => {
      const forms = event.formResolver({ party_role: 'former_spouse' })
      expect(forms).toEqual(expect.arrayContaining(['F04', 'F05', 'F06', 'F08', 'F09']))
      expect(forms).not.toContain('F07')
    })
  })

  describe('Life change event triage logic', () => {
    const event = LIFE_EVENTS.find(e => e.eventId === 'life-change')!

    it('marriage → F19, F03', () => {
      expect(event.formResolver({ change_type: 'marriage' })).toEqual(['F19', 'F03'])
    })

    it('beneficiary → F03', () => {
      expect(event.formResolver({ change_type: 'beneficiary' })).toEqual(['F03'])
    })

    it('insurance enroll → F13', () => {
      expect(event.formResolver({ change_type: 'insurance_enroll' })).toEqual(['F13'])
    })

    it('insurance cancel → F14', () => {
      expect(event.formResolver({ change_type: 'insurance_cancel' })).toEqual(['F14'])
    })
  })

  describe('getLifeEvent helper', () => {
    it('returns event by ID', () => {
      const event = getLifeEvent('retirement')
      expect(event).toBeDefined()
      expect(event!.title).toBe("I'm Ready to Retire")
    })

    it('returns undefined for unknown ID', () => {
      expect(getLifeEvent('nonexistent')).toBeUndefined()
    })
  })
})

// Helper: generate all combinations of triage answers
function generateCombinations(triage: { id: string; options: { value: string }[] }[]): Record<string, string>[] {
  if (triage.length === 0) return [{}]
  const [first, ...rest] = triage
  const restCombos = generateCombinations(rest)
  const results: Record<string, string>[] = []
  for (const opt of first.options) {
    for (const combo of restCombos) {
      results.push({ [first.id]: opt.value, ...combo })
    }
  }
  return results
}
