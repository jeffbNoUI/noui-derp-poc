/**
 * Announcement batch data — defines current feature announcements for the banner.
 * Consumed by: AnnouncementBanner.tsx
 * Depends on: Nothing (pure data)
 */

export interface AnnouncementBatch {
  id: string
  features: string[]
}

export const CURRENT_BATCH: AnnouncementBatch = {
  id: '2026-02-v1',
  features: [
    'Discovery Spotlights',
    'What If Scenarios',
    'Rule Citation Popovers',
  ],
}
