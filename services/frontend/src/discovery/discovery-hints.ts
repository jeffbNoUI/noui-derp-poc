/**
 * Discovery hint definitions — 4 hints across 3 page contexts.
 * Consumed by: useDiscovery.ts
 * Depends on: discovery-types.ts (DiscoveryPage)
 */
import type { DiscoveryPage } from './discovery-types'

export const DISCOVERY_PAGES: DiscoveryPage[] = [
  {
    routePattern: '/staff',
    exact: true,
    hints: [
      {
        id: 'welcome-mode-toggle',
        selector: '[data-discovery="mode-toggle"]',
        headline: 'Two processing modes',
        body: 'Expert mode shows all stages at once. Guided mode walks through each step with contextual help and verification checklists.',
        placement: 'bottom',
      },
    ],
  },
  {
    routePattern: '/staff/case/',
    hints: [
      {
        id: 'expert-carousel-card',
        selector: '[data-discovery="carousel-card"]',
        headline: 'Click any stage to expand',
        body: 'The carousel rotates between stages. Click the side cards or use the pill navigation below to jump to any stage.',
        placement: 'left',
      },
      {
        id: 'expert-live-summary',
        selector: '[data-discovery="live-summary"]',
        headline: 'Tracks confirmed values',
        body: 'This sidebar updates in real-time as you confirm each stage. It shows the running benefit calculation and overall progress.',
        placement: 'left',
      },
    ],
  },
  {
    routePattern: '/staff/case/',
    pathSuffix: '/guided',
    hints: [
      {
        id: 'guided-learning-toggles',
        selector: '[data-discovery="learning-toggles"]',
        headline: 'Toggle layers by experience',
        body: 'Onboarding teaches the "why." Rules shows citations. Checklist gates confirmation. Toggle each layer based on your familiarity.',
        placement: 'left',
      },
    ],
  },
]
