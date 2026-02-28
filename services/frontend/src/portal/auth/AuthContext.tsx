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
  memberId: '10001',
  setMemberId: () => {},
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
})

const DEMO_MEMBERS = [
  { id: '10001', name: 'Robert Martinez', tier: 1, label: 'Tier 1 · Rule of 75' },
  { id: '10002', name: 'Jennifer Kim', tier: 2, label: 'Tier 2 · Early Retirement' },
  { id: '10003', name: 'David Washington', tier: 3, label: 'Tier 3 · Early Retirement' },
  { id: '10004', name: 'Robert Martinez (DRO)', tier: 1, label: 'Tier 1 · DRO' },
] as const

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState('10001')
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
    setMemberId('10001')
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
