/**
 * Onboarding milestone definitions — 5 milestones tracking analyst adoption.
 * Consumed by: useOnboardingChecklist.ts
 * Depends on: checklist-types.ts
 */
import type { OnboardingMilestone } from './checklist-types'

export const MILESTONES: OnboardingMilestone[] = [
  {
    id: 'process-first-case',
    label: 'Process your first case',
    description: 'Confirm all stages and submit a retirement application.',
    check: (prof) => prof.casesCompleted >= 1,
  },
  {
    id: 'try-expert-mode',
    label: 'Try Expert mode',
    description: 'Switch to Expert mode to see all stages at once.',
    check: (_prof, flags) => flags.triedExpert,
  },
  {
    id: 'use-what-if',
    label: 'Explore a What If scenario',
    description: 'Open the What If section in the Learning Module.',
    check: (_prof, flags) => flags.usedWhatIf,
  },
  {
    id: 'confirm-all-stages',
    label: 'Confirm all stages in one session',
    description: 'Work through every stage and confirm each one.',
    // Approximation: at least 8 distinct stages confirmed at least once
    check: (prof) => Object.keys(prof.stageConfirmations).length >= 8,
  },
  {
    id: 'toggle-layer',
    label: 'Toggle a Learning Module layer',
    description: 'Turn onboarding, rules, or checklist on/off.',
    check: (_prof, flags) => flags.toggledLayer,
  },
]
