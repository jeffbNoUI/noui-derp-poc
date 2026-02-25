/**
 * ResizeObserver-based hook returning container width and responsive tier.
 * Consumed by: GuidedWorkspace, StaffLayout (tier-adaptive layout)
 * Depends on: React (useRef, useState, useEffect)
 */
import { useRef, useState, useEffect } from 'react'

// Tier names align with the Responsive Workspace Design Framework (§2.2)
export type WidthTier = 'compact' | 'standard' | 'expanded' | 'full'

function getTier(width: number): WidthTier {
  if (width < 960) return 'compact'
  if (width < 1280) return 'standard'
  if (width < 1600) return 'expanded'
  return 'full'
}

export function useContainerWidth(): {
  ref: React.RefObject<HTMLDivElement | null>
  width: number
  tier: WidthTier
} {
  const ref = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(1024)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let rafId = 0
    const observer = new ResizeObserver((entries) => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const entry = entries[0]
        if (entry) setWidth(entry.contentRect.width)
      })
    })

    observer.observe(el)
    // Set initial width
    setWidth(el.getBoundingClientRect().width)

    return () => {
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  return { ref, width, tier: getTier(width) }
}
