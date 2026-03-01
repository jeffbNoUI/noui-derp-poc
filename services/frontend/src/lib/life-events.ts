/**
 * Life event definitions — triage questions and form resolver logic for 7 life events.
 * Maps member life situations ("I'm going through a divorce") to required form bundles.
 * Consumed by: LifeEventHub, LifeEventFlow
 * Depends on: LifeEvent types, FORM_REGISTRY (for validation)
 */
import type { LifeEventDef } from '@/types/LifeEvent'

export const LIFE_EVENTS: LifeEventDef[] = [
  {
    eventId: 'retirement',
    title: "I'm Ready to Retire",
    description: 'Start your retirement application, choose benefit options, and enroll in insurance.',
    iconLabel: 'R',
    color: '#00796b',
    colorBg: '#e0f2f1',
    triage: [
      {
        id: 'marital_status',
        question: 'What is your current marital status?',
        type: 'radio',
        options: [
          { value: 'married', label: 'Married', helpText: 'Spousal consent form will be included' },
          { value: 'single', label: 'Single / Divorced / Widowed' },
        ],
      },
      {
        id: 'insurance_interest',
        question: 'Are you interested in Colorado PERA health insurance?',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes, I want to learn about coverage options' },
          { value: 'no', label: 'No, I have other coverage' },
        ],
      },
    ],
    formResolver: (answers) => {
      const forms = ['F01']
      if (answers.marital_status === 'married') forms.push('F02')
      if (answers.insurance_interest === 'yes') forms.push('F13')
      return forms
    },
  },
  {
    eventId: 'death',
    title: "I've Lost a Loved One",
    description: 'Apply for survivor benefits, death benefit, or claim unpaid benefits.',
    iconLabel: 'D',
    color: '#1565c0',
    colorBg: '#e3f2fd',
    triage: [
      {
        id: 'deceased_status',
        question: 'Was the member retired or still working?',
        type: 'radio',
        options: [
          { value: 'retired', label: 'Retired (receiving benefits)', helpText: 'Survivor benefit and lump sum death benefit' },
          { value: 'active', label: 'Active employee', helpText: 'Lump sum death benefit and possible refund' },
          { value: 'deferred', label: 'Former employee (not yet retired)', helpText: 'Lump sum death benefit' },
        ],
      },
      {
        id: 'relationship',
        question: 'What is your relationship to the deceased?',
        type: 'radio',
        options: [
          { value: 'spouse', label: 'Spouse or domestic partner' },
          { value: 'child', label: 'Dependent child' },
          { value: 'beneficiary', label: 'Named beneficiary' },
          { value: 'other', label: 'Other (estate representative, etc.)' },
        ],
      },
    ],
    formResolver: (answers) => {
      const forms: string[] = []
      if (answers.deceased_status === 'retired' && (answers.relationship === 'spouse' || answers.relationship === 'child')) {
        forms.push('F10') // Survivor benefit
      }
      forms.push('F11') // Lump sum death benefit always
      if (answers.deceased_status === 'retired') {
        forms.push('F12') // Unpaid benefit
      }
      return forms
    },
  },
  {
    eventId: 'divorce',
    title: "I'm Going Through a Divorce",
    description: 'Understand how divorce affects your Colorado PERA benefits and complete required forms.',
    iconLabel: 'V',
    color: '#7c3aed',
    colorBg: '#f3e8ff',
    triage: [
      {
        id: 'party_role',
        question: 'Are you the COPERA member or the former spouse?',
        type: 'radio',
        options: [
          { value: 'member', label: 'I am the COPERA member' },
          { value: 'former_spouse', label: 'I am the former spouse / alternate payee' },
        ],
      },
    ],
    formResolver: (answers) => {
      const forms = ['F04', 'F05', 'F06']
      if (answers.party_role === 'member') {
        forms.push('F07')
      } else {
        forms.push('F08')
        forms.push('F09')
      }
      return forms
    },
  },
  {
    eventId: 'disability',
    title: 'I Can No Longer Work',
    description: 'Apply for disability retirement benefits if you cannot perform your job duties.',
    iconLabel: 'B',
    color: '#d97706',
    colorBg: '#fef3c7',
    triage: [],
    formResolver: () => ['F16', 'F17'],
  },
  {
    eventId: 'leaving',
    title: "I'm Leaving City Employment",
    description: 'Learn about your options: contribution refund, deferred benefit, or rollover.',
    iconLabel: 'L',
    color: '#e65100',
    colorBg: '#fff3e0',
    triage: [],
    formResolver: () => ['F15'],
  },
  {
    eventId: 'life-change',
    title: 'Something Has Changed',
    description: 'Update your records for marriage, beneficiary changes, or insurance changes.',
    iconLabel: 'C',
    color: '#16a34a',
    colorBg: '#dcfce7',
    triage: [
      {
        id: 'change_type',
        question: 'What has changed?',
        type: 'radio',
        options: [
          { value: 'marriage', label: 'New marriage or common law marriage' },
          { value: 'beneficiary', label: 'I want to change my beneficiary' },
          { value: 'insurance_enroll', label: 'I want to enroll in health insurance' },
          { value: 'insurance_cancel', label: 'I want to cancel health insurance' },
        ],
      },
    ],
    formResolver: (answers) => {
      switch (answers.change_type) {
        case 'marriage': return ['F19', 'F03']
        case 'beneficiary': return ['F03']
        case 'insurance_enroll': return ['F13']
        case 'insurance_cancel': return ['F14']
        default: return ['F03']
      }
    },
  },
  {
    eventId: 'account',
    title: 'Manage My Account',
    description: 'Request information releases, DROP statements, or other account actions.',
    iconLabel: 'A',
    color: '#475569',
    colorBg: '#f1f5f9',
    triage: [
      {
        id: 'account_need',
        question: 'What do you need?',
        type: 'radio',
        options: [
          { value: 'info_release', label: 'Authorize release of my information to a third party' },
          { value: 'drop_statement', label: 'Request a DROP account statement' },
          { value: 'withdrawal', label: 'Request a contribution withdrawal/refund' },
        ],
      },
    ],
    formResolver: (answers) => {
      switch (answers.account_need) {
        case 'info_release': return ['F18']
        case 'drop_statement': return ['F20']
        case 'withdrawal': return ['F15']
        default: return ['F18']
      }
    },
  },
]

export function getLifeEvent(eventId: string): LifeEventDef | undefined {
  return LIFE_EVENTS.find(e => e.eventId === eventId)
}
