/**
 * Kiosk script executor — timer-driven playback of demo steps with keyboard controls.
 * Space = pause/resume, Right = skip step, Escape = exit kiosk mode.
 * Consumed by: main.tsx (rendered alongside RouterProvider when ?kiosk active)
 * Depends on: KioskBridge (dispatch bridge), KioskOverlay, kiosk-script, router
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { router } from '@/router'
import { useKioskBridge } from './KioskBridge'
import { KioskOverlay } from './KioskOverlay'
import { KIOSK_SCRIPT } from './kiosk-script'
import { TIMING, type KioskState, type KioskStep } from './kiosk-types'

/** Compute dwell time — narrator body auto-computes from character count */
function getStepDwell(step: KioskStep): number {
  if (step.dwell !== undefined) return step.dwell

  // Auto-compute from narrator body length when present
  if (step.narrator?.body) {
    const charDwell = step.narrator.body.length * TIMING.NARRATOR_MS_PER_CHAR
    return charDwell + TIMING.NARRATOR_DWELL_PADDING
  }

  switch (step.type) {
    case 'navigate': return TIMING.ROUTE_SETTLE + TIMING.CAPTION_READ
    case 'dispatch': return TIMING.DISPATCH_SETTLE + TIMING.CAPTION_READ
    case 'caption': return TIMING.CAPTION_READ
    case 'pause': return step.dwell
    case 'scene': return TIMING.SCENE_TRANSITION + TIMING.CAPTION_READ
  }
}

export function KioskOrchestrator() {
  const bridge = useKioskBridge()

  const [state, setState] = useState<KioskState>({
    currentStep: 0,
    totalSteps: KIOSK_SCRIPT.length,
    caption: '',
    narrator: null,
    paused: false,
    done: false,
  })

  const stepRef = useRef<number>(0)
  const pausedRef = useRef<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Execute a single step
  const executeStep = useCallback((index: number) => {
    if (index >= KIOSK_SCRIPT.length) {
      setState(s => ({ ...s, done: true, caption: '', narrator: null }))
      return
    }

    const step = KIOSK_SCRIPT[index]
    const caption = step.type === 'scene' ? step.caption
      : step.type === 'caption' ? step.text
      : step.caption ?? ''
    const narrator = step.narrator ?? null

    setState(s => ({ ...s, currentStep: index, caption, narrator }))

    // Execute the step action
    switch (step.type) {
      case 'navigate':
        router.navigate(step.path)
        break
      case 'dispatch':
        if (bridge) {
          bridge.dispatch(step.target, step.action)
        }
        break
      case 'caption':
      case 'pause':
      case 'scene':
        // Pure visual steps — no side effects beyond caption
        break
    }

    // Schedule next step
    const dwell = getStepDwell(step)
    timerRef.current = setTimeout(() => {
      if (!pausedRef.current) {
        stepRef.current = index + 1
        executeStep(index + 1)
      }
    }, dwell)
  }, [bridge])

  // Start playback after initial mount delay
  useEffect(() => {
    const startDelay = setTimeout(() => {
      executeStep(0)
    }, 1000)
    return () => {
      clearTimeout(startDelay)
      clearTimeout(timerRef.current)
    }
  }, [executeStep])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.done) return

      switch (e.code) {
        case 'Space': {
          e.preventDefault()
          pausedRef.current = !pausedRef.current
          setState(s => ({ ...s, paused: pausedRef.current }))
          if (!pausedRef.current) {
            // Resume: execute current step again to re-schedule timer
            executeStep(stepRef.current)
          } else {
            clearTimeout(timerRef.current)
          }
          break
        }
        case 'ArrowRight': {
          e.preventDefault()
          clearTimeout(timerRef.current)
          stepRef.current = stepRef.current + 1
          executeStep(stepRef.current)
          break
        }
        case 'Escape': {
          e.preventDefault()
          clearTimeout(timerRef.current)
          setState(s => ({ ...s, done: true, caption: '', narrator: null }))
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.done, executeStep])

  if (state.done) return null

  return <KioskOverlay state={state} />
}
