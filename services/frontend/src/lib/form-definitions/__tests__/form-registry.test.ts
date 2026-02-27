/**
 * Form registry tests — validates all 20 form definitions conform to expected structure.
 * Checks: existence, required fields, unique field keys, valid conditionalOn references.
 * Consumed by: CI test suite
 * Depends on: FORM_REGISTRY, FormDefinition types
 *
 * TOUCHPOINTS:
 *   Upstream: all f01–f20 definition files, FORM_REGISTRY barrel
 *   Downstream: None (leaf test)
 *   Shared: FormDefinition, FormFieldDef, FormStepDef types
 */
import { describe, it, expect } from 'vitest'
import { FORM_REGISTRY } from '@/lib/form-definitions'
import type { FormFieldDef } from '@/types/FormDefinition'

const ALL_FORM_IDS = [
  'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08', 'F09', 'F10',
  'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20',
]

describe('Form Registry', () => {

  it('contains all 20 form definitions', () => {
    expect(Object.keys(FORM_REGISTRY)).toHaveLength(20)
    for (const id of ALL_FORM_IDS) {
      expect(FORM_REGISTRY[id]).toBeDefined()
    }
  })

  for (const id of ALL_FORM_IDS) {
    describe(`Form ${id}`, () => {

      it('has required top-level fields', () => {
        const def = FORM_REGISTRY[id]
        expect(def.formId).toBe(id)
        expect(def.formName).toBeTruthy()
        expect(def.formDescription).toBeTruthy()
        expect(def.processType).toBeTruthy()
        expect(def.estimatedMinutes).toBeGreaterThan(0)
        expect(Array.isArray(def.steps)).toBe(true)
      })

      it('has steps with fields (unless customComponent)', () => {
        const def = FORM_REGISTRY[id]
        if (def.customComponent) {
          // F01 routes to existing ApplicationWizard — steps can be empty
          expect(def.customComponent).toBe(true)
          return
        }
        expect(def.steps.length).toBeGreaterThan(0)
        for (const step of def.steps) {
          expect(step.id).toBeTruthy()
          expect(step.title).toBeTruthy()
          expect(step.description).toBeTruthy()
          expect(Array.isArray(step.fields)).toBe(true)
          expect(step.fields.length).toBeGreaterThan(0)
        }
      })

      it('has unique field keys within the form', () => {
        const def = FORM_REGISTRY[id]
        if (def.customComponent) return

        const allKeys: string[] = []
        const collectKeys = (fields: FormFieldDef[]) => {
          for (const f of fields) {
            // section_header and info_block use descriptive keys, still must be unique
            allKeys.push(f.key)
            if (f.groupFields) {
              collectKeys(f.groupFields)
            }
          }
        }
        for (const step of def.steps) {
          collectKeys(step.fields)
        }

        const dupes = allKeys.filter((k, i) => allKeys.indexOf(k) !== i)
        expect(dupes).toEqual([])
      })

      it('conditionalOn references point to valid field keys', () => {
        const def = FORM_REGISTRY[id]
        if (def.customComponent) return

        // Collect all top-level field keys across all steps
        const allKeys = new Set<string>()
        for (const step of def.steps) {
          for (const f of step.fields) {
            allKeys.add(f.key)
          }
        }

        // Check conditionalOn references
        for (const step of def.steps) {
          for (const f of step.fields) {
            if (f.conditionalOn) {
              expect(
                allKeys.has(f.conditionalOn.field),
                `Field "${f.key}" references unknown conditionalOn field "${f.conditionalOn.field}" in ${id}`
              ).toBe(true)
            }
          }
        }
      })
    })
  }

  it('F01 has customComponent: true', () => {
    expect(FORM_REGISTRY['F01'].customComponent).toBe(true)
  })

  it('all non-F01 forms have at least one step', () => {
    for (const id of ALL_FORM_IDS.filter(id => id !== 'F01')) {
      expect(FORM_REGISTRY[id].steps.length).toBeGreaterThan(0)
    }
  })
})
