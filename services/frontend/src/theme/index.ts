// Re-export legacy theme (C, tierMeta, divisionMeta, hasTableMeta, fmt) for backward compatibility
export { C, tierMeta, divisionMeta, hasTableMeta } from './legacy'
export { fmt } from '@/lib/constants'

// New portal theme system
export type { PortalTheme } from './types'
export { memberTheme } from './member-theme'
export { staffTheme } from './staff-theme'
export { employerTheme } from './employer-theme'
export { vendorTheme } from './vendor-theme'
export { ThemeProvider, useTheme } from './ThemeProvider'
