/**
 * Employer portal authentication — dropdown to switch demo departments + real auth session support.
 * In demo mode, deptId is set via dropdown. In auth mode, deptId comes from authenticated user.
 * Consumed by: EmployerLayout (provides context), all employer pages (consume via useEmployerAuth)
 * Depends on: Auth.ts types, auth-demo-data.ts session helpers
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { EmployerUser, AuthSession } from '@/types/Auth'
import { getStoredSession, storeSession, clearSession } from '@/api/auth-demo-data'

interface EmployerAuthState {
  deptId: string
  setDeptId: (id: string) => void
  isAuthenticated: boolean
  user: EmployerUser | null
  login: (session: AuthSession<EmployerUser>) => void
  logout: () => void
}

const EmployerAuthContext = createContext<EmployerAuthState>({
  deptId: 'PW',
  setDeptId: () => {},
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
})

export const DEMO_EMPLOYERS = [
  { id: 'PW', name: 'Public Works', code: 'PW' },
  { id: 'PR', name: 'Parks & Recreation', code: 'PR' },
  { id: 'FIN', name: 'Finance', code: 'FIN' },
] as const

export function EmployerAuthProvider({ children }: { children: ReactNode }) {
  const [deptId, setDeptId] = useState('PW')
  const [user, setUser] = useState<EmployerUser | null>(null)

  useEffect(() => {
    const session = getStoredSession<EmployerUser>('employer')
    if (session) {
      setUser(session.user)
      setDeptId(session.user.orgCode)
    }
  }, [])

  const login = (session: AuthSession<EmployerUser>) => {
    storeSession('employer', session)
    setUser(session.user)
    setDeptId(session.user.orgCode)
  }

  const logout = () => {
    clearSession('employer')
    setUser(null)
    setDeptId('PW')
  }

  return (
    <EmployerAuthContext.Provider value={{ deptId, setDeptId, isAuthenticated: !!user, user, login, logout }}>
      {children}
    </EmployerAuthContext.Provider>
  )
}

export function useEmployerAuth() {
  return useContext(EmployerAuthContext)
}
