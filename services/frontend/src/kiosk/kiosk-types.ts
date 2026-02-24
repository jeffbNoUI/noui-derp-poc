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
  /** Initial pause before teleprompter scroll begins */
  NARRATOR_SCROLL_DELAY: 1500,
  /** Padding added to auto-computed dwell (ms) */
  NARRATOR_DWELL_PADDING: 2500,
  /** Milliseconds per character for auto-dwell computation */
  NARRATOR_MS_PER_CHAR: 100,
} as const

// ─── Caption positioning ─────────────────────────────────────

export type CaptionPosition = 'bottom-center' | 'bottom-right' | 'top-right' | 'left-panel'

// ─── Narrator overlay ────────────────────────────────────────

export interface NarratorCaption {
  headline: string
  body: string
  position: CaptionPosition
}

// ─── Step types ──────────────────────────────────────────────

export interface NavigateStep {
  type: 'navigate'
  path: string
  caption?: string
  narrator?: NarratorCaption
  dwell?: number
}

export interface DispatchStep {
  type: 'dispatch'
  target: 'guided' | 'wizard'
  action: Record<string, unknown>
  caption?: string
  narrator?: NarratorCaption
  dwell?: number
}

export interface CaptionStep {
  type: 'caption'
  text: string
  narrator?: NarratorCaption
  dwell?: number
}

export interface PauseStep {
  type: 'pause'
  dwell: number
  caption?: string
  narrator?: NarratorCaption
}

export interface SceneStep {
  type: 'scene'
  name: string
  caption: string
  narrator?: NarratorCaption
  dwell?: number
}

export type KioskStep = NavigateStep | DispatchStep | CaptionStep | PauseStep | SceneStep

// ─── Orchestrator state ──────────────────────────────────────

export interface KioskState {
  currentStep: number
  totalSteps: number
  caption: string
  narrator: NarratorCaption | null
  paused: boolean
  done: boolean
}
