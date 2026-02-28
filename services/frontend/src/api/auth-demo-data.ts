/**
 * Demo user fixtures and simulated auth functions for all four portals.
 * Provides login simulation, session persistence via localStorage, and account creation stubs.
 * Consumed by: login pages, auth contexts, AccessManagement, UserManagement
 * Depends on: Auth.ts types, isDemoMode from demo-data.ts
 */
import type {
  StaffUser, MemberUser, EmployerUser, VendorUser,
  AuthSession, MemberAccountRequest, ManagedAccountRequest,
  PortalUser,
} from '@/types/Auth'

// ─── Demo staff users ──────────────────────────────────────────────────────────

export const DEMO_STAFF_USERS: StaffUser[] = [
  { id: 'S001', username: 'jthompson', displayName: 'Janet Thompson', email: 'jthompson@denver.gov', portal: 'staff', role: 'analyst', department: 'Benefits' },
  { id: 'S002', username: 'mgarcia', displayName: 'Maria Garcia', email: 'mgarcia@denver.gov', portal: 'staff', role: 'supervisor', department: 'Benefits' },
  { id: 'S003', username: 'admin', displayName: 'Chris Admin', email: 'cadmin@denver.gov', portal: 'staff', role: 'admin', department: 'IT' },
]

// ─── Demo member users (mapped to existing demo cases 10001-10004) ─────────────

export const DEMO_MEMBER_USERS: MemberUser[] = [
  { id: 'M001', username: 'rmartinez', displayName: 'Robert Martinez', email: 'rmartinez@email.com', portal: 'member', memberId: '10001', tier: 1 },
  { id: 'M002', username: 'jkim', displayName: 'Jennifer Kim', email: 'jkim@email.com', portal: 'member', memberId: '10002', tier: 2 },
  { id: 'M003', username: 'dwashington', displayName: 'David Washington', email: 'dwashington@email.com', portal: 'member', memberId: '10003', tier: 3 },
  { id: 'M004', username: 'rmartinez_dro', displayName: 'Robert Martinez (DRO)', email: 'rmartinez_dro@email.com', portal: 'member', memberId: '10004', tier: 1 },
]

// ─── Demo employer users (1 admin per dept + 2 extra payroll users) ────────────

export const DEMO_EMPLOYER_USERS: EmployerUser[] = [
  { id: 'E001', username: 'sjones', displayName: 'Sarah Jones', email: 'sjones@denver.gov', portal: 'employer', role: 'admin', orgCode: 'PW', orgName: 'Public Works' },
  { id: 'E002', username: 'tlee', displayName: 'Tom Lee', email: 'tlee@denver.gov', portal: 'employer', role: 'admin', orgCode: 'PR', orgName: 'Parks & Recreation' },
  { id: 'E003', username: 'amoreno', displayName: 'Ana Moreno', email: 'amoreno@denver.gov', portal: 'employer', role: 'admin', orgCode: 'FIN', orgName: 'Finance' },
  { id: 'E004', username: 'kpatel', displayName: 'Kevin Patel', email: 'kpatel@denver.gov', portal: 'employer', role: 'payroll', orgCode: 'PW', orgName: 'Public Works' },
  { id: 'E005', username: 'lchang', displayName: 'Lisa Chang', email: 'lchang@denver.gov', portal: 'employer', role: 'payroll', orgCode: 'FIN', orgName: 'Finance' },
]

// ─── Demo vendor users ─────────────────────────────────────────────────────────

export const DEMO_VENDOR_USERS: VendorUser[] = [
  { id: 'V001', username: 'kaiser_admin', displayName: 'Rachel Foster', email: 'rfoster@kaiser.org', portal: 'vendor', role: 'admin', vendorCode: 'kaiser', vendorName: 'Kaiser Permanente' },
  { id: 'V002', username: 'delta_admin', displayName: 'James Wu', email: 'jwu@deltadental.com', portal: 'vendor', role: 'admin', vendorCode: 'delta', vendorName: 'Delta Dental' },
]

// ─── Storage keys ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  staff: 'noui_auth_staff',
  member: 'noui_auth_member',
  employer: 'noui_auth_employer',
  vendor: 'noui_auth_vendor',
} as const

type Portal = keyof typeof STORAGE_KEYS

// ─── Session helpers ───────────────────────────────────────────────────────────

