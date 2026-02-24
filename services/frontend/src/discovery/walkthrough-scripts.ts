/**
 * Walkthrough script definitions — pre-built multi-step tours for analyst onboarding.
 * "Full Case Processing" tour walks through expert mode, guided mode, and key features.
 * Consumed by: useWalkthrough.ts
 * Depends on: walkthrough-types.ts
 */
import type { WalkthroughDefinition } from './walkthrough-types'

export const WALKTHROUGHS: WalkthroughDefinition[] = [
  {
    id: 'full-case-processing',
    title: 'Full Case Processing Tour',
    steps: [
      {
        id: 'wt-welcome',
        selector: '[data-discovery="mode-toggle"]',
        headline: 'Welcome to NoUI',
        body: 'This tour walks you through processing a retirement case. You\'ll see both Expert and Guided modes, the Learning Module, and key workspace features.',
        placement: 'bottom',
      },
      {
        id: 'wt-select-case',
        selector: '[data-discovery="mode-toggle"]',
        headline: 'Choose a Mode',
        body: 'Expert mode shows all stages at once in a carousel. Guided mode walks you through one stage at a time with contextual help. Try Expert first.',
        placement: 'bottom',
      },
      {
        id: 'wt-expert-carousel',
        navigateTo: '/staff/case/10001',
        selector: '[data-discovery="carousel-card"]',
        headline: 'Expert Mode Carousel',
        body: 'In Expert mode, stages appear as cards in a 3D carousel. Click any card or use the pill navigation to jump between stages. Each card shows a confidence signal.',
        placement: 'left',
      },
      {
        id: 'wt-live-summary',
        selector: '[data-discovery="live-summary"]',
        headline: 'Live Summary',
        body: 'The sidebar shows the running benefit calculation, elected payment option, and progress toward completion. Values update as you confirm stages.',
        placement: 'left',
      },
      {
        id: 'wt-switch-guided',
        navigateTo: '/staff/case/10001/guided',
        selector: '[data-discovery="learning-toggles"]',
        headline: 'Guided Mode',
        body: 'Guided mode walks you through one stage at a time. The Learning Module on the right provides onboarding narratives, rule citations, and a verification checklist.',
        placement: 'left',
      },
      {
        id: 'wt-learning-toggles',
        selector: '[data-discovery="learning-toggles"]',
        headline: 'Layer Toggles',
        body: 'Use these pills to show/hide the three layers: Onboarding (teaching narrative), Rules (RMC citations), and Checklist (verification items). Each layer is independent.',
        placement: 'left',
      },
      {
        id: 'wt-checklist-gate',
        selector: '[data-discovery="confirm-button"]',
        headline: 'Verification Gating',
        body: 'When the checklist layer is active, you must verify all items before confirming a stage. This ensures every data point is reviewed before advancing.',
        placement: 'top',
      },
      {
        id: 'wt-confidence-signals',
        selector: '[data-discovery="progress-bar"]',
        headline: 'Confidence Signals',
        body: 'Each stage shows a green, amber, or red signal. Green means data is complete. Amber flags items needing attention (purchased service, reductions). Red indicates missing data.',
        placement: 'bottom',
      },
      {
        id: 'wt-complete',
        selector: '[data-discovery="progress-bar"]',
        headline: 'Tour Complete!',
        body: 'You now know the basics. Try processing Case 1 (Robert Martinez) to practice. The system shows its work — every calculation is transparent and verifiable.',
        placement: 'bottom',
      },
    ],
  },
]
