/**
 * API client — dual-mode: demoApi (default) or liveApi (opt-in via ?live query param).
 * Consumed by: all hooks (useMember, useCalculations, usePortal)
 * Depends on: demo-data.ts (demo fixtures), mappers.ts (Go→TS response transforms)
 */
import type { APIResponse, APIError } from '@/types/Member'
import { isDemoMode, demoApi } from './demo-data'
import {
  mapMember, mapBeneficiaries, mapServiceCredit, mapDRORecords,
  mapEligibility, mapBenefit, mapPaymentOptions, mapScenarios,
  mapDROResult, buildSyntheticIntake,
} from './mappers'

const CONNECTOR_BASE = '/api/v1'
const INTELLIGENCE_BASE = '/api/v1'

/** Convert frontend short ID (10001) to backend format (M-100001). Pass through if already prefixed. */
export function toBackendId(id: string): string {
  if (/^\d+$/.test(id)) return `M-${id.padStart(6, '0')}`
  return id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRaw(url: string, options?: RequestInit): Promise<any> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const err: APIError = await res.json().catch(() => ({
      error: { code: 'UNKNOWN', message: res.statusText, request_id: '' },
    }))
    throw new Error(err.error.message)
  }

  const body: APIResponse<unknown> = await res.json()
  return body.data
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  return fetchRaw(url, options) as Promise<T>
}

// Live API — calls backend services, maps Go JSON → TypeScript types
const liveApi = {
  getApplicationIntake: async (id: string) => {
    // No Go endpoint for intake — build synthetic from member data
    const raw = await fetchRaw(`${CONNECTOR_BASE}/members/${toBackendId(id)}`)
    const member = mapMember(raw)
    return buildSyntheticIntake(member)
  },

  getMember: async (id: string) => {
    const raw = await fetchRaw(`${CONNECTOR_BASE}/members/${toBackendId(id)}`)
    return mapMember(raw)
  },

  getEmployment: (id: string) =>
    fetchJSON<import('@/types/Member').EmploymentEvent[]>(`${CONNECTOR_BASE}/members/${toBackendId(id)}/employment`),

  getSalary: (id: string) =>
    fetchJSON<{ records: import('@/types/Member').SalaryRecord[]; ams: import('@/types/Member').AMSResult }>(
      `${CONNECTOR_BASE}/members/${toBackendId(id)}/salary`
    ),

  getServiceCredit: async (id: string) => {
    const raw = await fetchRaw(`${CONNECTOR_BASE}/members/${toBackendId(id)}/service-credit`)
    return mapServiceCredit(raw)
  },

  getBeneficiaries: async (id: string) => {
    const raw = await fetchRaw(`${CONNECTOR_BASE}/members/${toBackendId(id)}/beneficiaries`)
    return mapBeneficiaries(raw)
  },

  getDROs: async (id: string) => {
    const raw = await fetchRaw(`${CONNECTOR_BASE}/members/${toBackendId(id)}/dro`)
    return mapDRORecords(raw)
  },

  evaluateEligibility: async (memberId: string, retirementDate: string) => {
    const raw = await fetchRaw(`${INTELLIGENCE_BASE}/eligibility/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: toBackendId(memberId), retirement_date: retirementDate }),
    })
    return mapEligibility(raw, retirementDate)
  },

  calculateBenefit: async (memberId: string, retirementDate: string) => {
    const raw = await fetchRaw(`${INTELLIGENCE_BASE}/benefit/calculate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: toBackendId(memberId), retirement_date: retirementDate }),
    })
    return mapBenefit(raw)
  },

  calculatePaymentOptions: async (memberId: string, retirementDate: string) => {
    const raw = await fetchRaw(`${INTELLIGENCE_BASE}/benefit/options`, {
      method: 'POST',
      body: JSON.stringify({ member_id: toBackendId(memberId), retirement_date: retirementDate }),
    })
    return mapPaymentOptions(raw)
  },

  calculateScenarios: async (memberId: string, retirementDates: string[]) => {
    const raw = await fetchRaw(`${INTELLIGENCE_BASE}/benefit/scenario`, {
      method: 'POST',
      body: JSON.stringify({ member_id: toBackendId(memberId), retirement_dates: retirementDates }),
    })
    return mapScenarios(raw)
  },

  calculateDRO: async (memberId: string, retirementDate?: string) => {
    const raw = await fetchRaw(`${INTELLIGENCE_BASE}/dro/calculate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: toBackendId(memberId), retirement_date: retirementDate ?? '' }),
    })
    return mapDROResult(raw)
  },

  saveElection: (election: {
    member_id: string; retirement_date: string; payment_option: string
    monthly_benefit: number; gross_benefit: number; reduction_factor: number
    dro_deduction?: number; ipr_amount?: number; death_benefit_amount?: number
  }) =>
    fetchJSON<import('@/types/Member').RetirementElectionResult>(
      `${CONNECTOR_BASE}/members/${toBackendId(election.member_id)}/retirement-election`, {
        method: 'POST',
        body: JSON.stringify({ ...election, member_id: toBackendId(election.member_id) }),
      }
    ),
}

// Export the appropriate API based on demo mode.
// Demo mode is the default for the POC — opt OUT with ?live query param.
export const api = isDemoMode() ? demoApi : liveApi
