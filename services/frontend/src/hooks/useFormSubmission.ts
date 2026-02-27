/**
 * TanStack Query hooks for form submission bundles.
 * Provides useFormBundles (member query), usePendingSubmissions (staff query),
 * useFormBundle (single bundle), and useSubmitBundle (mutation).
 * Consumed by: LifeEventFlow, FormSubmissionStatus, WorkQueue, SubmissionReview
 * Depends on: formSubmissionApi, TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formSubmissionApi } from '@/api/form-submission-store'

export function useFormBundles(memberId: string) {
  return useQuery({
    queryKey: ['form-bundles', 'member', memberId],
    queryFn: () => formSubmissionApi.getBundlesForMember(memberId),
    enabled: !!memberId,
  })
}

export function usePendingSubmissions() {
  return useQuery({
    queryKey: ['form-bundles', 'pending'],
    queryFn: () => formSubmissionApi.getAllPending(),
  })
}

export function useFormBundle(bundleId: string) {
  return useQuery({
    queryKey: ['form-bundles', 'detail', bundleId],
    queryFn: () => formSubmissionApi.getBundle(bundleId),
    enabled: !!bundleId,
  })
}

export function useSubmitBundle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bundleId: string) => formSubmissionApi.submitBundle(bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-bundles'] })
    },
  })
}
