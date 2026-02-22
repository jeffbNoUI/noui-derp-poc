import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'

export function useMember(memberId: string) {
  return useQuery({
    queryKey: ['member', memberId],
    queryFn: () => api.getMember(memberId),
    enabled: !!memberId,
  })
}

export function useEmployment(memberId: string) {
  return useQuery({
    queryKey: ['employment', memberId],
    queryFn: () => api.getEmployment(memberId),
    enabled: !!memberId,
  })
}

export function useSalary(memberId: string) {
  return useQuery({
    queryKey: ['salary', memberId],
    queryFn: () => api.getSalary(memberId),
    enabled: !!memberId,
  })
}

export function useServiceCredit(memberId: string) {
  return useQuery({
    queryKey: ['serviceCredit', memberId],
    queryFn: () => api.getServiceCredit(memberId),
    enabled: !!memberId,
  })
}

export function useBeneficiaries(memberId: string) {
  return useQuery({
    queryKey: ['beneficiaries', memberId],
    queryFn: () => api.getBeneficiaries(memberId),
    enabled: !!memberId,
  })
}

export function useDROs(memberId: string) {
  return useQuery({
    queryKey: ['dros', memberId],
    queryFn: () => api.getDROs(memberId),
    enabled: !!memberId,
  })
}
