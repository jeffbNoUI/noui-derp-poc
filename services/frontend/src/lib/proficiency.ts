/**
 * Proficiency tracking — localStorage-backed experience data for adaptive layer defaults.
 * Tracks per-stage confirmation counts and total completed cases. Computes default
 * Learning Module layer visibility based on experience level.
 * Consumed by: GuidedWorkspace.tsx (mount-time layer defaults)
 * Depends on: guided-types.ts (LayerState)
 */
import type { LayerState } from '@/pages/staff/guided-types'

const STORAGE_KEY = 'noui:proficiency'

export interface ProficiencyData {
  /** Number of times each stage has been confirmed */
  stageConfirmations: Record<string, number>
  /** Total cases completed (all stages confirmed + submitted) */
  casesCompleted: number
}

function defaultData(): ProficiencyData {
  return { stageConfirmations: {}, casesCompleted: 0 }
}

/** Read proficiency data from localStorage */
export function readProficiency(): ProficiencyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData()
    const parsed = JSON.parse(raw)
    return {
      stageConfirmations: parsed.stageConfirmations ?? {},
      casesCompleted: parsed.casesCompleted ?? 0,
    }
  } catch { return defaultData() }
}

function save(data: ProficiencyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Record a stage confirmation — increments the per-stage counter */
export function recordConfirmation(stageId: string) {
  const data = readProficiency()
  data.stageConfirmations[stageId] = (data.stageConfirmations[stageId] ?? 0) + 1
  save(data)
}

/** Record a completed case — increments the total case counter */
export function recordCaseComplete() {
  const data = readProficiency()
  data.casesCompleted++
  save(data)
}

/**
 * Compute default layer visibility based on experience level.
 * - New (<3 cases): onboarding ON, rules OFF, checklist ON
 * - Intermediate (3-10 cases): onboarding OFF, rules OFF, checklist ON
 * - Experienced (>10 cases): onboarding OFF, rules OFF, checklist ON
 * Checklist stays ON at all levels — governing principle requires human verification.
 */
export function computeLayerDefaults(data: ProficiencyData): LayerState {
  if (data.casesCompleted < 3) {
    return { onboarding: true, rules: false, checklist: true }
  }
  // Intermediate and experienced: turn off onboarding by default
  return { onboarding: false, rules: false, checklist: true }
}

/** Reset proficiency data — for demo reset */
export function resetProficiency() {
  localStorage.removeItem(STORAGE_KEY)
}
