/**
 * Walkthrough types — multi-step guided tour definitions extending the discovery system.
 * Consumed by: walkthrough-scripts.ts, useWalkthrough.ts, WalkthroughOverlay.tsx
 * Depends on: discovery-types.ts (DiscoveryHint)
 */
import type { DiscoveryHint } from './discovery-types'

/** A single step in a walkthrough, extending DiscoveryHint with navigation */
export interface WalkthroughStep extends DiscoveryHint {
  /** If set, navigate to this path before showing the spotlight */
  navigateTo?: string
  /** Pre-action to run before finding the target element */
  preAction?: () => void
}

/** A complete walkthrough definition */
export interface WalkthroughDefinition {
  id: string
  title: string
  steps: WalkthroughStep[]
}

/** Runtime state of a walkthrough in progress */
export interface WalkthroughState {
  definitionId: string
  currentStep: number
  totalSteps: number
  active: boolean
}
