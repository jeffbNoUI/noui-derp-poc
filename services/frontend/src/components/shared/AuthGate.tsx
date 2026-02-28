/**
 * Auth gate wrapper — redirects unauthenticated users to login in non-demo mode.
 * In demo mode, children render without any auth check (existing behavior preserved).
 * Consumed by: MemberLayout, StaffLayout, EmployerLayout, VendorLayout
 * Depends on: isDemoMode from demo-data.ts, react-router-dom Navigate
 */
import { Navigate } from 'react-router-dom'
import { isDemoMode } from '@/api/demo-data'
import type { ReactNode } from 'react'

interface AuthGateProps {
  isAuthenticated: boolean
  loginPath: string
  children: ReactNode
}

export function AuthGate({ isAuthenticated, loginPath, children }: AuthGateProps) {
  // Demo mode bypasses auth — portals work as-is with dropdown selectors
  if (isDemoMode()) return <>{children}</>
  if (isAuthenticated) return <>{children}</>
  return <Navigate to={loginPath} replace />
}
