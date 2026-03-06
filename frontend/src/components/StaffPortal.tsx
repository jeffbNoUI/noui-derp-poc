import { useState } from 'react';

interface StaffPortalProps {
  onOpenCase: (caseId: string, memberId: number, retDate: string) => void;
  onChangeView: (mode: string) => void;
}

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

export default function StaffPortal({ onOpenCase, onChangeView }: StaffPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'queue' | 'search'>('queue');

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-iw-navy to-iw-navyLight flex items-center justify-center text-white font-bold text-sm font-display">
                  N
                </div>
                <div>
                  <div className="text-sm font-bold text-iw-navy font-display leading-none">NoUI</div>
                  <div className="text-[9px] text-gray-400 tracking-widest uppercase font-semibold">Staff Portal</div>
                </div>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex gap-1">
                {[
                  { key: 'staff', label: 'Staff Portal' },
                  { key: 'portal', label: 'Member Portal' },
                  { key: 'workspace', label: 'Agent Workspace' },
                  { key: 'crm', label: 'CRM' },
                  { key: 'employer', label: 'Employer Portal' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => onChangeView(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tab.key === 'staff'
                        ? 'bg-iw-sageLight text-iw-sage'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-400">Sarah Chen, Benefits Analyst</div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Active Cases</div>
            <div className="text-2xl font-bold text-iw-navy mt-1">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Urgent</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.urgent}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">SLA At Risk</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.atRisk}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Avg Days Open</div>
            <div className="text-2xl font-bold text-gray-700 mt-1">{stats.avgDays}</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('queue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'queue'
                  ? 'bg-iw-sage text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              My Work Queue
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-iw-sage text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Member / Employer Lookup
            </button>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases, members, employers..."
            className="w-72 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-iw-sage focus:ring-1 focus:ring-iw-sage outline-none"
          />
        </div>

        {activeTab === 'queue' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Queue header */}
            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Priority</div>
              <div className="col-span-2">Case ID</div>
              <div className="col-span-3">Member</div>
              <div className="col-span-2">Current Stage</div>
              <div className="col-span-1">SLA</div>
              <div className="col-span-1">Days</div>
              <div className="col-span-2">Flags</div>
            </div>

            {/* Queue rows */}
            {filteredQueue.map((item) => (
              <div
                key={item.caseId}
                onClick={() => onOpenCase(item.caseId, item.memberId, item.retDate)}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 hover:bg-iw-sageLight/30 cursor-pointer transition-colors items-center"
              >
                <div className="col-span-1">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${PRIORITY_STYLES[item.priority]}`}
                  >
                    {item.priority}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-mono font-semibold text-iw-navy">{item.caseId}</span>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TIER_STYLES[item.tier]}`}
                    >
                      T{item.tier}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.dept}</div>
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm text-gray-700">{item.stage}</div>
                  <div className="flex gap-0.5 mt-1">
                    {STAGES.slice(0, 7).map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 flex-1 rounded-full ${
                          idx < item.stageIdx
                            ? 'bg-iw-sage'
                            : idx === item.stageIdx
                            ? 'bg-iw-sage animate-pulse'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SLA_STYLES[item.sla].className}`}
                  >
                    {SLA_STYLES[item.sla].label}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="text-sm text-gray-600">{item.daysOpen}d</span>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {item.flags.map((flag) => (
                      <span
                        key={flag}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filteredQueue.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">
                No cases match your search.
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-400 text-sm mb-4">
              Search for a member by ID, name, SSN, or look up an employer by name or code.
            </div>
            <input
              type="text"
              placeholder="Enter member ID, name, or employer..."
              className="w-96 rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-iw-sage focus:ring-1 focus:ring-iw-sage outline-none"
            />
            <div className="mt-6 text-xs text-gray-400">
              Try: 10001, Robert Martinez, Public Works
            </div>
          </div>
        )}

        <footer className="mt-6 rounded-lg bg-gray-100 px-6 py-4 text-center text-xs text-gray-500">
          <p className="font-medium">NoUI Staff Portal — Phase 1</p>
          <p>
            AI-composed workspace. Cases are routed and prioritized based on member context, SLA status, and case complexity.
          </p>
        </footer>
      </main>
    </div>
  );
}