function makeSession<U extends PortalUser>(user: U): AuthSession<U> {
  const now = new Date()
  const expires = new Date(now.getTime() + 8 * 60 * 60 * 1000) // 8 hours
  return {
    user,
    token: `demo-${user.id}-${now.getTime()}`,
    loginAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }
}

export function getStoredSession<U extends PortalUser>(portal: Portal): AuthSession<U> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[portal])
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession<U>
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(STORAGE_KEYS[portal])
      return null
    }
    return session
  } catch {
    return null
  }
}

export function storeSession(portal: Portal, session: AuthSession): void {
  localStorage.setItem(STORAGE_KEYS[portal], JSON.stringify(session))
}

export function clearSession(portal: Portal): void {
  localStorage.removeItem(STORAGE_KEYS[portal])
}

// ─── Simulated login ───────────────────────────────────────────────────────────

interface StaffCredentials { username: string; password: string }
interface MemberCredentials { memberId?: string; dob?: string; email?: string; password?: string }
interface EmployerCredentials { orgCode: string; username: string; password: string }
interface VendorCredentials { vendorCode: string; username: string; password: string }

export function simulateStaffLogin(creds: StaffCredentials): AuthSession<StaffUser> | null {
  const user = DEMO_STAFF_USERS.find(u => u.username === creds.username)
  if (!user) return null
  const session = makeSession(user)
  storeSession('staff', session)
  return session
}

export function simulateMemberLogin(creds: MemberCredentials): AuthSession<MemberUser> | null {
  let user: MemberUser | undefined
  if (creds.memberId) {
    user = DEMO_MEMBER_USERS.find(u => u.memberId === creds.memberId)
  } else if (creds.email) {
    user = DEMO_MEMBER_USERS.find(u => u.email === creds.email)
  }
  if (!user) return null
  const session = makeSession(user)
  storeSession('member', session)
  return session
}

export function simulateEmployerLogin(creds: EmployerCredentials): AuthSession<EmployerUser> | null {
  const user = DEMO_EMPLOYER_USERS.find(u => u.orgCode === creds.orgCode && u.username === creds.username)
  if (!user) return null
  const session = makeSession(user)
  storeSession('employer', session)
  return session
}

export function simulateVendorLogin(creds: VendorCredentials): AuthSession<VendorUser> | null {
  const user = DEMO_VENDOR_USERS.find(u => u.vendorCode === creds.vendorCode && u.username === creds.username)
  if (!user) return null
  const session = makeSession(user)
  storeSession('vendor', session)
  return session
}

// ─── Simulated account creation ────────────────────────────────────────────────

export function simulateCreateMemberAccount(req: MemberAccountRequest): MemberUser | null {
  // Verify member exists in demo data
  const existing = DEMO_MEMBER_USERS.find(u => u.memberId === req.memberId)
  if (!existing) return null
  return {
    ...existing,
    username: req.username,
    email: req.email,
  }
}

export function simulateCreateManagedAccount(req: ManagedAccountRequest): EmployerUser | VendorUser {
  const id = `${req.portal === 'employer' ? 'E' : 'V'}${Date.now()}`
  if (req.portal === 'employer') {
    const orgName = DEMO_EMPLOYER_USERS.find(u => u.orgCode === req.orgCode)?.orgName ?? req.orgCode
    return {
      id, username: req.username, displayName: req.displayName, email: req.email,
      portal: 'employer', role: req.role as EmployerUser['role'], orgCode: req.orgCode, orgName,
    }
  }
  const vendorName = DEMO_VENDOR_USERS.find(u => u.vendorCode === req.orgCode)?.vendorName ?? req.orgCode
  return {
    id, username: req.username, displayName: req.displayName, email: req.email,
    portal: 'vendor', role: req.role as VendorUser['role'], vendorCode: req.orgCode, vendorName,
  }
}

// ─── Quick login helpers (for demo buttons) ────────────────────────────────────

export function quickStaffLogin(user: StaffUser): AuthSession<StaffUser> {
  const session = makeSession(user)
  storeSession('staff', session)
  return session
}

export function quickMemberLogin(user: MemberUser): AuthSession<MemberUser> {
  const session = makeSession(user)
  storeSession('member', session)
  return session
}

export function quickEmployerLogin(user: EmployerUser): AuthSession<EmployerUser> {
  const session = makeSession(user)
  storeSession('employer', session)
  return session
}

export function quickVendorLogin(user: VendorUser): AuthSession<VendorUser> {
  const session = makeSession(user)
  storeSession('vendor', session)
  return session
}
