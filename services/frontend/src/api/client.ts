import type { APIResponse, APIError } from '@/types/Member'
import { isDemoMode, demoApi } from './demo-data'

const CONNECTOR_BASE = '/api/v1'
const INTELLIGENCE_BASE = '/api/v1'

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
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

  const body: APIResponse<T> = await res.json()
  return body.data
}

// Live API — calls backend services
const liveApi = {
  getMember: (id: string) =>
    fetchJSON<import('@/types/Member').Member>(`${CONNECTOR_BASE}/members/${id}`),

  getEmployment: (id: string) =>
    fetchJSON<import('@/types/Member').EmploymentEvent[]>(`${CONNECTOR_BASE}/members/${id}/employment`),

  getSalary: (id: string) =>
    fetchJSON<{ records: import('@/types/Member').SalaryRecord[]; ams: import('@/types/Member').AMSResult }>(
      `${CONNECTOR_BASE}/members/${id}/salary`
    ),

  getServiceCredit: (id: string) =>
    fetchJSON<import('@/types/Member').ServiceCreditSummary>(`${CONNECTOR_BASE}/members/${id}/service-credit`),

  getBeneficiaries: (id: string) =>
    fetchJSON<import('@/types/Member').Beneficiary[]>(`${CONNECTOR_BASE}/members/${id}/beneficiaries`),

  getDROs: (id: string) =>
    fetchJSON<import('@/types/Member').DRORecord[]>(`${CONNECTOR_BASE}/members/${id}/dro`),

  evaluateEligibility: (memberId: string, retirementDate: string) =>
    fetchJSON<import('@/types/Member').EligibilityResult>(`${INTELLIGENCE_BASE}/eligibility/evaluate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, retirement_date: retirementDate }),
    }),

  calculateBenefit: (memberId: string, retirementDate: string) =>
    fetchJSON<import('@/types/Member').BenefitResult>(`${INTELLIGENCE_BASE}/benefit/calculate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, retirement_date: retirementDate }),
    }),

  calculatePaymentOptions: (memberId: string, retirementDate: string) =>
    fetchJSON<import('@/types/Member').PaymentOptionsResult>(`${INTELLIGENCE_BASE}/benefit/options`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, retirement_date: retirementDate }),
    }),

  calculateScenarios: (memberId: string, retirementDates: string[]) =>
    fetchJSON<import('@/types/Member').ScenarioResult[]>(`${INTELLIGENCE_BASE}/benefit/scenario`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId, retirement_dates: retirementDates }),
    }),

  calculateDRO: (memberId: string) =>
    fetchJSON<import('@/types/Member').DROResult>(`${INTELLIGENCE_BASE}/dro/calculate`, {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId }),
    }),
}

// Export the appropriate API based on demo mode.
// Demo mode is activated by ?demo query parameter or VITE_DEMO_MODE=true env var.
export const api = isDemoMode() ? demoApi : liveApi
