/**
 * Simulated employer authentication for POC — dropdown to switch between 3 demo departments.
 * No real authentication — just sets the active department ID in React context.
 * Consumed by: EmployerLayout (provides context), all employer pages (consume via useEmployerAuth)
 * Depends on: React context, DEMO_EMPLOYERS constant
 */
import { createContext, useContext, useState, type ReactNode } from 'react'

interface EmployerAuthState {
  deptId: string
  setDeptId: (id: string) => void
}

const EmployerAuthContext = createContext<EmployerAuthState>({
  deptId: 'PW',
  setDeptId: () => {},
})

export const DEMO_EMPLOYERS = [
  { id: 'PW', name: 'Public Works', code: 'PW' },
  { id: 'PR', name: 'Parks & Recreation', code: 'PR' },
  { id: 'FIN', name: 'Finance', code: 'FIN' },
] as const

export function EmployerAuthProvider({ children }: { children: ReactNode }) {
  const [deptId, setDeptId] = useState('PW')
  return (
    <EmployerAuthContext.Provider value={{ deptId, setDeptId }}>
      {children}
    </EmployerAuthContext.Provider>
  )
}

export function useEmployerAuth() {
  return useContext(EmployerAuthContext)
}
