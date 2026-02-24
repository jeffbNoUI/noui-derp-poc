/**
 * Discovery spotlight barrel — re-exports overlay, hook, and walkthrough system.
 * Consumed by: StaffLayout.tsx
 * Depends on: DiscoveryOverlay.tsx, useDiscovery.ts, WalkthroughOverlay.tsx, useWalkthrough.ts
 */
export { DiscoveryOverlay } from './DiscoveryOverlay'
export { useDiscovery } from './useDiscovery'
export { WalkthroughOverlay } from './WalkthroughOverlay'
export { useWalkthrough } from './useWalkthrough'
export type { DiscoveryHint, DiscoveryPage } from './discovery-types'
export type { WalkthroughStep, WalkthroughDefinition } from './walkthrough-types'
