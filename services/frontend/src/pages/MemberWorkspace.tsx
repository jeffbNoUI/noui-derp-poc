import { useMember, useEmployment, useSalary, useServiceCredit } from '@/hooks/useMember'
import { MemberBanner } from '@/components/MemberBanner'
import { AlertBar } from '@/components/AlertBar'
import type { Alert } from '@/components/AlertBar'
import { EmploymentTimeline } from '@/components/EmploymentTimeline'
import { SalaryTable } from '@/components/SalaryTable'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface MemberWorkspaceProps {
  memberId: string
}

export function MemberWorkspace({ memberId }: MemberWorkspaceProps) {
  const member = useMember(memberId)
  const employment = useEmployment(memberId)
  const salary = useSalary(memberId)
  const serviceCredit = useServiceCredit(memberId)

  if (member.isLoading) {
    return <LoadingSpinner message="Loading member data..." />
  }

  if (member.error) {
    return (
      <ErrorDisplay
        message={member.error instanceof Error ? member.error.message : 'Failed to load member'}
        onRetry={() => member.refetch()}
      />
    )
  }

  if (!member.data) {
    return <ErrorDisplay message="No member data available" />
  }

  const m = member.data
  const alerts = buildAlerts(m, serviceCredit.data)

  return (
    <div className="space-y-6">
      <MemberBanner member={m} serviceCredit={serviceCredit.data} />

      {alerts.length > 0 && <AlertBar alerts={alerts} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          {employment.isLoading ? (
            <LoadingSpinner message="Loading employment history..." />
          ) : employment.data ? (
            <EmploymentTimeline events={employment.data} />
          ) : null}
        </div>

        <div>
          {salary.isLoading ? (
            <LoadingSpinner message="Loading salary history..." />
          ) : salary.data ? (
            <SalaryTable
              records={salary.data.records}
              ams={salary.data.ams}
              tier={m.tier}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

function buildAlerts(
  member: import('@/types/Member').Member,
  serviceCredit?: import('@/types/Member').ServiceCreditSummary
): Alert[] {
  const alerts: Alert[] = []

  if (serviceCredit && serviceCredit.purchased_service_years > 0) {
    alerts.push({
      id: 'purchased-service',
      severity: 'info',
      title: 'Purchased Service Credit',
      message: `This member has ${serviceCredit.purchased_service_years.toFixed(2)} years of purchased service. Purchased service counts toward benefit calculation but is excluded from Rule of ${member.tier === 3 ? '85' : '75'} and IPR eligibility.`,
      ruleRef: 'RMC §18-407',
    })
  }

  if (
    member.tier <= 2 &&
    new Date(member.hire_date) < new Date('2010-01-01')
  ) {
    alerts.push({
      id: 'leave-payout',
      severity: 'info',
      title: 'Leave Payout Eligible',
      message:
        'Member hired before January 1, 2010 may qualify for sick/vacation leave payout added to final month salary for AMS calculation.',
      ruleRef: 'RMC §18-412',
    })
  }

  return alerts
}
