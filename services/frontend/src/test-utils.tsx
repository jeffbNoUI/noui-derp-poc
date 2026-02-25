/**
 * Shared test utilities — render helpers wrapping router, theme, and auth providers.
 * Consumed by: all component/route .test.tsx files
 * Depends on: react-router-dom, ThemeProvider, PortalAuthProvider, memberTheme
 */
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { memberTheme } from '@/theme/member-theme'
import type { PortalTheme } from '@/theme/types'
import type { ReactElement } from 'react'

interface RouterOptions {
  route?: string
  initialEntries?: string[]
}

/** Render with MemoryRouter wrapping */
export function renderWithRouter(ui: ReactElement, opts: RouterOptions & RenderOptions = {}) {
  const { route, initialEntries, ...renderOpts } = opts
  const entries = initialEntries ?? (route ? [route] : ['/'])
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
    ),
    ...renderOpts,
  })
}

/** Render with ThemeProvider wrapping */
export function renderWithTheme(ui: ReactElement, theme?: PortalTheme) {
  return render(ui, {
    wrapper: ({ children }) => (
      <ThemeProvider theme={theme ?? memberTheme}>{children}</ThemeProvider>
    ),
  })
}

/** Full app wrapper — router + theme */
export function renderApp(ui: ReactElement, opts: RouterOptions & { theme?: PortalTheme } = {}) {
  const { route, initialEntries, theme, ...renderOpts } = opts
  const entries = initialEntries ?? (route ? [route] : ['/'])
  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={entries}>
        <ThemeProvider theme={theme ?? memberTheme}>{children}</ThemeProvider>
      </MemoryRouter>
    ),
    ...renderOpts,
  })
}

// Re-export everything from @testing-library/react for convenience
export { screen, waitFor, within, act } from '@testing-library/react'
