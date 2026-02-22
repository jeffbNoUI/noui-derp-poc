/** TanStack Query hooks for portal application data */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portalDemoApi } from '@/api/portal-demo-data'

export function useApplication(memberId: string) {
  return useQuery({
    queryKey: ['portal', 'application', memberId],
    queryFn: () => portalDemoApi.getApplication(memberId),
    enabled: !!memberId,
  })
}

export function useApplicationDocuments(memberId: string) {
  return useQuery({
    queryKey: ['portal', 'documents', memberId],
    queryFn: () => portalDemoApi.getDocuments(memberId),
    enabled: !!memberId,
  })
}

export function useApplicationMessages(memberId: string) {
  return useQuery({
    queryKey: ['portal', 'messages', memberId],
    queryFn: () => portalDemoApi.getMessages(memberId),
    enabled: !!memberId,
  })
}

export function useApplicationHistory(memberId: string) {
  return useQuery({
    queryKey: ['portal', 'history', memberId],
    queryFn: () => portalDemoApi.getStatusHistory(memberId),
    enabled: !!memberId,
  })
}

export function useSubmitApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { memberId: string; retirementDate: string; paymentOption: string }) =>
      portalDemoApi.submitApplication(params.memberId, params.retirementDate, params.paymentOption),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'application', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'documents', vars.memberId] })
      queryClient.invalidateQueries({ queryKey: ['portal', 'history', vars.memberId] })
    },
  })
}
