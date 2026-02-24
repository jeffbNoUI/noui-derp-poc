/**
 * Discovery spotlight types — hint definitions and page-level hint groups.
 * Consumed by: discovery-hints.ts, useDiscovery.ts, DiscoveryOverlay.tsx
 * Depends on: Nothing (pure types)
 */

/** A single discovery hint targeting a DOM element */
export interface DiscoveryHint {
  /** Unique ID for localStorage persistence */
  id: string
  /** CSS selector to find the target element (data-discovery attributes) */
  selector: string
  /** Bold headline for the tooltip */
  headline: string
  /** Explanatory body text */
  body: string
  /** Tooltip placement relative to the cutout */
  placement: 'top' | 'bottom' | 'left' | 'right'
  /** Auto-dismiss after this many ms (default 15000) */
  autoDismissMs?: number
}

/** A page-level group of hints keyed by route pattern */
export interface DiscoveryPage {
  /** Route pattern to match (uses startsWith for prefix matching) */
  routePattern: string
  /** Whether route must match exactly */
  exact?: boolean
  /** Additional path suffix that must be present (e.g., '/guided') */
  pathSuffix?: string
  /** Ordered hints to show on this page */
  hints: DiscoveryHint[]
}
