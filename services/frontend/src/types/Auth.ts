/**
 * Authentication types for all four portals — staff, member, employer, vendor.
 * Simulated auth for POC but structured for production-ready patterns.
 * Consumed by: auth contexts, login pages, auth-demo-data.ts, AuthGate
 * Depends on: nothing (pure type definitions)
 */

// ─── Role types ────────────────────────────────────────────────────────────────

export type StaffRole = 'analyst' | 'supervisor' | 'admin'
export type EmployerRole = 'admin' | 'payroll' | 'viewer'
export type VendorRole = 'admin' | 'processor'

// ─── User interfaces ──────────────────────────────────────────────────────────

interface BaseUser {
  id: string
  username: string
  displayName: string
  email: string
}

export interface StaffUser extends BaseUser {
  portal: 'staff'
  role: StaffRole
  department: string
}

export interface MemberUser extends BaseUser {
  portal: 'member'
  memberId: string
  tier: number
}

export interface EmployerUser extends BaseUser {
  portal: 'employer'
  role: EmployerRole
  orgCode: string
  orgName: string
}

export interface VendorUser extends BaseUser {
  portal: 'vendor'
  role: VendorRole
  vendorCode: string
  vendorName: string
}

export type PortalUser = StaffUser | MemberUser | EmployerUser | VendorUser

// ─── Auth session ──────────────────────────────────────────────────────────────

export interface AuthSession<U extends PortalUser = PortalUser> {
  user: U
  token: string
  loginAt: string
  expiresAt: string
}

// ─── Account creation requests ─────────────────────────────────────────────────

export interface MemberAccountRequest {
  memberId: string
  dateOfBirth: string
  ssnLast4: string
  email: string
  username: string
  password: string
}

export interface ManagedAccountRequest {
  portal: 'employer' | 'vendor'
  orgCode: string
  displayName: string
  email: string
  username: string
  role: EmployerRole | VendorRole
}
