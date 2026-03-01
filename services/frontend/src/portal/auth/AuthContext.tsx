/**
 * Member portal authentication — dropdown to switch demo members + real auth session support.
 * In demo mode, memberId is set via dropdown. In auth mode, memberId comes from authenticated user.
 * Consumed by: MemberLayout (provides context), all portal pages (consume via usePortalAuth)
 * Depends on: Auth.ts types, auth-demo-data.ts session helpers
 */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { MemberUser, AuthSession } from '@/types/Auth'
import { getStoredSession, storeSession, clearSession } from '@/api/auth-demo-data'

interface AuthState {
  memberId: string
  setMemberId: (id: string) => void
  isAuthenticated: boolean
  user: MemberUser | null
  login: (session: AuthSession<MemberUser>) => void
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  memberId: 'COPERA-001',
  setMemberId: () => {},
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
})

const DEMO_MEMBERS = [
  { id: 'COPERA-001', name: 'Maria Garcia', division: 'State', label: 'State | PERA 1 | Rule of 80' },
  { id: 'COPERA-002', name: 'James Chen', division: 'School', label: 'School | PERA 6 | Early Retirement' },
  { id: 'COPERA-003', name: 'Sarah Williams', division: 'DPS', label: 'DPS | DPS 1 | Rule of 80' },
] as const

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState('COPERA-001')
  const [user, setUser] = useState<MemberUser | null>(null)

  useEffect(() => {
    const session = getStoredSession<MemberUser>('member')
    if (session) {
      setUser(session.user)
      setMemberId(session.user.memberId)
    }
  }, [])

  const login = (session: AuthSession<MemberUser>) => {
    storeSession('member', session)
    setUser(session.user)
    setMemberId(session.user.memberId)
  }

  const logout = () => {
    clearSession('member')
    setUser(null)
    setMemberId('COPERA-001')
  }

  return (
    <AuthContext.Provider value={{ memberId, setMemberId, isAuthenticated: !!user, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function usePortalAuth() {
  return useContext(AuthContext)
}

export { DEMO_MEMBERS }
