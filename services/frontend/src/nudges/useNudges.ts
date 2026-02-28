/**
 * Smart nudge hook — evaluates nudge rules against current workspace state.
 * Manages idle timers and dismissed nudge tracking via localStorage.
 * Consumed by: GuidedWorkspace.tsx
 * Depends on: nudge-rules.ts, nudge-types.ts
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { NUDGE_RULES } from './nudge-rules'
import type { NudgeContext, NudgeRule } from './nudge-types'

const STORAGE_KEY = 'noui:nudges:dismissed'

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function dismissNudge(id: string) {
  const dismissed = getDismissed()
  dismissed.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed]))
}

export interface ActiveNudge {
  id: string
  message: string
  hint: string
}

export function useNudges(ctx: NudgeContext) {
  const location = useLocation()
  const isKiosk = location.search.includes('kiosk')
  const [activeNudge, setActiveNudge] = useState<ActiveNudge | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dismissedRef = useRef(getDismissed())

  // Clear timer on unmount or stage change
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Evaluate out-of-order rules immediately on context change
  useEffect(() => {
    if (isKiosk || activeNudge) return
    const dismissed = dismissedRef.current

    for (const rule of NUDGE_RULES) {
      if (dismissed.has(rule.id)) continue
      // Rec #2,3: skip out-of-order nudges for experienced analysts
      if (rule.maxCases != null && ctx.casesCompleted != null && ctx.casesCompleted > rule.maxCases) continue
      if (rule.trigger.type === 'out-of-order') {
        const { confirmedBefore, notVisited } = rule.trigger
        if (ctx.confirmed.has(confirmedBefore) && !ctx.visitedStages.has(notVisited)) {
          setActiveNudge({ id: rule.id, message: rule.message, hint: rule.hint })
          return
        }
      }
    }
  }, [ctx.confirmed.size, ctx.visitedStages.size, isKiosk])

  // Set up idle timers
  useEffect(() => {
    if (isKiosk || activeNudge) return
    if (timerRef.current) clearTimeout(timerRef.current)

    const dismissed = dismissedRef.current
    const idleRule = NUDGE_RULES.find(r =>
      r.trigger.type === 'idle' &&
      r.trigger.stageId === ctx.currentStageId &&
      !dismissed.has(r.id)
    ) as (NudgeRule & { trigger: { type: 'idle'; delayMs: number } }) | undefined

    if (idleRule) {
      timerRef.current = setTimeout(() => {
        setActiveNudge({ id: idleRule.id, message: idleRule.message, hint: idleRule.hint })
      }, idleRule.trigger.delayMs)
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [ctx.currentStageId, isKiosk, activeNudge])

  const dismiss = useCallback(() => {
    if (activeNudge) {
      dismissNudge(activeNudge.id)
      dismissedRef.current.add(activeNudge.id)
    }
    setActiveNudge(null)
  }, [activeNudge])

  return { activeNudge, dismiss }
}
