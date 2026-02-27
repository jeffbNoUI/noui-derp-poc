/**
 * F19 Common Law Marriage Affidavit — declare common law marriage for benefit purposes.
 * Consumed by: FORM_REGISTRY
 * Depends on: FormDefinition type
 */
import type { FormDefinition } from '@/types/FormDefinition'

export const f19CommonLawAffidavit: FormDefinition = {
  formId: 'F19',
  formName: 'Common Law Marriage Affidavit',
  formDescription: 'Declare a common law marriage for retirement benefit and survivor benefit purposes.',
  processType: 'life-change',
  estimatedMinutes: 10,
  steps: [
    {
      id: 'parties',
      title: 'Party Information',
      description: 'Identify both parties to the common law marriage.',
      fields: [
        { key: 'section_member', type: 'section_header', label: 'DERP Member' },
        { key: 'member_name', type: 'display', label: 'Member Name', prepopulateFrom: 'member.full_name', readOnly: true },
        { key: 'member_dob', type: 'display', label: 'Date of Birth', prepopulateFrom: 'member.dob', readOnly: true },
        { key: 'section_spouse', type: 'section_header', label: 'Common Law Spouse' },
        { key: 'spouse_name', type: 'text', label: 'Spouse Full Legal Name', required: true },
        { key: 'spouse_dob', type: 'date', label: 'Spouse Date of Birth', required: true },
        { key: 'spouse_address', type: 'address', label: 'Spouse Address (if different from member)' },
      ],
    },
    {
      id: 'relationship-facts',
      title: 'Relationship Facts',
      description: 'Establish the common law marriage.',
      fields: [
        { key: 'cohabitation_date', type: 'date', label: 'Date You Began Cohabiting', required: true },
        { key: 'mutual_agreement', type: 'checkbox', label: 'We have mutually agreed to be married', required: true },
        { key: 'hold_out', type: 'checkbox', label: 'We hold ourselves out to the public as married', required: true },
        { key: 'shared_residence', type: 'checkbox', label: 'We share a common residence', required: true },
        { key: 'shared_finances', type: 'checkbox', label: 'We share financial responsibilities', required: true },
      ],
      canContinue: (state) => !!state.mutual_agreement && !!state.hold_out && !!state.shared_residence,
    },
    {
      id: 'supporting-docs',
      title: 'Supporting Documentation',
      description: 'Upload evidence of common law marriage.',
      fields: [
        { key: 'info_docs', type: 'info_block', label: 'Accepted Documentation', infoText: 'Joint bank accounts, joint property ownership, shared insurance policies, joint tax returns, or affidavits from third parties who recognize you as married.' },
        { key: 'doc_upload_1', type: 'file_upload', label: 'Supporting Document 1' },
        { key: 'doc_upload_2', type: 'file_upload', label: 'Supporting Document 2' },
      ],
    },
    {
      id: 'signatures',
      title: 'Joint Signatures',
      description: 'Both parties must sign this affidavit.',
      fields: [
        { key: 'info_notarize', type: 'info_block', label: 'Notarization Required', infoText: 'This affidavit must be notarized. After electronic submission, print the completed form and have it notarized before submitting the original to DERP.' },
        { key: 'member_esign', type: 'esign', label: 'Member Signature', required: true },
        { key: 'spouse_esign', type: 'esign', label: 'Spouse Signature', required: true },
      ],
      canContinue: (state) => !!state.member_esign && !!state.spouse_esign,
    },
  ],
}
