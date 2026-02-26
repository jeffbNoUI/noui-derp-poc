import type { Member } from '@/types/Member'
import { Clock, AlertTriangle } from 'lucide-react'

interface LeavePayoutInfoProps {
  member: Member
  leavePayoutAmount?: number
}

export function LeavePayoutInfo({ member, leavePayoutAmount }: LeavePayoutInfoProps) {
  const hiredBefore2010 = new Date(member.hire_date) < new Date('2010-01-01')
  const isEligible = member.tier <= 2 && hiredBefore2010

  if (!isEligible) return null

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-gray-900">Leave Payout</h2>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 text-sm">
        <p className="text-blue-800">
          <strong>Eligible for leave payout.</strong> Member was hired before January 1, 2010
          with sick/vacation leave (not PTO).
        </p>
        <p className="text-blue-700 mt-1 text-xs">
          The payout amount is added to the final month of salary, which may increase the
          Average Monthly Salary (AMS) if the final months fall within the highest consecutive window.
        </p>
        <p className="text-blue-600 mt-1 text-xs">Source: RMC §18-412</p>
      </div>

      {leavePayoutAmount !== undefined && leavePayoutAmount > 0 && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Leave Payout Amount</span>
            <span className="font-mono font-semibold">
              ${leavePayoutAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-start gap-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
            <span className="text-amber-800">
              This amount is added to the final month's pensionable pay. The AMS calculation
              includes this when computing the highest consecutive salary window.
            </span>
          </div>
        </div>
      )}

      {(leavePayoutAmount === undefined || leavePayoutAmount === 0) && (
        <p className="text-sm text-muted italic">
          No leave payout amount recorded. Member may still be eligible — verify with HR records.
        </p>
      )}
    </div>
  )
}
