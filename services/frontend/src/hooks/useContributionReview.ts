/**
 * TanStack Query hooks for staff contribution report review.
 * Provides useSubmittedReports (queue list), useContributionReportDetail (single report),
 * and useUpdateReportStatus (mutation).
 * Consumed by: ContributionQueue, ContributionReview, StaffWelcomeScreen
 * Depends on: employerDemoApi, TanStack Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { employerDemoApi } from '@/api/employer-demo-data'
import type { ContributionReport } from '@/types/Employer'

export function useSubmittedReports() {
  return useQuery({
    queryKey: ['contribution-reports', 'submitted'],
    queryFn: () => employerDemoApi.getSubmittedContributionReports(),
  })
}

export function useContributionReportDetail(reportId: string) {
  return useQuery({
    queryKey: ['contribution-reports', 'detail', reportId],
    queryFn: () => employerDemoApi.getContributionReportDetail(reportId),
    enabled: !!reportId,
  })
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: {
      reportId: string
      status: ContributionReport['status']
      discrepancies?: ContributionReport['discrepancies']
    }) => employerDemoApi.updateContributionReportStatus(args.reportId, args.status, args.discrepancies),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contribution-reports'] })
    },
  })
}
