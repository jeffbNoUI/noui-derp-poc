/**
 * Application entry point — mounts React root with router and TanStack Query.
 * Detects ?kiosk query param to activate self-running demo mode.
 * Consumed by: index.html (via Vite)
 * Depends on: router, QueryClient, React 19, kiosk modules
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { KioskBridgeProvider, KioskOrchestrator } from './kiosk'
import { DevFeedbackOverlay } from './dev'
import './index.css'
import './styles/animations.css'
import './styles/print.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

const isKiosk = new URLSearchParams(window.location.search).has('kiosk')
const isDev = new URLSearchParams(window.location.search).has('dev')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isKiosk ? (
        <KioskBridgeProvider>
          <RouterProvider router={router} />
          <KioskOrchestrator />
        </KioskBridgeProvider>
      ) : (
        <RouterProvider router={router} />
      )}
      {isDev && <DevFeedbackOverlay />}
    </QueryClientProvider>
  </StrictMode>,
)
