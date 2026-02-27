/**
 * Shared test utilities — render helpers wrapping router, theme, query, and auth providers.
 * Consumed by: all component/route .test.tsx files
 * Depends on: react-router-dom, ThemeProvider, QueryClientProvider, PortalAuthProvider, memberTheme
 */
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/theme/ThemeProvider'
import { memberTheme } from '@/theme/member-theme'
import type { PortalTheme } from '@/theme/types'
import type { ReactElement } from 'react'

// Fresh QueryClient per test to avoid shared state between tests
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
}

interface RouterOptions {
  route?: string
  initialEntries?: string[]
}

/** Render with MemoryRouter + QueryClientProvider wrapping */
export function renderWithRouter(ui: ReactElement, opts: RouterOptions & RenderOptions = {}) {
  const { route, initialEntries, ...renderOpts } = opts
  const entries = initialEntries ?? (route ? [route] : ['/'])
  const qc = createTestQueryClient()
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={entries}>{children}</MemoryRouter>
      </QueryClientProvider>
    ),
    ...renderOpts,
  })
}

/** Render with ThemeProvider wrapping */
export function renderWithTheme(ui: ReactElement, theme?: PortalTheme) {
  const qc = createTestQueryClient()
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>
        <ThemeProvider theme={theme ?? memberTheme}>{children}</ThemeProvider>
      </QueryClientProvider>
    ),
  })
}

/** Full app wrapper — router + theme + query */
export function renderApp(ui: ReactElement, opts: RouterOptions & { theme?: PortalTheme } = {}) {
  const { route, initialEntries, theme, ...renderOpts } = opts
  const entries = initialEntries ?? (route ? [route] : ['/'])
  const qc = createTestQueryClient()
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={entries}>
          <ThemeProvider theme={theme ?? memberTheme}>{children}</ThemeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
    ...renderOpts,
  })
}

// Re-export everything from @testing-library/react for convenience
export { screen, waitFor, within, act } from '@testing-library/react'
