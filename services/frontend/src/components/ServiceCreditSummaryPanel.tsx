import type { ServiceCreditSummary } from '@/types/Member'
import { Award, AlertTriangle } from 'lucide-react'

interface ServiceCreditSummaryPanelProps {
  serviceCredit: ServiceCreditSummary
  tier: number
}

export function ServiceCreditSummaryPanel({ serviceCredit, tier }: ServiceCreditSummaryPanelProps) {
  const hasPurchased = serviceCredit.purchased_service_years > 0
  const hasMilitary = serviceCredit.military_service_years > 0
  const ruleOfN = tier === 3 ? 85 : 75

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Service Credit Summary</h2>
      </div>

      <div className="space-y-3">
        <CreditRow
          label="Earned Service"
          value={`${serviceCredit.earned_service_years.toFixed(2)} years`}
          description="Service credit earned through employment"
        />

        {hasPurchased && (
          <CreditRow
            label="Purchased Service"
            value={`${serviceCredit.purchased_service_years.toFixed(2)} years`}
            description="Purchased service credit (military, prior service, etc.)"
          />
        )}

        {hasMilitary && (
          <CreditRow
            label="Military Service"
            value={`${serviceCredit.military_service_years.toFixed(2)} years`}
            description="Credited military service"
          />
        )}

        <div className="border-t border-border pt-3">
          <CreditRow
            label="Total for Benefit Calculation"
            value={`${serviceCredit.total_for_benefit.toFixed(2)} years`}
            description="Earned + purchased — used in benefit formula"
            highlight
          />
          <CreditRow
            label={`Total for Rule of ${ruleOfN} / IPR`}
            value={`${serviceCredit.total_for_eligibility.toFixed(2)} years`}
            description="Earned only — purchased service excluded"
          />
        </div>
      </div>

      {hasPurchased && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">Purchased Service Credit Distinction</p>
            <p className="mt-1">
              Purchased service credit of {serviceCredit.purchased_service_years.toFixed(2)} years
              counts toward the <strong>benefit calculation</strong> (increases the benefit amount)
              but is <strong>excluded</strong> from Rule of {ruleOfN} eligibility and IPR calculation.
            </p>
            <p className="mt-1 text-amber-600">Source: RMC §18-407</p>
          </div>
        </div>
      )}

      {/* Visual bar */}
      <div className="mt-4">
        <div className="flex items-center gap-1 text-xs text-muted mb-1">
          <span>Service Credit Breakdown</span>
        </div>
        <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
          <div
            className="bg-primary"
            style={{
              width: `${(serviceCredit.earned_service_years / serviceCredit.total_for_benefit) * 100}%`,
            }}
            title={`Earned: ${serviceCredit.earned_service_years.toFixed(2)} years`}
          />
          {hasPurchased && (
            <div
              className="bg-amber-400"
              style={{
                width: `${(serviceCredit.purchased_service_years / serviceCredit.total_for_benefit) * 100}%`,
              }}
              title={`Purchased: ${serviceCredit.purchased_service_years.toFixed(2)} years`}
            />
          )}
          {hasMilitary && (
            <div
              className="bg-teal-400"
              style={{
                width: `${(serviceCredit.military_service_years / serviceCredit.total_for_benefit) * 100}%`,
              }}
              title={`Military: ${serviceCredit.military_service_years.toFixed(2)} years`}
            />
          )}
        </div>
        <div className="flex gap-3 mt-1 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Earned
          </span>
          {hasPurchased && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Purchased
            </span>
          )}
          {hasMilitary && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-400" /> Military
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function CreditRow({
  label,
  value,
  description,
  highlight,
}: {
  label: string
  value: string
  description: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start justify-between py-1">
      <div>
        <p className={`text-sm ${highlight ? 'text-primary font-semibold' : 'text-gray-900'}`}>
          {label}
        </p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <p className={`text-sm font-mono ${highlight ? 'text-primary font-bold' : 'font-semibold'}`}>
        {value}
      </p>
    </div>
  )
}
