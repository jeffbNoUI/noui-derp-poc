import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export function useEligibility(memberId: string, retirementDate: string) {
  return useQuery({
    queryKey: ['eligibility', memberId, retirementDate],
    queryFn: () => api.evaluateEligibility(memberId, retirementDate),
    enabled: !!memberId && !!retirementDate,
  })
}

export function useBenefitCalculation(memberId: string, retirementDate: string) {
  return useQuery({
    queryKey: ['benefit', memberId, retirementDate],
    queryFn: () => api.calculateBenefit(memberId, retirementDate),
    enabled: !!memberId && !!retirementDate,
  })
}

export function usePaymentOptions(memberId: string, retirementDate: string) {
  return useQuery({
    queryKey: ['paymentOptions', memberId, retirementDate],
    queryFn: () => api.calculatePaymentOptions(memberId, retirementDate),
    enabled: !!memberId && !!retirementDate,
  })
}

export function useScenarios(memberId: string, retirementDates: string[]) {
  return useQuery({
    queryKey: ['scenarios', memberId, retirementDates],
    queryFn: () => api.calculateScenarios(memberId, retirementDates),
    enabled: !!memberId && retirementDates.length > 0,
  })
}

export function useDROCalculation(memberId: string, enabled = true) {
  return useQuery({
    queryKey: ['droCalc', memberId],
    queryFn: () => api.calculateDRO(memberId),
    enabled: !!memberId && enabled,
  })
}
