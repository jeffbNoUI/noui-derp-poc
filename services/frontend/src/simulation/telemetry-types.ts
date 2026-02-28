/**
 * Telemetry event schema, persona profiles, and state snapshot types.
 * Consumed by: all generators, session-generator.ts, analysis pipeline
 * Depends on: Nothing (pure type definitions)
 */

// ─── Telemetry Event ────────────────────────────────────────────

export interface TelemetryEvent {
  session_id: string
  event_id: string
  timestamp: number
  portal: 'staff' | 'member' | 'employer'
  workflow: 'retirement' | 'death' | 'refund' | 'application' | 'contribution'
  member_id: string
  persona_id: string
  experience_level: 'novice' | 'intermediate' | 'expert'
  event_type: EventType
  payload: Record<string, unknown>
  state_snapshot: StateSnapshot
}

export interface StateSnapshot {
  current_stage: string | null
  confirmed_stages: string[]
  visited_stages: string[]
  view_mode?: 'guided' | 'expert'
  elapsed_ms: number
  stage_elapsed_ms: number
}

// ─── Event Types ────────────────────────────────────────────────
// 30 event types across all workflow categories

export type EventType =
  // Navigation
  | 'stage_enter'
  | 'stage_exit'
  | 'navigate_next'
  | 'navigate_back'
  | 'navigate_jump'
  // Verification
  | 'stage_confirm'
  | 'stage_unconfirm'
  | 'checklist_check'
  | 'checklist_uncheck'
  // Data interaction
  | 'data_load'
  | 'data_inspect'
  | 'option_elect'
  | 'analyst_input'
  // Learning module
  | 'layer_toggle'
  | 'rules_view'
  | 'onboarding_view'
  | 'whatif_view'
  // Nudges
  | 'nudge_fire'
  | 'nudge_dismiss'
  | 'nudge_act'
  // Expert mode
  | 'expert_mode_switch'
  | 'expert_stage_expand'
  // Case lifecycle
  | 'session_start'
  | 'session_complete'
  | 'session_abandon'
  | 'save_start'
  | 'save_complete'
  // Wizard (member portal)
  | 'wizard_step_enter'
  | 'wizard_step_complete'
  // Upload (employer portal)
  | 'upload_phase_enter'

// ─── Persona Profile ────────────────────────────────────────────

export interface PersonaProfile {
  id: string
  name: string
  role: 'staff_analyst' | 'staff_supervisor' | 'member' | 'employer_admin'
  experience: 'novice' | 'intermediate' | 'expert'
  speed_factor: number
  thoroughness: number
  linearity: number
  learning_module_usage: number
  error_rate: number
  expert_mode_preference: number
}

// ─── Session Summary ────────────────────────────────────────────

export interface SessionSummary {
  session_id: string
  portal: 'staff' | 'member' | 'employer'
  workflow: string
  member_id: string
  persona_id: string
  experience_level: 'novice' | 'intermediate' | 'expert'
  started_at: number
  ended_at: number
  duration_ms: number
  event_count: number
  stages_visited: string[]
  stages_confirmed: string[]
  completed: boolean
  view_mode: 'guided' | 'expert'
  abandoned_at_stage: string | null
}

// ─── Session Distribution ───────────────────────────────────────

export interface SessionDistribution {
  workflow: string
  count: number
  portal: 'staff' | 'member' | 'employer'
  variant?: string
}

// ─── Composition Recommendation ─────────────────────────────────

export interface CompositionRecommendation {
  category: 'stage_ordering' | 'component_visibility' | 'learning_defaults' | 'nudge_rules'
  current_behavior: string
  recommended_change: string
  evidence: { sessions_analyzed: number; pattern_frequency: number; confidence: number }
  implementation: { file: string; function_name: string; change_description: string }
}
