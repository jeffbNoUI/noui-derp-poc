/**
 * F01 Retirement Application — custom component redirect to existing ApplicationWizard.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f01RetirementApplication: FormDefinition = {
  formId: 'F01',
  formName: 'Retirement Application',
  formDescription: 'Apply for service or early retirement benefits. This uses the full guided application wizard.',
  processType: 'retirement',
  steps: [],
  estimatedMinutes: 20,
  customComponent: true,
}
