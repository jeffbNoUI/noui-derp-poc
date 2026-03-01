/**
 * Form definition types — schema-driven form rendering for all COPERA forms.
 * Consumed by: FormWizard, form-definitions/, LifeEventFlow
 * Depends on: Nothing (pure type definitions)
 */

export type FieldType =
  | 'text' | 'display' | 'date' | 'phone' | 'email' | 'address' | 'ssn'
  | 'radio' | 'checkbox' | 'select' | 'textarea'
  | 'file_upload' | 'currency' | 'esign'
  | 'repeating_group' | 'section_header' | 'info_block'

export interface FormFieldDef {
  key: string
  type: FieldType
  label: string
  required?: boolean
  helpText?: string
  options?: { value: string; label: string }[]
  prepopulateFrom?: string
  readOnly?: boolean
  conditionalOn?: { field: string; operator: 'equals' | 'not_equals' | 'truthy'; value?: string | boolean }
  validation?: { minLength?: number; maxLength?: number; pattern?: string }
  groupFields?: FormFieldDef[]
  infoText?: string
}

export interface FormStepDef {
  id: string
  title: string
  description: string
  fields: FormFieldDef[]
  canContinue?: (state: Record<string, unknown>) => boolean
}

export interface FormDefinition {
  formId: string
  formName: string
  formDescription: string
  processType: string
  steps: FormStepDef[]
  estimatedMinutes: number
  customComponent?: boolean
}
