// Re-export legacy theme (C, tierMeta, fmt) for backward compatibility
export { C, tierMeta, fmt } from './legacy'

// New portal theme system
export type { PortalTheme } from './types'
export { memberTheme } from './member-theme'
export { staffTheme } from './staff-theme'
export { ThemeProvider, useTheme } from './ThemeProvider'
