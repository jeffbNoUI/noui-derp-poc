/**
 * Simulated member authentication for POC.
 * Provides a dropdown to switch between demo members.
 * No real authentication — just sets the active member ID in React state.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

interface AuthState {
  memberId: string
  setMemberId: (id: string) => void
}

const AuthContext = createContext<AuthState>({ memberId: '10001', setMemberId: () => {} })

const DEMO_MEMBERS = [
  { id: '10001', name: 'Robert Martinez', tier: 1, label: 'Tier 1 · Rule of 75' },
  { id: '10002', name: 'Jennifer Kim', tier: 2, label: 'Tier 2 · Early Retirement' },
  { id: '10003', name: 'David Washington', tier: 3, label: 'Tier 3 · Early Retirement' },
  { id: '10004', name: 'Robert Martinez (DRO)', tier: 1, label: 'Tier 1 · DRO' },
] as const

export function PortalAuthProvider({ children }: { children: ReactNode }) {
  const [memberId, setMemberId] = useState('10001')
  return <AuthContext.Provider value={{ memberId, setMemberId }}>{children}</AuthContext.Provider>
}

export function usePortalAuth() {
  return useContext(AuthContext)
}

export { DEMO_MEMBERS }
