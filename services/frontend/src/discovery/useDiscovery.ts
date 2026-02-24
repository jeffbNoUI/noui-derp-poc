/**
 * Discovery spotlight hook — manages hint visibility, localStorage persistence,
 * auto-dismiss timers, and kiosk suppression.
 * Consumed by: DiscoveryOverlay.tsx
 * Depends on: discovery-hints.ts (DISCOVERY_PAGES), react-router-dom (useLocation)
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { DISCOVERY_PAGES } from './discovery-hints'
import type { DiscoveryHint } from './discovery-types'

const STORAGE_KEY = 'noui:discovery:seen'

function getSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function markSeen(id: string) {
  const seen = getSeenIds()
  seen.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]))
}

export function useDiscovery() {
  const location = useLocation()
  const [currentHint, setCurrentHint] = useState<DiscoveryHint | null>(null)
  const [pendingHints, setPendingHints] = useState<DiscoveryHint[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Suppress during kiosk mode
  const isKiosk = location.search.includes('kiosk')

  // Match current route to discovery pages and filter unseen hints
  useEffect(() => {
    if (isKiosk) { setCurrentHint(null); setPendingHints([]); return }

    const seen = getSeenIds()
    const pathname = location.pathname

    const matchedHints: DiscoveryHint[] = []
    for (const page of DISCOVERY_PAGES) {
      const routeMatches = page.exact
        ? pathname === page.routePattern
        : pathname.startsWith(page.routePattern)

      if (!routeMatches) continue

      // Check pathSuffix constraint
      if (page.pathSuffix && !pathname.endsWith(page.pathSuffix)) continue
      // For expert mode pages (no pathSuffix), exclude guided routes
      if (!page.pathSuffix && pathname.endsWith('/guided')) continue

      for (const hint of page.hints) {
        if (!seen.has(hint.id)) matchedHints.push(hint)
      }
    }

    setPendingHints(matchedHints.slice(1))
    setCurrentHint(matchedHints[0] ?? null)
  }, [location.pathname, isKiosk])

  // Auto-dismiss timer
  useEffect(() => {
    if (!currentHint) return
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      dismiss()
    }, currentHint.autoDismissMs ?? 15000)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [currentHint?.id])

  const dismiss = useCallback(() => {
    if (!currentHint) return
    markSeen(currentHint.id)
    // Advance to next pending hint
    const next = pendingHints[0] ?? null
    setPendingHints(prev => prev.slice(1))
    setCurrentHint(next)
  }, [currentHint, pendingHints])

  const dismissAll = useCallback(() => {
    if (currentHint) markSeen(currentHint.id)
    for (const h of pendingHints) markSeen(h.id)
    setCurrentHint(null)
    setPendingHints([])
  }, [currentHint, pendingHints])

  const totalHints = (currentHint ? 1 : 0) + pendingHints.length
  const currentIndex = currentHint ? totalHints - pendingHints.length : 0

  return { currentHint, dismiss, dismissAll, currentIndex, totalHints }
}
