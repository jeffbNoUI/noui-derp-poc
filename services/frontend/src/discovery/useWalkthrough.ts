/**
 * Walkthrough state machine hook — manages multi-step guided tours with cross-page navigation.
 * Uses requestAnimationFrame retry loop for element finding after navigation.
 * Consumed by: WalkthroughOverlay.tsx, StaffLayout.tsx
 * Depends on: walkthrough-scripts.ts, walkthrough-types.ts, react-router-dom
 */
import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { WALKTHROUGHS } from './walkthrough-scripts'
import type { WalkthroughStep } from './walkthrough-types'

const STORAGE_KEY = 'noui:walkthrough:completed'

function getCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

function markCompleted(id: string) {
  const completed = getCompleted()
  completed.add(id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...completed]))
}

export function useWalkthrough() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const retryRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const walkthrough = activeId ? WALKTHROUGHS.find(w => w.id === activeId) : null
  const currentStep: WalkthroughStep | null = walkthrough ? walkthrough.steps[stepIndex] ?? null : null
  const totalSteps = walkthrough?.steps.length ?? 0
  const active = !!walkthrough && !!currentStep

  const findTarget = useCallback((selector: string) => {
    const el = document.querySelector(selector)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
      retryRef.current = 0
      return
    }
    if (retryRef.current < 10) {
      retryRef.current++
      rafRef.current = requestAnimationFrame(() => {
        setTimeout(() => findTarget(selector), 300)
      })
    } else {
      // Element not found — show without spotlight
      setTargetRect(null)
      retryRef.current = 0
    }
  }, [])

  const showStep = useCallback((step: WalkthroughStep) => {
    if (step.preAction) step.preAction()
    if (step.navigateTo) {
      navigate(step.navigateTo)
      // Wait for navigation to settle before finding target
      retryRef.current = 0
      setTimeout(() => findTarget(step.selector), 200)
    } else {
      retryRef.current = 0
      findTarget(step.selector)
    }
  }, [navigate, findTarget])

  const start = useCallback((walkthroughId: string) => {
    const wt = WALKTHROUGHS.find(w => w.id === walkthroughId)
    if (!wt || wt.steps.length === 0) return
    setActiveId(walkthroughId)
    setStepIndex(0)
    showStep(wt.steps[0])
  }, [showStep])

  const next = useCallback(() => {
    if (!walkthrough) return
    const nextIdx = stepIndex + 1
    if (nextIdx >= walkthrough.steps.length) {
      markCompleted(walkthrough.id)
      setActiveId(null)
      setStepIndex(0)
      setTargetRect(null)
      return
    }
    setStepIndex(nextIdx)
    showStep(walkthrough.steps[nextIdx])
  }, [walkthrough, stepIndex, showStep])

  const back = useCallback(() => {
    if (!walkthrough || stepIndex <= 0) return
    const prevIdx = stepIndex - 1
    setStepIndex(prevIdx)
    showStep(walkthrough.steps[prevIdx])
  }, [walkthrough, stepIndex, showStep])

  const skipAll = useCallback(() => {
    if (walkthrough) markCompleted(walkthrough.id)
    setActiveId(null)
    setStepIndex(0)
    setTargetRect(null)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [walkthrough])

  return {
    active,
    currentStep,
    stepIndex,
    totalSteps,
    targetRect,
    start,
    next,
    back,
    skipAll,
  }
}
