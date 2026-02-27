/**
 * F05 DRO Court Filing Form — information for court order preparation.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f05DroCourtForm: FormDefinition = {
  formId: 'F05',
  formName: 'DRO Court Filing Form',
  formDescription: 'Information required for preparing the court order for benefit division.',
  processType: 'dro',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'court-info',
      title: 'Court Information',
      description: 'Identify the court handling the divorce.',
      fields: [
        { key: 'court_name', type: 'text', label: 'Court Name', required: true, helpText: 'e.g., Denver District Court' },
        { key: 'case_number', type: 'text', label: 'Case Number', required: true },
        { key: 'judge_name', type: 'text', label: 'Judge/Magistrate Name' },
        { key: 'filing_date', type: 'date', label: 'Date of Divorce Filing' },
      ],
    },
    {
      id: 'order-details',
      title: 'Order Details',
      description: 'Specify the type and scope of the court order.',
      fields: [
        { key: 'order_type', type: 'radio', label: 'Type of Order', required: true, options: [
          { value: 'dissolution', label: 'Decree of Dissolution' },
          { value: 'legal_separation', label: 'Legal Separation' },
          { value: 'modification', label: 'Modification of Existing Order' },
        ]},
        { key: 'attorney_member', type: 'text', label: 'Member\u2019s Attorney (if any)' },
        { key: 'attorney_alt_payee', type: 'text', label: 'Alternate Payee\u2019s Attorney (if any)' },
        { key: 'additional_notes', type: 'textarea', label: 'Additional Notes', helpText: 'Any special provisions or requests' },
      ],
    },
  ],
}
