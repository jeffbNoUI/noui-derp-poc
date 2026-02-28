/**
 * Staff portal authentication context — manages staff user session state.
 * Initializes from localStorage on mount; provides login/logout actions.
 * Consumed by: StaffLayout (provides context), staff pages (consume via useStaffAuth)
 * Depends on: Auth.ts types, auth-demo-data.ts session helpers
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { StaffUser, AuthSession } from '@/types/Auth'
import { getStoredSession, storeSession, clearSession } from '@/api/auth-demo-data'

interface StaffAuthState {
  isAuthenticated: boolean
  user: StaffUser | null
  login: (session: AuthSession<StaffUser>) => void
  logout: () => void
}

const StaffAuthContext = createContext<StaffAuthState>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
})

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null)

  useEffect(() => {
    const session = getStoredSession<StaffUser>('staff')
    if (session) setUser(session.user)
  }, [])

  const login = (session: AuthSession<StaffUser>) => {
    storeSession('staff', session)
    setUser(session.user)
  }

  const logout = () => {
    clearSession('staff')
    setUser(null)
  }

  return (
    <StaffAuthContext.Provider value={{ isAuthenticated: !!user, user, login, logout }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

export function useStaffAuth() {
  return useContext(StaffAuthContext)
}
