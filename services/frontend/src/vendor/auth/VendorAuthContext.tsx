/**
 * Vendor portal authentication — dropdown to switch demo vendors + real auth session support.
 * In demo mode, vendorId is set via dropdown. In auth mode, vendorId comes from authenticated user.
 * Consumed by: VendorLayout (provides context), vendor pages (consume via useVendorAuth)
 * Depends on: Auth.ts types, auth-demo-data.ts session helpers
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { VendorUser, AuthSession } from '@/types/Auth'
import { getStoredSession, storeSession, clearSession } from '@/api/auth-demo-data'

interface VendorAuthState {
  vendorId: string
  setVendorId: (id: string) => void
  isAuthenticated: boolean
  user: VendorUser | null
  login: (session: AuthSession<VendorUser>) => void
  logout: () => void
}

const VendorAuthContext = createContext<VendorAuthState>({
  vendorId: 'kaiser',
  setVendorId: () => {},
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
})

export const DEMO_VENDORS = [
  { id: 'kaiser', name: 'Kaiser Permanente', type: 'Health Insurance' },
  { id: 'delta', name: 'Delta Dental', type: 'Dental Insurance' },
] as const

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendorId, setVendorId] = useState('kaiser')
  const [user, setUser] = useState<VendorUser | null>(null)

  useEffect(() => {
    const session = getStoredSession<VendorUser>('vendor')
    if (session) {
      setUser(session.user)
      setVendorId(session.user.vendorCode)
    }
  }, [])

  const login = (session: AuthSession<VendorUser>) => {
    storeSession('vendor', session)
    setUser(session.user)
    setVendorId(session.user.vendorCode)
  }

  const logout = () => {
    clearSession('vendor')
    setUser(null)
    setVendorId('kaiser')
  }

  return (
    <VendorAuthContext.Provider value={{ vendorId, setVendorId, isAuthenticated: !!user, user, login, logout }}>
      {children}
    </VendorAuthContext.Provider>
  )
}

export function useVendorAuth() {
  return useContext(VendorAuthContext)
}
