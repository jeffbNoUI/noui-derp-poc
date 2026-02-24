/**
 * Onboarding milestone types — defines the shape of milestones with check functions.
 * Consumed by: checklist-milestones.ts, useOnboardingChecklist.ts, OnboardingPanel.tsx
 * Depends on: proficiency.ts (ProficiencyData)
 */
import type { ProficiencyData } from '@/lib/proficiency'

export interface AdoptionFlags {
  triedExpert: boolean
  usedWhatIf: boolean
  toggledLayer: boolean
}

export interface OnboardingMilestone {
  id: string
  label: string
  description: string
  check: (prof: ProficiencyData, flags: AdoptionFlags) => boolean
}
