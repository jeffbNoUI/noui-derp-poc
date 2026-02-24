/**
 * Command palette types — defines the CommandItem interface used by the registry and UI.
 * Consumed by: command-registry.ts, CommandPalette.tsx
 * Depends on: Nothing (pure types)
 */

export interface CommandItem {
  id: string
  label: string
  category: 'Case' | 'Stage' | 'Tool' | 'View'
  icon: string
  keywords?: string[]
  action: () => void
}
