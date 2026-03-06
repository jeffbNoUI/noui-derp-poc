import { useState, useEffect, useRef } from 'react';
import { useMember, useEmployment, useServiceCredit } from '@/hooks/useMember';
import { useBenefitCalculation } from '@/hooks/useBenefitCalculation';

interface RetirementApplicationProps {
  caseId: string;
  memberId: number;
  retirementDate: string;
  onBack: () => void;
  onChangeView: (mode: string) => void;
}

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const STEPS = [
  { id: 'confirm-retirement', label: 'Confirm Retirement', icon: '📋', description: 'Verify retirement date and type' },
  { id: 'verify-employment', label: 'Verify Employment', icon: '📊', description: 'Review employment history' },
  { id: 'salary-ams', label: 'Salary & AMS', icon: '💰', description: 'Confirm salary data and AMS window' },
  { id: 'eligibility', label: 'Eligibility', icon: '✓', description: 'Review eligibility determination' },
  { id: 'benefit-calc', label: 'Benefit Calculation', icon: '🔢', description: 'Review calculated benefit amount' },
  { id: 'payment-option', label: 'Payment Option', icon: '💳', description: 'Select payment option and beneficiary' },
  { id: 'certification', label: 'Final Certification', icon: '✅', description: 'Final review and certification' },
];

