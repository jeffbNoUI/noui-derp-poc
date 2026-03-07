import type { Member } from '@/types/Member';
import { formatDate, tierLabel, statusLabel } from '@/lib/formatters';

interface MemberBannerProps {
  member: Member;
}

const tierColors: Record<number, string> = {
  1: 'bg-tier-1',
  2: 'bg-tier-2',
  3: 'bg-tier-3',
};

const statusColors: Record<string, string> = {
  A: 'bg-status-active',
  R: 'bg-status-retired',
  D: 'bg-status-deferred',
  T: 'bg-status-terminated',
};

export default function MemberBanner({ member }: MemberBannerProps) {
  return (
    <div className="iw-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-iw-sageLight to-iw-goldLight text-lg font-bold text-iw-navy border border-iw-border">
            {member.first_name[0]}{member.last_name[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-iw-navy font-display">
              {member.first_name} {member.middle_name ? `${member.middle_name} ` : ''}{member.last_name}
            </h1>
            <p className="text-sm text-iw-textTertiary">
              Member ID: <span className="font-mono">{member.member_id}</span>
              {member.dept_name && <> &middot; {member.dept_name}</>}
              {member.pos_title && <> &middot; {member.pos_title}</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white ${tierColors[member.tier_code] || 'bg-gray-500'}`}>
            {tierLabel(member.tier_code)}
          </span>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white ${statusColors[member.status_code] || 'bg-gray-500'}`}>
            {statusLabel(member.status_code)}
          </span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-4 border-t border-iw-borderLight pt-3 text-sm">
        <div>
          <span className="text-iw-textTertiary text-xs">Date of Birth</span>
          <p className="font-medium text-iw-text">{formatDate(member.dob)}</p>
        </div>
        <div>
          <span className="text-iw-textTertiary text-xs">Hire Date</span>
          <p className="font-medium text-iw-text">{formatDate(member.hire_date)}</p>
        </div>
        <div>
          <span className="text-iw-textTertiary text-xs">Marital Status</span>
          <p className="font-medium text-iw-text">
            {member.marital_status === 'M' ? 'Married' :
             member.marital_status === 'S' ? 'Single' :
             member.marital_status === 'D' ? 'Divorced' :
             member.marital_status === 'W' ? 'Widowed' : member.marital_status}
          </p>
        </div>
        <div>
          <span className="text-iw-textTertiary text-xs">Medicare</span>
          <p className="font-medium text-iw-text">{member.medicare_flag === 'Y' ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}
