/**
 * Type definitions and timing constants for kiosk demo mode.
 * Consumed by: KioskOrchestrator, KioskOverlay, kiosk-script
 * Depends on: Nothing (pure types)
 */

// ─── Timing constants (ms) ───────────────────────────────────

export const TIMING = {
  /** Wait for route to settle after navigation */
  ROUTE_SETTLE: 800,
  /** Wait for dispatch to take effect */
  DISPATCH_SETTLE: 600,
  /** Default caption read duration */
  CAPTION_READ: 3000,
  /** Pause between scenes */
  SCENE_TRANSITION: 1500,
} as const

// ─── Step types ──────────────────────────────────────────────

export interface NavigateStep {
  type: 'navigate'
  path: string
  caption?: string
  dwell?: number
}

export interface DispatchStep {
  type: 'dispatch'
  target: 'guided' | 'wizard'
  action: Record<string, unknown>
  caption?: string
  dwell?: number
}

export interface CaptionStep {
  type: 'caption'
  text: string
  dwell?: number
}

export interface PauseStep {
  type: 'pause'
  dwell: number
  caption?: string
}

export interface SceneStep {
  type: 'scene'
  name: string
  caption: string
  dwell?: number
}

export type KioskStep = NavigateStep | DispatchStep | CaptionStep | PauseStep | SceneStep

// ─── Orchestrator state ──────────────────────────────────────

export interface KioskState {
  currentStep: number
  totalSteps: number
  caption: string
  paused: boolean
  done: boolean
}
