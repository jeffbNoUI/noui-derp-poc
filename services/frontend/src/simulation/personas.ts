/**
 * 25 synthetic user profiles with behavioral parameters for simulation.
 * Speed, thoroughness, linearity, and error rates drive realistic session variance.
 * Consumed by: session-generator.ts, all generators
 * Depends on: telemetry-types.ts (PersonaProfile)
 */
import type { PersonaProfile } from './telemetry-types.ts'

// ─── Staff Analyst Personas (10) ────────────────────────────────

const staffAnalysts: PersonaProfile[] = [
  // Novice analysts — slow, thorough, linear, rely on learning module
  {
    id: 'SA-01', name: 'Anna Reeves', role: 'staff_analyst', experience: 'novice',
    speed_factor: 1.8, thoroughness: 0.95, linearity: 0.95,
    learning_module_usage: 0.9, error_rate: 0.15, expert_mode_preference: 0.0,
  },
  {
    id: 'SA-02', name: 'Carlos Mendez', role: 'staff_analyst', experience: 'novice',
    speed_factor: 2.0, thoroughness: 0.85, linearity: 0.90,
    learning_module_usage: 0.85, error_rate: 0.20, expert_mode_preference: 0.0,
  },
  {
    id: 'SA-03', name: 'Diana Park', role: 'staff_analyst', experience: 'novice',
    speed_factor: 1.6, thoroughness: 0.90, linearity: 0.92,
    learning_module_usage: 0.80, error_rate: 0.12, expert_mode_preference: 0.05,
  },
  // Intermediate analysts — moderate speed, sometimes jump stages
  {
    id: 'SA-04', name: 'Frank Torres', role: 'staff_analyst', experience: 'intermediate',
    speed_factor: 1.2, thoroughness: 0.75, linearity: 0.70,
    learning_module_usage: 0.45, error_rate: 0.08, expert_mode_preference: 0.20,
  },
  {
    id: 'SA-05', name: 'Grace Liu', role: 'staff_analyst', experience: 'intermediate',
    speed_factor: 1.0, thoroughness: 0.80, linearity: 0.75,
    learning_module_usage: 0.50, error_rate: 0.10, expert_mode_preference: 0.30,
  },
  {
    id: 'SA-06', name: 'Hector Ruiz', role: 'staff_analyst', experience: 'intermediate',
    speed_factor: 1.3, thoroughness: 0.70, linearity: 0.65,
    learning_module_usage: 0.35, error_rate: 0.06, expert_mode_preference: 0.25,
  },
  {
    id: 'SA-07', name: 'Irene Walsh', role: 'staff_analyst', experience: 'intermediate',
    speed_factor: 1.1, thoroughness: 0.78, linearity: 0.72,
    learning_module_usage: 0.55, error_rate: 0.09, expert_mode_preference: 0.15,
  },
  // Expert analysts — fast, skip checklists, use expert mode
  {
    id: 'SA-08', name: 'Jack Brennan', role: 'staff_analyst', experience: 'expert',
    speed_factor: 0.6, thoroughness: 0.40, linearity: 0.35,
    learning_module_usage: 0.10, error_rate: 0.03, expert_mode_preference: 0.80,
  },
  {
    id: 'SA-09', name: 'Karen Cho', role: 'staff_analyst', experience: 'expert',
    speed_factor: 0.5, thoroughness: 0.35, linearity: 0.30,
    learning_module_usage: 0.05, error_rate: 0.02, expert_mode_preference: 0.90,
  },
  {
    id: 'SA-10', name: 'Leo Mathis', role: 'staff_analyst', experience: 'expert',
    speed_factor: 0.7, thoroughness: 0.50, linearity: 0.40,
    learning_module_usage: 0.15, error_rate: 0.04, expert_mode_preference: 0.70,
  },
]

// ─── Staff Supervisor Personas (3) ──────────────────────────────

const staffSupervisors: PersonaProfile[] = [
  {
    id: 'SS-01', name: 'Maria Vasquez', role: 'staff_supervisor', experience: 'expert',
    speed_factor: 0.7, thoroughness: 0.60, linearity: 0.50,
    learning_module_usage: 0.10, error_rate: 0.02, expert_mode_preference: 0.85,
  },
  {
    id: 'SS-02', name: 'Nathan Brooks', role: 'staff_supervisor', experience: 'expert',
    speed_factor: 0.8, thoroughness: 0.55, linearity: 0.45,
    learning_module_usage: 0.08, error_rate: 0.01, expert_mode_preference: 0.90,
  },
  {
    id: 'SS-03', name: 'Olivia Chen', role: 'staff_supervisor', experience: 'intermediate',
    speed_factor: 1.0, thoroughness: 0.70, linearity: 0.60,
    learning_module_usage: 0.30, error_rate: 0.05, expert_mode_preference: 0.50,
  },
]

