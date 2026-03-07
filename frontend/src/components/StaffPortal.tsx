import { useState, useEffect } from 'react';
import SupervisorDashboard from '@/components/staff/SupervisorDashboard';
import MemberSearch from '@/components/staff/MemberSearch';
import ExecutiveDashboard from '@/components/staff/ExecutiveDashboard';
import CSRContextHub from '@/components/staff/CSRContextHub';
import ServiceMap from '@/components/admin/ServiceMap';
import DataQualityPanel from '@/components/admin/DataQualityPanel';
import CorrespondencePanel from '@/components/workflow/CorrespondencePanel';

interface StaffPortalProps {
  onOpenCase: (caseId: string, memberId: number, retDate: string, flags?: string[]) => void;
  onChangeView: (mode: string) => void;
}

type StaffTab = 'queue' | 'search' | 'supervisor' | 'executive' | 'csr' | 'service-map' | 'dq' | 'correspondence';

const WORK_QUEUE = [
  {
    caseId: 'RET-2026-0147',
    memberId: 10001,
    name: 'Robert Martinez',
    tier: 1,
    dept: 'Public Works',
    retDate: '2026-04-01',
    stage: 'Benefit Calculation',
    stageIdx: 4,
    priority: 'standard' as const,
    sla: 'on-track' as const,
    daysOpen: 5,
    flags: ['leave-payout'],
    assignedTo: 'Sarah Chen',
  },
  {
    caseId: 'RET-2026-0152',
    memberId: 10002,
    name: 'Jennifer Kim',
    tier: 2,
    dept: 'Finance',
    retDate: '2026-05-01',
    stage: 'Eligibility Review',
    stageIdx: 2,
    priority: 'high' as const,
    sla: 'at-risk' as const,
    daysOpen: 12,
    flags: ['early-retirement', 'purchased-service'],
    assignedTo: 'Sarah Chen',
  },
  {
    caseId: 'RET-2026-0159',
    memberId: 10003,
    name: 'David Washington',
    tier: 3,
    dept: 'Parks & Rec',
    retDate: '2026-04-01',
    stage: 'Document Verification',
    stageIdx: 1,
    priority: 'standard' as const,
    sla: 'on-track' as const,
    daysOpen: 3,
    flags: ['early-retirement'],
    assignedTo: 'Sarah Chen',
  },
  {
    caseId: 'DRO-2026-0031',
    memberId: 10001,
    name: 'Robert Martinez (DRO)',
    tier: 1,
    dept: 'Public Works',
    retDate: '2026-04-01',
    stage: 'Marital Share Calculation',
    stageIdx: 3,
    priority: 'urgent' as const,
    sla: 'urgent' as const,
    daysOpen: 18,
    flags: ['leave-payout', 'dro'],
    assignedTo: 'Sarah Chen',
  },
];

const STAGES = [
  'Application Intake',
  'Document Verification',
  'Eligibility Review',
  'Marital Share Calculation',
  'Benefit Calculation',
  'Election Recording',
  'Certification',
];

const PRIORITY_STYLES = {
  urgent: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  standard: 'bg-gray-50 text-gray-600 border-gray-200',
  low: 'bg-blue-50 text-blue-600 border-blue-200',
};

const SLA_STYLES = {
  'on-track': { label: 'On Track', className: 'bg-emerald-50 text-emerald-700' },
  'at-risk': { label: 'At Risk', className: 'bg-amber-50 text-amber-700' },
  urgent: { label: 'Urgent', className: 'bg-red-50 text-red-700' },
};

const TIER_STYLES: Record<number, string> = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-amber-50 text-amber-700 border-amber-200',
  3: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const SIDEBAR_NAV = [
  { key: 'queue' as StaffTab, label: 'Work Queue', icon: '\ud83d\udccb', shortcut: 'G Q' },
  { key: 'search' as StaffTab, label: 'Member Lookup', icon: '\ud83d\udd0d', shortcut: 'G M' },
  { key: 'supervisor' as StaffTab, label: 'Supervisor', icon: '\ud83d\udcca', shortcut: 'G S' },
  { key: 'executive' as StaffTab, label: 'Executive', icon: '\ud83d\udcc8', shortcut: 'G E' },
  { key: 'csr' as StaffTab, label: 'CSR Hub', icon: '\ud83d\udcde', shortcut: 'G C' },
  { key: 'service-map' as StaffTab, label: 'Service Map', icon: '\ud83d\uddfa\ufe0f', shortcut: 'G P' },
  { key: 'dq' as StaffTab, label: 'Data Quality', icon: '\ud83d\udee1\ufe0f', shortcut: 'G D' },
  { key: 'correspondence' as StaffTab, label: 'Correspondence', icon: '\u2709\ufe0f', shortcut: 'G X' },
];

