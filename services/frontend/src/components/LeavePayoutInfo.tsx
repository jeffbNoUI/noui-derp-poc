/**
 * Anti-spiking detail panel — displays salary capping under C.R.S. §24-51-101(25.5).
 * COPERA uses 108% cascading salary cap per C.R.S. §24-51-101(25.5).
 * Consumed by: BenefitWorkspace (when anti-spiking is triggered)
 * Depends on: AntiSpikingYear type
 *
 * Note: File retains LeavePayoutInfo name for backward compatibility with existing imports.
 */
import type { Member, AntiSpikingYear } from '@/types/Member'
import { AlertTriangle, Shield } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface LeavePayoutInfoProps {
  member: Member
  leavePayoutAmount?: number
  antiSpikingDetail?: AntiSpikingYear[]
}

export function LeavePayoutInfo({ member, antiSpikingDetail }: LeavePayoutInfoProps) {
  // COPERA: no leave payout concept. This component now shows anti-spiking details.
  if (!antiSpikingDetail || antiSpikingDetail.length === 0) return null

  const cappedYears = antiSpikingDetail.filter(d => d.cap_applied)
  if (cappedYears.length === 0) return null

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-semibold text-gray-900">Anti-Spiking Detail</h2>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-sm">
        <p className="text-amber-800">
          <strong>Anti-spiking applies.</strong> Salary in the HAS window is capped at 108% of
          the prior year's salary (base year method). This prevents pension benefit inflation
          from large salary increases near retirement.
        </p>
        <p className="text-amber-600 mt-1 text-xs">Source: C.R.S. §24-51-101(25.5)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted font-medium">Year</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Actual Pay</th>
              <th className="text-right py-2 px-3 text-muted font-medium">108% Cap</th>
              <th className="text-right py-2 px-3 text-muted font-medium">Used Pay</th>
              <th className="text-center py-2 px-3 text-muted font-medium">Capped</th>
            </tr>
          </thead>
          <tbody>
            {antiSpikingDetail.map((d, i) => (
              <tr key={i} className={`border-b border-border/50 ${d.cap_applied ? 'bg-amber-50/50' : ''}`}>
                <td className="py-2 px-3 font-medium">{d.year}</td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(d.actual_pay)}</td>
                <td className="py-2 px-3 text-right font-mono">{formatCurrency(d.cap_amount)}</td>
                <td className="py-2 px-3 text-right font-mono font-semibold">{formatCurrency(d.used_pay)}</td>
                <td className="py-2 px-3 text-center">
                  {d.cap_applied ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                      <AlertTriangle className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="text-green-600">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted italic">
        Member: {member.first_name} {member.last_name} ({member.division} Division)
      </p>
    </div>
  )
}
