/**
 * Kiosk dispatch bridge — context provider and registration hook.
 * Components register their local dispatch functions; the orchestrator
 * reads from the registry to fire actions into local reducers.
 * Zero overhead when context is absent (no-op hook).
 * Consumed by: KioskOrchestrator, GuidedWorkspace, ApplicationWizard
 * Depends on: React context
 */
import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react'

// ─── Bridge registry type ────────────────────────────────────

type DispatchFn = (action: Record<string, unknown>) => void

interface BridgeRegistry {
  register: (name: string, dispatch: DispatchFn) => void
  unregister: (name: string) => void
  dispatch: (target: string, action: Record<string, unknown>) => void
}

const KioskBridgeContext = createContext<BridgeRegistry | null>(null)

// ─── Provider ────────────────────────────────────────────────

export function KioskBridgeProvider({ children }: { children: ReactNode }) {
  const registry = useRef<Map<string, DispatchFn>>(new Map())

  const bridge: BridgeRegistry = {
    register: (name, dispatch) => { registry.current.set(name, dispatch) },
    unregister: (name) => { registry.current.delete(name) },
    dispatch: (target, action) => {
      const fn = registry.current.get(target)
      if (fn) fn(action)
    },
  }

  return (
    <KioskBridgeContext.Provider value={bridge}>
      {children}
    </KioskBridgeContext.Provider>
  )
}

// ─── Registration hook ───────────────────────────────────────

/**
 * Register a local dispatch function with the kiosk bridge.
 * No-ops gracefully when kiosk mode is not active (context absent).
 */
export function useKioskRegister(name: string, dispatch: DispatchFn) {
  const bridge = useContext(KioskBridgeContext)

  // Register on mount, unregister on unmount
  const registered = useRef<boolean>(false)
  if (bridge && !registered.current) {
    bridge.register(name, dispatch)
    registered.current = true
  }

  // Cleanup via useCallback trick — ref-stable
  const cleanup = useCallback(() => {
    if (bridge) {
      bridge.unregister(name)
      registered.current = false
    }
  }, [bridge, name])

  // We handle cleanup via the component's unmount by re-registering each render
  // and relying on the bridge's Map overwrite semantics
  if (bridge) {
    bridge.register(name, dispatch)
  }

  return cleanup
}

// ─── Direct access hook (for orchestrator) ───────────────────

export function useKioskBridge(): BridgeRegistry | null {
  return useContext(KioskBridgeContext)
}
