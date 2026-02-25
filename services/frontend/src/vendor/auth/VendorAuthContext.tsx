/**
 * Simulated vendor authentication for POC — dropdown to switch between demo vendor accounts.
 * No real authentication — just sets the active vendor ID in React context.
 * Consumed by: VendorLayout (provides context), vendor pages (consume via useVendorAuth)
 * Depends on: React context, DEMO_VENDORS constant
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

interface VendorAuthState {
  vendorId: string
  setVendorId: (id: string) => void
}

const VendorAuthContext = createContext<VendorAuthState>({
  vendorId: 'kaiser',
  setVendorId: () => {},
})

export const DEMO_VENDORS = [
  { id: 'kaiser', name: 'Kaiser Permanente', type: 'Health Insurance' },
  { id: 'delta', name: 'Delta Dental', type: 'Dental Insurance' },
] as const

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendorId, setVendorId] = useState('kaiser')
  return (
    <VendorAuthContext.Provider value={{ vendorId, setVendorId }}>
      {children}
    </VendorAuthContext.Provider>
  )
}

export function useVendorAuth() {
  return useContext(VendorAuthContext)
}
