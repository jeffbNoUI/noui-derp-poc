import { createContext, useContext, type ReactNode } from 'react'
import type { PortalTheme } from './types'
import { memberTheme } from './member-theme'

const ThemeContext = createContext<PortalTheme>(memberTheme)

export function ThemeProvider({ theme, children }: { theme: PortalTheme; children: ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(): PortalTheme {
  return useContext(ThemeContext)
}
