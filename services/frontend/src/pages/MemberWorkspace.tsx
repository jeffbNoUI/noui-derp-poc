import { useState } from 'react'
import { useMember, useEmployment, useSalary, useServiceCredit, useDROs } from '@/hooks/useMember'
import { useEligibility, useBenefitCalculation, usePaymentOptions, useDROCalculation } from '@/hooks/useCalculations'
import { MemberBanner } from '@/components/MemberBanner'
import { AlertBar } from '@/components/AlertBar'
import type { Alert } from '@/components/AlertBar'
import { EmploymentTimeline } from '@/components/EmploymentTimeline'
import { SalaryTable } from '@/components/SalaryTable'
import { EligibilityPanel } from '@/components/EligibilityPanel'
import { BenefitCalculationPanel } from '@/components/BenefitCalculationPanel'
import { PaymentOptionsComparison } from '@/components/PaymentOptionsComparison'
import { ScenarioModeler } from '@/components/ScenarioModeler'
import { DROImpactPanel } from '@/components/DROImpactPanel'
import { ServiceCreditSummaryPanel } from '@/components/ServiceCreditSummaryPanel'
import { LeavePayoutInfo } from '@/components/LeavePayoutInfo'
import { EarlyRetirementReduction } from '@/components/EarlyRetirementReduction'
import { IPRPanel } from '@/components/IPRPanel'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorDisplay } from '@/components/ErrorDisplay'

interface MemberWorkspaceProps {
  memberId: string
}

export function MemberWorkspace({ memberId }: MemberWorkspaceProps) {
  const [retirementDate, setRetirementDate] = useState('')

  const member = useMember(memberId)
  const employment = useEmployment(memberId)
  const salary = useSalary(memberId)
  const serviceCredit = useServiceCredit(memberId)
  const dros = useDROs(memberId)

  const eligibility = useEligibility(memberId, retirementDate)
  const benefit = useBenefitCalculation(memberId, retirementDate)
  const paymentOptions = usePaymentOptions(memberId, retirementDate)
  const droCalc = useDROCalculation(
    memberId,
    !!retirementDate && !!dros.data && dros.data.length > 0
  )

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
  const hasDRO = dros.data && dros.data.length > 0
  const isLeavePayoutEligible = m.tier <= 2 && new Date(m.hire_date) < new Date('2010-01-01')
  const alerts = buildAlerts(m, serviceCredit.data, hasDRO)

  return (
    <div className="space-y-6">
      <MemberBanner member={m} serviceCredit={serviceCredit.data} />

      {alerts.length > 0 && <AlertBar alerts={alerts} />}

      {/* Retirement date selector */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-900">Retirement Date:</label>
          <input
            type="date"
            value={retirementDate}
            onChange={(e) => setRetirementDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {!retirementDate && (
            <p className="text-sm text-muted italic">
              Select a retirement date to evaluate eligibility and calculate benefits.
            </p>
          )}
        </div>
      </div>

      {/* Member data panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {employment.isLoading ? (
            <LoadingSpinner message="Loading employment history..." />
          ) : employment.data ? (
            <EmploymentTimeline events={employment.data} />
          ) : null}

          {serviceCredit.data && (
            <ServiceCreditSummaryPanel serviceCredit={serviceCredit.data} tier={m.tier} />
          )}

          {isLeavePayoutEligible && <LeavePayoutInfo member={m} />}
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

      {/* Calculation panels — only shown when retirement date selected */}
      {retirementDate && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-border pb-2">
            Benefit Analysis
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {eligibility.isLoading ? (
                <LoadingSpinner message="Evaluating eligibility..." />
              ) : eligibility.data ? (
                <EligibilityPanel result={eligibility.data} />
              ) : null}

              {benefit.isLoading ? (
                <LoadingSpinner message="Calculating benefit..." />
              ) : benefit.data ? (
                <BenefitCalculationPanel result={benefit.data} />
              ) : null}

              {eligibility.data && benefit.data && benefit.data.reduction_factor < 1.0 && (
                <EarlyRetirementReduction eligibility={eligibility.data} benefit={benefit.data} />
              )}

              {benefit.data?.ipr && <IPRPanel ipr={benefit.data.ipr} />}
            </div>

            <div className="space-y-6">
              {paymentOptions.isLoading ? (
                <LoadingSpinner message="Calculating payment options..." />
              ) : paymentOptions.data ? (
                <PaymentOptionsComparison result={paymentOptions.data} />
              ) : null}

              {hasDRO && (
                droCalc.isLoading ? (
                  <LoadingSpinner message="Calculating DRO impact..." />
                ) : droCalc.data ? (
                  <DROImpactPanel result={droCalc.data} />
                ) : null
              )}

              <ScenarioModeler memberId={memberId} currentRetirementDate={retirementDate} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function buildAlerts(
  member: import('@/types/Member').Member,
  serviceCredit?: import('@/types/Member').ServiceCreditSummary,
  hasDRO?: boolean
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

  if (member.tier <= 2 && new Date(member.hire_date) < new Date('2010-01-01')) {
    alerts.push({
      id: 'leave-payout',
      severity: 'info',
      title: 'Leave Payout Eligible',
      message: 'Member hired before January 1, 2010 may qualify for sick/vacation leave payout added to final month salary for AMS calculation.',
      ruleRef: 'RMC §18-412',
    })
  }

  if (hasDRO) {
    alerts.push({
      id: 'dro-active',
      severity: 'warning',
      title: 'Active Domestic Relations Order',
      message: 'This member has an active DRO. The benefit will be divided per court order. See DRO Impact panel below for details.',
      ruleRef: 'RMC §18-420',
    })
  }

  return alerts
}
