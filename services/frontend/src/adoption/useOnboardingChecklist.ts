/**
 * Onboarding checklist hook — reads proficiency data and adoption flags
 * to compute milestone completion status.
 * Consumed by: OnboardingPanel.tsx
 * Depends on: checklist-milestones.ts, proficiency.ts, checklist-types.ts
 */
import { useState, useEffect, useCallback } from 'react'
import { readProficiency } from '@/lib/proficiency'
import { MILESTONES } from './checklist-milestones'
import type { AdoptionFlags } from './checklist-types'

function readFlags(): AdoptionFlags {
  return {
    triedExpert: localStorage.getItem('noui:adoption:tried-expert') === 'true',
    usedWhatIf: localStorage.getItem('noui:adoption:used-whatif') === 'true',
    toggledLayer: localStorage.getItem('noui:adoption:toggled-layer') === 'true',
  }
}

export interface MilestoneStatus {
  id: string
  label: string
  description: string
  completed: boolean
}

export function useOnboardingChecklist() {
  const [milestones, setMilestones] = useState<MilestoneStatus[]>([])

  const refresh = useCallback(() => {
    const prof = readProficiency()
    const flags = readFlags()
    setMilestones(MILESTONES.map(m => ({
      id: m.id,
      label: m.label,
      description: m.description,
      completed: m.check(prof, flags),
    })))
  }, [])

  useEffect(() => {
    refresh()
    // Re-check periodically (lightweight — just reads localStorage)
    const interval = setInterval(refresh, 3000)
    return () => clearInterval(interval)
  }, [refresh])

  const completedCount = milestones.filter(m => m.completed).length
  const totalCount = milestones.length

  return { milestones, completedCount, totalCount, refresh }
}
