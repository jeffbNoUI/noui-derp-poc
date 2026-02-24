/**
 * Keyboard shortcut definitions grouped by context for the overlay.
 * Consumed by: ShortcutOverlay.tsx
 * Depends on: Nothing (pure data)
 */

export interface ShortcutDef {
  keys: string[]
  description: string
}

export interface ShortcutGroup {
  context: string
  shortcuts: ShortcutDef[]
}

export const SHORTCUTS: ShortcutGroup[] = [
  {
    context: 'Global',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Shift', '?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close overlay / dismiss' },
    ],
  },
  {
    context: 'Guided Mode',
    shortcuts: [
      { keys: ['\u2192'], description: 'Next stage (when confirmed)' },
      { keys: ['\u2190'], description: 'Previous stage' },
      { keys: ['Enter'], description: 'Confirm current stage' },
    ],
  },
  {
    context: 'Expert Mode',
    shortcuts: [
      { keys: ['\u2192'], description: 'Next card in carousel' },
      { keys: ['\u2190'], description: 'Previous card in carousel' },
    ],
  },
  {
    context: 'Kiosk',
    shortcuts: [
      { keys: ['Space'], description: 'Pause / resume playback' },
      { keys: ['Esc'], description: 'Exit kiosk mode' },
    ],
  },
]