// ─── Member Personas (7) ────────────────────────────────────────

const memberPersonas: PersonaProfile[] = [
  // Cautious members — read everything, slow
  {
    id: 'MB-01', name: 'Robert M. (self)', role: 'member', experience: 'novice',
    speed_factor: 2.0, thoroughness: 0.90, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.10, expert_mode_preference: 0.0,
  },
  {
    id: 'MB-02', name: 'Jennifer K. (self)', role: 'member', experience: 'novice',
    speed_factor: 1.8, thoroughness: 0.85, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.08, expert_mode_preference: 0.0,
  },
  // Confident members — move quickly, linear
  {
    id: 'MB-03', name: 'David W. (self)', role: 'member', experience: 'intermediate',
    speed_factor: 1.0, thoroughness: 0.60, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.05, expert_mode_preference: 0.0,
  },
  {
    id: 'MB-04', name: 'Lisa C. (self)', role: 'member', experience: 'intermediate',
    speed_factor: 1.2, thoroughness: 0.65, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.06, expert_mode_preference: 0.0,
  },
  // Impatient members — rush through, may abandon
  {
    id: 'MB-05', name: 'Quick Member A', role: 'member', experience: 'novice',
    speed_factor: 0.8, thoroughness: 0.30, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.25, expert_mode_preference: 0.0,
  },
  {
    id: 'MB-06', name: 'Quick Member B', role: 'member', experience: 'novice',
    speed_factor: 0.7, thoroughness: 0.25, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.30, expert_mode_preference: 0.0,
  },
  {
    id: 'MB-07', name: 'Methodical Member', role: 'member', experience: 'intermediate',
    speed_factor: 1.5, thoroughness: 0.80, linearity: 1.0,
    learning_module_usage: 0.0, error_rate: 0.04, expert_mode_preference: 0.0,
  },
]

// ─── Employer Admin Personas (5) ────────────────────────────────

const employerAdmins: PersonaProfile[] = [
  {
    id: 'EA-01', name: 'Sarah Mitchell', role: 'employer_admin', experience: 'expert',
    speed_factor: 0.6, thoroughness: 0.70, linearity: 0.90,
    learning_module_usage: 0.0, error_rate: 0.02, expert_mode_preference: 0.0,
  },
  {
    id: 'EA-02', name: 'Michael Torres', role: 'employer_admin', experience: 'intermediate',
    speed_factor: 1.0, thoroughness: 0.65, linearity: 0.85,
    learning_module_usage: 0.0, error_rate: 0.05, expert_mode_preference: 0.0,
  },
  {
    id: 'EA-03', name: 'Lisa Chang', role: 'employer_admin', experience: 'intermediate',
    speed_factor: 1.2, thoroughness: 0.60, linearity: 0.80,
    learning_module_usage: 0.0, error_rate: 0.08, expert_mode_preference: 0.0,
  },
  {
    id: 'EA-04', name: 'New HR Admin', role: 'employer_admin', experience: 'novice',
    speed_factor: 1.8, thoroughness: 0.80, linearity: 0.95,
    learning_module_usage: 0.0, error_rate: 0.15, expert_mode_preference: 0.0,
  },
  {
    id: 'EA-05', name: 'Temp Admin', role: 'employer_admin', experience: 'novice',
    speed_factor: 2.0, thoroughness: 0.75, linearity: 0.90,
    learning_module_usage: 0.0, error_rate: 0.20, expert_mode_preference: 0.0,
  },
]

// ─── Exports ────────────────────────────────────────────────────

export const ALL_PERSONAS: PersonaProfile[] = [
  ...staffAnalysts,
  ...staffSupervisors,
  ...memberPersonas,
  ...employerAdmins,
]

export const STAFF_PERSONAS = [...staffAnalysts, ...staffSupervisors]
export const MEMBER_PERSONAS = memberPersonas
export const EMPLOYER_PERSONAS = employerAdmins

/** Pick a random persona from a filtered list */
export function pickPersona(
  personas: PersonaProfile[],
  rng: () => number,
): PersonaProfile {
  return personas[Math.floor(rng() * personas.length)]
}
