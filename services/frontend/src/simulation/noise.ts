/**
 * Timing jitter, weighted random selection, and Gaussian helpers for simulation.
 * Provides deterministic pseudo-randomness via seedable PRNG.
 * Consumed by: all generators, session-generator.ts
 * Depends on: Nothing (pure math)
 */

// ─── Seedable PRNG (Mulberry32) ─────────────────────────────────
// Deterministic PRNG so simulation runs are reproducible

export function createRng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Gaussian (Box-Muller) ──────────────────────────────────────

export function gaussian(mean: number, stddev: number, rng: () => number): number {
  const u1 = rng()
  const u2 = rng()
  const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2)
  return mean + stddev * z
}

/** Gaussian clamped to [min, max] */
export function clampedGaussian(
  mean: number, stddev: number, min: number, max: number, rng: () => number,
): number {
  return Math.max(min, Math.min(max, gaussian(mean, stddev, rng)))
}

// ─── Timing ─────────────────────────────────────────────────────

/** Base dwell time (ms) for reviewing a stage, scaled by persona speed */
const BASE_DWELL_MS = 15000

/** Generate a dwell time for a stage with persona speed and jitter */
export function dwellTime(speedFactor: number, rng: () => number): number {
  const base = BASE_DWELL_MS * speedFactor
  // Gaussian jitter: mean=base, stddev=30% of base, min=2s
  return Math.max(2000, clampedGaussian(base, base * 0.3, base * 0.3, base * 2.5, rng))
}

/** Quick action delay (clicking a checkbox, toggling a layer) */
export function actionDelay(rng: () => number): number {
  return clampedGaussian(800, 300, 200, 3000, rng)
}

/** Navigation delay (switching stages) */
export function navDelay(rng: () => number): number {
  return clampedGaussian(500, 200, 100, 2000, rng)
}

// ─── Weighted Random Selection ──────────────────────────────────

export interface WeightedOption<T> {
  value: T
  weight: number
}

/** Pick from weighted options using accumulated probability */
export function weightedPick<T>(options: WeightedOption<T>[], rng: () => number): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0)
  let r = rng() * total
  for (const opt of options) {
    r -= opt.weight
    if (r <= 0) return opt.value
  }
  return options[options.length - 1].value
}

// ─── Probability Helpers ────────────────────────────────────────

/** Returns true with the given probability (0-1) */
export function chance(probability: number, rng: () => number): boolean {
  return rng() < probability
}

/** Shuffle an array in-place (Fisher-Yates) */
export function shuffle<T>(arr: T[], rng: () => number): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = result[i]
    result[i] = result[j]
    result[j] = tmp
  }
  return result
}

/** Pick N random items from an array without replacement */
export function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  return shuffle(arr, rng).slice(0, Math.min(n, arr.length))
}
