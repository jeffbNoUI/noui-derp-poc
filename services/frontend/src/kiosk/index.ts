/**
 * Kiosk demo mode — barrel export.
 * Consumed by: main.tsx
 * Depends on: all kiosk modules
 */
export { KioskBridgeProvider, useKioskRegister } from './KioskBridge'
export { KioskOrchestrator } from './KioskOrchestrator'
export type { KioskStep, KioskState, NarratorCaption, CaptionPosition } from './kiosk-types'