export default function StaffPortal({ onOpenCase, onChangeView }: StaffPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<StaffTab>('queue');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setTimeout(() => setLoaded(true), 60); }, []);

  const filteredQueue = WORK_QUEUE.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.dept.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: WORK_QUEUE.length,
    urgent: WORK_QUEUE.filter((w) => w.priority === 'urgent').length,
    atRisk: WORK_QUEUE.filter((w) => w.sla === 'at-risk' || w.sla === 'urgent').length,
    avgDays: Math.round(WORK_QUEUE.reduce((a, w) => a + w.daysOpen, 0) / WORK_QUEUE.length),
  };

  const handleMemberSelect = (memberId: number) => {
    const match = WORK_QUEUE.find((w) => w.memberId === memberId);
    if (match) {
      onOpenCase(match.caseId, match.memberId, match.retDate, match.flags);
    }
  };

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="iw-page flex">
      {/* ═══ Sidebar ═══ */}
      <aside className="w-56 bg-white border-r border-iw-border flex flex-col">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-iw-border">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-iw-navy to-iw-navyLight flex items-center justify-center text-white font-bold text-sm font-display">
              N
            </div>
            <div>
              <div className="text-sm font-bold text-iw-navy font-display leading-none">NoUI</div>
              <div className="text-[9px] text-iw-textTertiary tracking-[1.5px] uppercase font-semibold">Staff Portal</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {SIDEBAR_NAV.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-all ${
                activeTab === item.key
                  ? 'bg-iw-sageLight/60 text-iw-sage border-r-2 border-iw-sage font-semibold'
                  : 'text-iw-textSecondary hover:bg-iw-page hover:text-iw-text'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </div>
              <kbd className="text-[9px] text-iw-textTertiary/50 font-mono">{item.shortcut}</kbd>
            </button>
          ))}

          <div className="h-px bg-iw-borderLight my-2 mx-4" />

          {/* Portal links */}
          {[
            { key: 'portal', label: 'Member Portal', icon: '\ud83d\udc64' },
            { key: 'workspace', label: 'Agent Workspace', icon: '\ud83e\uddee' },
            { key: 'crm', label: 'CRM', icon: '\ud83d\udcac' },
            { key: 'employer', label: 'Employer Portal', icon: '\ud83c\udfe2' },
            { key: 'vendor', label: 'Vendor Portal', icon: '\ud83c\udfe5' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => onChangeView(item.key)}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-iw-textTertiary hover:bg-iw-page hover:text-iw-textSecondary transition-all"
            >
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-4 py-3 border-t border-iw-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-iw-sageLight to-iw-goldLight flex items-center justify-center text-xs font-bold text-iw-navy border border-iw-border">
              SC
            </div>
            <div>
              <div className="text-xs font-semibold text-iw-text">Sarah Chen</div>
              <div className="text-[10px] text-iw-textTertiary">Benefits Analyst</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ═══ Main content ═══ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ═══ Hero Banner ═══ */}
        <div className="iw-hero-navy px-8 py-7">
          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="text-[11px] text-white/40 font-semibold tracking-[1.5px] uppercase mb-1">Denver Employees Retirement Plan</div>
              <h1 className="text-2xl font-display font-semibold text-white tracking-tight leading-tight">
                {greeting}, Sarah.
              </h1>
              <p className="text-sm text-white/55 mt-1.5 max-w-md">
                {stats.total} active case{stats.total !== 1 ? 's' : ''} in your queue.
                {stats.urgent > 0 && <> <span className="text-red-300 font-semibold">{stats.urgent} urgent</span> requiring attention.</>}
                {stats.atRisk > 0 && stats.urgent === 0 && <> {stats.atRisk} at SLA risk.</>}
                {stats.urgent === 0 && stats.atRisk === 0 && <> All SLAs on track.</>}
              </p>
            </div>

            {/* Hero stat pills */}
            <div className="flex gap-3 items-center">
              {[
                { label: 'Active Cases', value: String(stats.total), color: 'text-white' },
                { label: 'Urgent', value: String(stats.urgent), color: stats.urgent > 0 ? 'text-red-300' : 'text-emerald-300' },
                { label: 'SLA At Risk', value: String(stats.atRisk), color: stats.atRisk > 0 ? 'text-amber-300' : 'text-emerald-300' },
                { label: 'Avg Days', value: String(stats.avgDays), color: 'text-white' },
              ].map((pill, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-center px-5 py-3 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm">
                    <div className={`text-xl font-display font-bold ${pill.color}`}>{pill.value}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 font-medium">{pill.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Sub-header bar ═══ */}
        <div className="bg-white border-b border-iw-border px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-iw-navy font-display">
              {{ queue: 'My Work Queue', search: 'Member / Employer Lookup', supervisor: 'Supervisor Dashboard', executive: 'Executive Dashboard', csr: 'CSR Context Hub', 'service-map': 'Platform Service Map', dq: 'Data Quality', correspondence: 'Correspondence' }[activeTab]}
            </h2>
            {activeTab === 'queue' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-iw-sageLight text-iw-sage font-semibold">{filteredQueue.length} case{filteredQueue.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeTab === 'queue' && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter cases..."
                className="w-56 rounded-xl border border-iw-border px-3 py-1.5 text-sm focus:border-iw-sage focus:ring-1 focus:ring-iw-sage outline-none bg-iw-page placeholder:text-iw-textTertiary"
              />
            )}
            <div className="text-[10px] text-iw-textTertiary font-mono px-2 py-1 rounded-lg bg-iw-page border border-iw-borderLight">&#8984;K</div>
          </div>
        </div>

        <main className="p-6 flex-1">
          {/* Work Queue tab */}
          {activeTab === 'queue' && (
            <div className="iw-view-enter">
              {/* Queue table */}
              <div className="iw-card overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-iw-page border-b border-iw-border text-[10px] font-semibold text-iw-textTertiary uppercase tracking-wider">
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-2">Case ID</div>
                  <div className="col-span-3">Member</div>
                  <div className="col-span-2">Current Stage</div>
                  <div className="col-span-1">SLA</div>
                  <div className="col-span-1">Days</div>
                  <div className="col-span-2">Flags</div>
                </div>

                <div className={loaded ? 'iw-stagger' : ''}>
                  {filteredQueue.map((item) => (
                    <div
                      key={item.caseId}
                      onClick={() => onOpenCase(item.caseId, item.memberId, item.retDate, item.flags)}
                      className="grid grid-cols-12 gap-2 px-5 py-3.5 border-b border-iw-borderLight hover:bg-iw-sageLight/20 cursor-pointer transition-all items-center group"
                    >
                      <div className="col-span-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[item.priority]}`}>
                          {item.priority}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm font-mono font-semibold text-iw-navy group-hover:text-iw-sage transition-colors">{item.caseId}</span>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_STYLES[item.tier]}`}>
                            T{item.tier}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-iw-text">{item.name}</div>
                            <div className="text-xs text-iw-textTertiary">{item.dept}</div>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-iw-textSecondary">{item.stage}</div>
                        <div className="flex gap-0.5 mt-1.5">
                          {STAGES.slice(0, 7).map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 flex-1 rounded-full transition-all ${
                                idx < item.stageIdx
                                  ? 'bg-iw-sage'
                                  : idx === item.stageIdx
                                  ? 'bg-iw-sage animate-pulse'
                                  : 'bg-iw-borderLight'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SLA_STYLES[item.sla].className}`}>
                          {SLA_STYLES[item.sla].label}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm text-iw-textSecondary font-mono">{item.daysOpen}d</span>
                      </div>
                      <div className="col-span-2">
                        <div className="flex flex-wrap gap-1">
                          {item.flags.map((flag) => (
                            <span key={flag} className="text-[10px] px-2 py-0.5 rounded-lg bg-iw-page text-iw-textSecondary border border-iw-borderLight">
                              {flag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredQueue.length === 0 && (
                  <div className="px-4 py-8 text-center text-iw-textTertiary text-sm">
                    No cases match your search.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member Search tab */}
          {activeTab === 'search' && (
            <div className="max-w-2xl mx-auto iw-view-enter">
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-iw-textSecondary mb-2">Search for a member or employer</h2>
                <MemberSearch onSelect={handleMemberSelect} />
              </div>
              <div className="text-xs text-iw-textTertiary text-center">
                Try: 10001, Robert Martinez, Public Works, Jennifer Kim
              </div>
            </div>
          )}

          {/* Supervisor Dashboard tab */}
          {activeTab === 'supervisor' && <div className="iw-view-enter"><SupervisorDashboard /></div>}

          {/* Executive Dashboard tab */}
          {activeTab === 'executive' && <div className="iw-view-enter"><ExecutiveDashboard /></div>}

          {/* CSR Context Hub tab */}
          {activeTab === 'csr' && <div className="iw-view-enter"><CSRContextHub /></div>}

          {/* Service Map tab */}
          {activeTab === 'service-map' && <div className="iw-view-enter"><ServiceMap /></div>}

          {/* Data Quality tab */}
          {activeTab === 'dq' && <div className="iw-view-enter"><DataQualityPanel /></div>}

          {/* Correspondence tab */}
          {activeTab === 'correspondence' && <div className="iw-view-enter"><CorrespondencePanel /></div>}

          <footer className="mt-8 rounded-2xl bg-iw-warm border border-iw-borderLight px-6 py-4 text-center">
            <p className="text-[11px] font-semibold text-iw-textTertiary tracking-wide">Phase 1: Transparent</p>
            <p className="text-[11px] text-iw-textTertiary mt-1">
              AI-composed workspace. Cases routed by member context, SLA status, and case complexity.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