function fmt(n: number | null | undefined): string {
  if (n == null) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Field({
  label,
  value,
  highlight,
  badge,
  sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: { text: string; className: string };
  sub?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100">
      <div>
        <span className="text-sm text-gray-500">{label}</span>
        {sub && <span className="block text-xs text-gray-400 mt-0.5">{sub}</span>}
      </div>
      <span className="flex items-center gap-2">
        {badge && (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${badge.className}`}>
            {badge.text}
          </span>
        )}
        <span className={`font-semibold font-mono text-sm ${highlight ? 'text-iw-sage' : 'text-gray-900'}`}>
          {value}
        </span>
      </span>
    </div>
  );
}

function Callout({ type, title, text }: { type: 'success' | 'warning' | 'info'; title?: string; text: string }) {
  const styles = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-700',
    warning: 'bg-amber-50 border-amber-500 text-amber-700',
    info: 'bg-blue-50 border-blue-500 text-blue-700',
  };
  return (
    <div className={`mt-3 p-3 rounded-lg border-l-[3px] ${styles[type]}`}>
      {title && <div className="text-xs font-bold mb-1">{title}</div>}
      <div className="text-xs leading-relaxed">{text}</div>
    </div>
  );
}

function StepContent({
  stepId,
  member,
  calculation,
  employment,
  serviceCredit,
  retirementDate,
}: {
  stepId: string;
  member: any;
  calculation: any;
  employment: any;
  serviceCredit: any;
  retirementDate: string;
}) {
  const svc = serviceCredit?.summary;
  const elig = calculation?.eligibility;
  const calc = calculation?.benefit;
  const opts = calculation?.payment_options;

  switch (stepId) {
    case 'confirm-retirement':
      return (
        <div>
          <Field label="Retirement Date" value={member ? new Date(retirementDate || '2026-04-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'April 1, 2026'} highlight />
          <Field label="Retirement Type" value="Service Retirement" />
          <Field label="Age at Retirement" value={elig ? `${elig.age_at_retirement} years` : '63 years'} />
          <Field label="Years of Service" value={svc ? `${svc.earned_years.toFixed(2)} years` : '28.75 years'} />
          <Field
            label={elig?.best_eligible_type === 'RULE_OF_85' ? 'Rule of 85' : 'Rule of 75'}
            value={elig ? elig.rule_of_75_sum?.toFixed(2) || elig.rule_of_85_sum?.toFixed(2) || '—' : '91.75'}
            highlight
            badge={elig?.best_eligible_type !== 'EARLY'
              ? { text: 'Met', className: 'bg-emerald-50 text-emerald-700' }
              : { text: 'Not Met', className: 'bg-amber-50 text-amber-700' }
            }
          />
          <Field label="Reduction" value={elig ? `${(elig.reduction_percentage || 0).toFixed(1)}%` : 'None'} />
          {elig && !elig.reduction_percentage && (
            <Callout type="success" text={`Age ${elig.age_at_retirement} + Service ${svc?.earned_years.toFixed(2)} = ${elig.rule_of_75_sum?.toFixed(2) || elig.rule_of_85_sum?.toFixed(2)} — exceeds rule threshold. No early retirement reduction.`} />
          )}
          {elig && elig.reduction_percentage > 0 && (
            <Callout type="warning" title="Early Retirement" text={`Rule threshold not met. ${elig.reduction_percentage.toFixed(1)}% reduction applied.`} />
          )}
        </div>
      );

    case 'verify-employment':
      return (
        <div>
          <Field label="Hire Date" value={member ? new Date(member.hire_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'June 15, 1997'} />
          <Field label="Department" value={member?.department || 'Public Works'} />
          <Field label="Position" value={member?.job_title || 'Senior Engineer'} />
          <Field label="Employment Type" value="Full-time (1.0 FTE)" />
          <Field label="Total Records" value={employment ? `${employment.length} periods — all shown` : '4 periods — all shown'} />
          <Field label="Gaps" value="None detected" badge={{ text: 'Clean', className: 'bg-emerald-50 text-emerald-700' }} />
          <Field label="Purchased Service" value={svc && svc.purchased_service > 0 ? `${svc.purchased_service.toFixed(2)} years` : 'None'} />
        </div>
      );

    case 'salary-ams':
      return (
        <div>
          <Field label="AMS Window" value={calc ? `${member?.tier === 3 ? 60 : 36} consecutive months` : '36 consecutive months'} />
          <Field label="Window Period" value="Apr 2023 — Mar 2026" highlight />
          <Field label="Average Monthly Salary" value={calc ? fmt(calc.average_monthly_salary) : '$8,542.31'} highlight />
          {member && (member.tier_code === 1 || member.tier_code === 2) && (
            <Callout type="warning" title="Leave Payout Impact" text="Leave payout added to final month — AMS boosted. Member hired before Jan 1, 2010." />
          )}
        </div>
      );

    case 'eligibility':
      return (
        <div>
          <Field label="Tier" value={`Tier ${member?.tier || 1}`} badge={{ text: member?.tier === 1 ? 'Pre-2004' : member?.tier === 2 ? '2004-2010' : 'Post-2010', className: member?.tier === 1 ? 'bg-blue-50 text-blue-700' : member?.tier === 2 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700' }} />
          <Field label="Vested" value={elig?.is_vested ? `Yes — ${svc?.earned_years.toFixed(2)} years` : 'No'} badge={elig?.is_vested ? { text: 'Met', className: 'bg-emerald-50 text-emerald-700' } : { text: 'Not Met', className: 'bg-red-50 text-red-700' }} />
          <Field label="Normal Retirement (65)" value={elig?.eligible_normal ? 'Yes' : 'Not yet'} />
          <Field
            label={elig?.best_eligible_type === 'RULE_OF_85' ? 'Rule of 85' : 'Rule of 75'}
            value={elig ? `${(elig.rule_of_75_sum || elig.rule_of_85_sum || 0).toFixed(2)} ≥ ${member?.tier === 3 ? 85 : 75}` : '91.75 ≥ 75'}
            highlight
            badge={elig?.best_eligible_type !== 'EARLY'
              ? { text: 'Met', className: 'bg-emerald-50 text-emerald-700' }
              : { text: 'Not Met', className: 'bg-amber-50 text-amber-700' }
            }
          />
          <Field label="Minimum Age" value={`${elig?.age_at_retirement || 63} — ${(elig?.age_at_retirement || 63) >= (member?.tier === 3 ? 60 : 55) ? 'Met' : 'Not Met'}`} badge={{ text: 'Met', className: 'bg-emerald-50 text-emerald-700' }} />
          <Field label="Benefit Reduction" value={`${(elig?.reduction_percentage || 0).toFixed(1)}%`} highlight />
          <Field label="Leave Payout Eligible" value={(member?.tier_code === 1 || member?.tier_code === 2) ? 'Yes — hired before Jan 1, 2010' : 'No'} />
        </div>
      );

    case 'benefit-calc':
      return (
        <div>
          <div className="bg-iw-sageLight/50 border border-iw-sage/20 rounded-lg p-4 mb-4 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-widest">
              Formula: {calc ? `${(calc.tier_multiplier * 100).toFixed(1)}%` : '2.0%'} × AMS × Years of Service
            </div>
            <div className="text-3xl font-bold text-iw-sage mt-2 font-mono">
              {calc ? fmt(calc.monthly_benefit) : '$4,911.83'}/mo
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {calc ? `${(calc.tier_multiplier * 100).toFixed(1)}% × ${fmt(calc.average_monthly_salary)} × ${calc.service_years?.toFixed(2)}y` : '0.020 × $8,542.31 × 28.75'}
            </div>
          </div>
          <Field label="Multiplier" value={calc ? `${(calc.tier_multiplier * 100).toFixed(1)}% (Tier ${member?.tier})` : '2.0% (Tier 1)'} />
          <Field label="AMS" value={calc ? fmt(calc.average_monthly_salary) : '$8,542.31'} />
          <Field label="Service Credit" value={calc ? `${calc.service_years?.toFixed(2)} years` : '28.75 years'} />
          <Field label="Annual Benefit" value={calc ? fmt((calc.monthly_benefit || 0) * 12) : '$58,941.96'} />
          <Field label="Monthly Benefit" value={calc ? fmt(calc.monthly_benefit) : '$4,911.83'} highlight />
        </div>
      );

    case 'payment-option': {
      const paymentRows = opts
        ? [
            { opt: 'Maximum (Single Life)', amt: fmt(opts.maximum?.monthly_amount), survivor: '—', key: 'max' },
            ...(opts.joint_survivor_100 ? [{ opt: '100% Joint & Survivor', amt: fmt(opts.joint_survivor_100.monthly_amount), survivor: fmt(opts.joint_survivor_100.survivor_amount), key: 'j100' }] : []),
            ...(opts.joint_survivor_75 ? [{ opt: '75% Joint & Survivor', amt: fmt(opts.joint_survivor_75.monthly_amount), survivor: fmt(opts.joint_survivor_75.survivor_amount), key: 'j75' }] : []),
            ...(opts.joint_survivor_50 ? [{ opt: '50% Joint & Survivor', amt: fmt(opts.joint_survivor_50.monthly_amount), survivor: fmt(opts.joint_survivor_50.survivor_amount), key: 'j50' }] : []),
          ]
        : [
            { opt: 'Maximum (Single Life)', amt: '$4,911.83', survivor: '—', key: 'max' },
            { opt: '100% Joint & Survivor', amt: '$4,224.17', survivor: '$4,224.17', key: 'j100' },
            { opt: '75% Joint & Survivor', amt: '$4,420.65', survivor: '$3,315.49', key: 'j75' },
            { opt: '50% Joint & Survivor', amt: '$4,617.12', survivor: '$2,308.56', key: 'j50' },
          ];

      return (
        <div>
          {paymentRows.map((row, idx) => (
            <div
              key={row.key}
              className={`p-3 mb-2 rounded-lg border cursor-pointer transition-colors ${
                idx === 2
                  ? 'border-iw-sage bg-iw-sageLight/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className={`text-sm ${idx === 2 ? 'text-iw-sage font-semibold' : 'text-gray-700'}`}>
                    {idx === 2 ? '● ' : '○ '}{row.opt}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">Survivor: {row.survivor}</div>
                </div>
                <span className={`font-mono font-semibold ${idx === 2 ? 'text-iw-sage' : 'text-gray-900'}`}>
                  {row.amt}
                </span>
              </div>
            </div>
          ))}
          {member?.marital_status === 'M' && (
            <Callout
              type="warning"
              text={`${member?.first_name ? member.first_name + ' ' + member.last_name : 'Member'} is married — spouse must be beneficiary for at least 50% J&S unless spousal consent waiver is signed.`}
            />
          )}
        </div>
      );
    }

    case 'certification': {
      const ipr = calculation?.ipr;
      const deathBenefit = calculation?.death_benefit;
      return (
        <div>
          <Field label="Member" value={member ? `${member.first_name} ${member.last_name}` : 'Robert Martinez'} />
          <Field label="Effective Date" value={member ? new Date(retirementDate || '2026-04-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'April 1, 2026'} />
          <Field label="Monthly Benefit" value={calc ? fmt(calc.monthly_benefit) : '$4,420.65'} highlight />
          <Field label="Payment Option" value="75% J&S" />
          <Field label="IPR Eligible" value={ipr ? `${fmt(ipr.monthly_amount)}/mo` : '$179.69/mo'} />
          <Field label="Death Benefit" value={deathBenefit ? fmt(deathBenefit.lump_sum_amount) : '$5,000'} />
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Ready for Certification</div>
            <button className="px-8 py-2.5 bg-iw-sage text-white rounded-lg font-semibold text-sm hover:bg-iw-sageDark transition-colors">
              Certify & Submit
            </button>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

export default function RetirementApplication({
  caseId,
  memberId,
  retirementDate,
  onBack,
}: RetirementApplicationProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const activeRef = useRef<HTMLDivElement>(null);

  const { data: member } = useMember(memberId);
  const { data: employment } = useEmployment(memberId);
  const { data: svcCreditData } = useServiceCredit(memberId);
  const { data: calculation } = useBenefitCalculation(memberId, retirementDate);

  const advance = () => {
    setCompleted((prev) => new Set([...prev, activeIdx]));
    if (activeIdx < STEPS.length - 1) setActiveIdx(activeIdx + 1);
  };

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeIdx]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                ← Back to Queue
              </button>
              <div className="h-6 w-px bg-gray-200" />
              <div>
                <div className="text-sm font-bold text-iw-navy font-display leading-none">
                  Retirement Application
                </div>
                <div className="text-[10px] text-gray-400 font-mono">{caseId}</div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Step {activeIdx + 1} of {STEPS.length}
            </div>
          </div>
        </div>
      </nav>

      {/* Member banner */}
      {member && (
        <div className="bg-white border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm border-2 ${
                member.tier_code === 1 ? 'bg-blue-50 border-blue-400 text-blue-700' :
                member.tier_code === 2 ? 'bg-amber-50 border-amber-400 text-amber-700' :
                'bg-emerald-50 border-emerald-400 text-emerald-700'
              }`}>
                T{member.tier_code}
              </div>
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {member.first_name} {member.last_name}
                </div>
                <div className="text-xs text-gray-500">
                  ID: {member.member_id} · Age {calcAge(member.dob) || '—'} · {svcCreditData?.summary?.earned_years?.toFixed(2) || '—'}y service
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { label: 'Status', value: member.status_code || 'Active', color: 'text-emerald-600' },
                { label: 'Dept', value: member.dept_name || '—' },
                { label: 'Retiring', value: new Date(retirementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), color: 'text-iw-sage' },
              ].map((t) => (
                <div key={t.label} className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-xs">
                  <span className="text-gray-400">{t.label} </span>
                  <span className={`font-semibold ${t.color || 'text-gray-700'}`}>{t.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all cursor-pointer ${
                  completed.has(i) ? 'bg-iw-sage' : i === activeIdx ? 'bg-iw-sage animate-pulse' : 'bg-gray-200'
                }`}
                onClick={() => (completed.has(i) || i <= activeIdx) && setActiveIdx(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Flow content */}
      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="relative pl-10">
          {/* Timeline line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"
            style={{
              background: `linear-gradient(180deg, rgb(var(--color-iw-sage)) ${((activeIdx + 1) / STEPS.length) * 100}%, #e5e7eb ${((activeIdx + 1) / STEPS.length) * 100}%)`,
            }}
          />

          {STEPS.map((step, i) => {
            const isActive = i === activeIdx;
            const isDone = completed.has(i);
            const isFuture = i > activeIdx;

            return (
              <div
                key={step.id}
                ref={isActive ? activeRef : null}
                className={`relative mb-3 transition-all duration-500 ${isFuture ? 'opacity-40' : ''}`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute -left-6 w-3 h-3 rounded-full border-2 transition-all z-10 ${
                    isDone
                      ? 'bg-iw-sage border-iw-sage'
                      : isActive
                      ? 'bg-iw-sage border-iw-sage shadow-[0_0_8px_rgba(var(--color-iw-sage),0.4)]'
                      : 'bg-gray-200 border-gray-200'
                  }`}
                  style={{ top: isActive ? '20px' : '10px' }}
                />

                {/* Card */}
                <div
                  onClick={() => isDone && setActiveIdx(i)}
                  className={`rounded-xl border overflow-hidden transition-all duration-500 ${
                    isActive
                      ? 'border-iw-sage shadow-lg bg-white'
                      : isDone
                      ? 'border-gray-200 bg-white cursor-pointer hover:border-gray-300'
                      : 'border-transparent'
                  }`}
                >
                  {/* Header */}
                  <div className={`flex justify-between items-center ${isActive ? 'px-5 py-4' : 'px-4 py-2'}`}>
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? 'text-xl' : 'text-sm'} transition-all`}>{step.icon}</span>
                      <span className={`${
                        isActive ? 'text-gray-900 font-bold text-[15px]' :
                        isDone ? 'text-gray-500 font-medium text-sm' :
                        'text-gray-400 text-sm'
                      }`}>
                        {step.label}
                        {isDone && !isActive && <span className="text-iw-sage text-xs ml-2">✓</span>}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-xs text-gray-400">Step {i + 1}/{STEPS.length}</span>
                    )}
                  </div>

                  {/* Expanded content (active step only) */}
                  {isActive && (
                    <div className="px-5 pb-5">
                      <StepContent
                        stepId={step.id}
                        member={member}
                        calculation={calculation}
                        employment={employment}
                        serviceCredit={svcCreditData}
                        retirementDate={retirementDate}
                      />
                      <div className="mt-5 flex justify-between">
                        <button
                          onClick={() => activeIdx > 0 && setActiveIdx(activeIdx - 1)}
                          disabled={activeIdx === 0}
                          className={`px-4 py-2 rounded-lg border text-sm ${
                            activeIdx === 0
                              ? 'border-gray-200 text-gray-300 cursor-default'
                              : 'border-gray-300 text-gray-500 hover:bg-gray-50 cursor-pointer'
                          }`}
                        >
                          ← Previous
                        </button>
                        <button
                          onClick={advance}
                          className="px-6 py-2 rounded-lg bg-iw-sage text-white font-semibold text-sm hover:bg-iw-sageDark transition-colors shadow-sm"
                        >
                          {i === STEPS.length - 1 ? 'Complete ✓' : 'Confirm & Continue ↓'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
