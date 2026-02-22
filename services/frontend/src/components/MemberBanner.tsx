import type { Member, ServiceCreditSummary } from '@/types/Member'
import { formatDate } from '@/lib/utils'
import { User, Calendar, Building2, Briefcase } from 'lucide-react'

const tierLabels: Record<number, string> = {
  1: 'Tier 1 — Hired before Sept 1, 2004',
  2: 'Tier 2 — Sept 1, 2004 to June 30, 2011',
  3: 'Tier 3 — On/after July 1, 2011',
}

const tierColors: Record<number, string> = {
  1: 'bg-blue-100 text-blue-800 border-blue-200',
  2: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  3: 'bg-amber-100 text-amber-800 border-amber-200',
}

interface MemberBannerProps {
  member: Member
  serviceCredit?: ServiceCreditSummary
}

export function MemberBanner({ member, serviceCredit }: MemberBannerProps) {
  const age = Math.floor(
    (Date.now() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  )

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {member.first_name} {member.last_name}
            </h1>
            <p className="text-sm text-muted">Member ID: {member.member_id}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
            tierColors[member.tier] ?? 'bg-gray-100 text-gray-800'
          }`}
        >
          Tier {member.tier}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoItem icon={Calendar} label="Date of Birth" value={`${formatDate(member.date_of_birth)} (age ${age})`} />
        <InfoItem icon={Calendar} label="Hire Date" value={formatDate(member.hire_date)} />
        <InfoItem icon={Building2} label="Department" value={member.department} />
        <InfoItem icon={Briefcase} label="Position" value={member.position} />
      </div>

      {serviceCredit && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted">Total Service</span>
              <p className="font-semibold">{serviceCredit.total_service_years.toFixed(2)} years</p>
            </div>
            <div>
              <span className="text-muted">Earned Service</span>
              <p className="font-semibold">{serviceCredit.earned_service_years.toFixed(2)} years</p>
            </div>
            {serviceCredit.purchased_service_years > 0 && (
              <div>
                <span className="text-muted">Purchased Service</span>
                <p className="font-semibold">{serviceCredit.purchased_service_years.toFixed(2)} years</p>
              </div>
            )}
            {serviceCredit.military_service_years > 0 && (
              <div>
                <span className="text-muted">Military Service</span>
                <p className="font-semibold">{serviceCredit.military_service_years.toFixed(2)} years</p>
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-muted italic">
            Tier: {tierLabels[member.tier]}
          </p>
        </div>
      )}
    </div>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
