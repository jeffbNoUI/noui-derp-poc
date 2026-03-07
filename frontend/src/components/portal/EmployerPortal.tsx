import { useState } from 'react';
import {
  useEmployerConversations,
  usePublicConversationInteractions,
  useCreatePortalMessage,
  useCreateNewConversation,
  useDemoOrganizations,
  useDemoOrganization,
} from '@/hooks/useCRM';
import { ConversationThread, MessageComposer, EMPLOYER_THEME } from '@/components/crm';

// ── Main component ──────────────────────────────────────────────────────────

type ViewMode = 'portal' | 'workspace' | 'crm' | 'employer';

interface EmployerPortalProps {
  onChangeView: (mode: ViewMode) => void;
}

type PortalTab = 'communications' | 'reporting' | 'enrollment';

// ── Demo contribution reporting data ────────────────────────────────────────
const DEMO_REPORTING_PERIODS = [
  { period: 'January 2026', dueDate: '2026-02-15', status: 'submitted', members: 142, eeTotal: 48230.50, erTotal: 72345.75, submittedDate: '2026-02-12' },
  { period: 'December 2025', dueDate: '2026-01-15', status: 'accepted', members: 140, eeTotal: 47890.00, erTotal: 71835.00, submittedDate: '2025-01-10' },
  { period: 'November 2025', dueDate: '2025-12-15', status: 'accepted', members: 140, eeTotal: 47890.00, erTotal: 71835.00, submittedDate: '2025-12-08' },
  { period: 'October 2025', dueDate: '2025-11-15', status: 'accepted', members: 139, eeTotal: 47560.25, erTotal: 71340.38, submittedDate: '2025-11-14' },
  { period: 'September 2025', dueDate: '2025-10-15', status: 'accepted', members: 138, eeTotal: 47120.00, erTotal: 70680.00, submittedDate: '2025-10-11' },
  { period: 'August 2025', dueDate: '2025-09-15', status: 'accepted', members: 138, eeTotal: 47120.00, erTotal: 70680.00, submittedDate: '2025-09-09' },
];

const REPORT_STATUS: Record<string, { tw: string; label: string }> = {
  draft: { tw: 'bg-iw-page text-iw-textTertiary', label: 'Draft' },
  submitted: { tw: 'bg-blue-100 text-blue-800', label: 'Submitted' },
  accepted: { tw: 'bg-emerald-50 text-emerald-700', label: 'Accepted' },
  rejected: { tw: 'bg-red-50 text-red-700', label: 'Rejected' },
  overdue: { tw: 'bg-red-50 text-red-700', label: 'Overdue' },
};

export default function EmployerPortal({ onChangeView }: EmployerPortalProps) {
  const [selectedOrgId, setSelectedOrgId] = useState('ORG-001');
  const [selectedConvId, setSelectedConvId] = useState('');
  const [composing, setComposing] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [activeTab, setActiveTab] = useState<PortalTab>('communications');

  const { data: organizations } = useDemoOrganizations();
  const { data: org } = useDemoOrganization(selectedOrgId);
  const { data: conversations } = useEmployerConversations(selectedOrgId);
  const { data: interactions } = usePublicConversationInteractions(selectedConvId);
  const sendMessage = useCreatePortalMessage();
  const createConv = useCreateNewConversation();

  const orgList = organizations ?? [];
  const convList = conversations ?? [];
  const effectiveConvId = selectedConvId || (convList.length > 0 ? convList[0].conversationId : '');

  const handleSend = (message: string) => {
    if (composing) {
      if (!newSubject.trim()) return;
      createConv.mutate({
        anchorType: 'organization',
        anchorId: selectedOrgId,
        subject: newSubject.trim(),
        initialMessage: message,
        orgId: selectedOrgId,
        direction: 'inbound',
      }, {
        onSuccess: (result) => {
          setComposing(false);
          setNewSubject('');
          setSelectedConvId(result.conversation.conversationId);
        },
      });
    } else if (effectiveConvId) {
      sendMessage.mutate({
        conversationId: effectiveConvId,
        orgId: selectedOrgId,
        content: message,
        direction: 'inbound',
      });
    }
  };

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    pending: 'bg-amber-50 text-amber-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-iw-page text-iw-textTertiary',
    reopened: 'bg-amber-50 text-amber-800',
  };

  const tabs: { key: PortalTab; label: string }[] = [
    { key: 'communications', label: 'Communications' },
    { key: 'reporting', label: 'Reporting' },
    { key: 'enrollment', label: 'Enrollment' },
  ];

  return (
    <div className="iw-page min-h-screen">
      {/* ═══ TOP NAV ═══ */}
      <div className="iw-hero-navy sticky top-0 z-30">
        <div className="mx-auto max-w-[1320px] flex items-center justify-between h-14 px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.15] flex items-center justify-center text-white font-display font-bold text-sm">
                N
              </div>
              <div>
                <div className="text-sm font-bold text-white font-display leading-tight">NoUI</div>
                <div className="text-[8px] text-white/50 tracking-[1.5px] font-semibold uppercase">Employer Portal</div>
              </div>
            </div>

            <div className="w-px h-7 bg-white/15 mx-1" />

            <div className="flex gap-0.5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-1.5 rounded-xl text-[13px] font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-white/[0.15] text-white'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/[0.07]'
                  }`}
                >{tab.label}</button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onChangeView('portal')}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 text-[11px] font-semibold hover:text-white hover:border-white/40 transition-all"
            >Member Portal</button>
            <button
              onClick={() => onChangeView('crm')}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-white/70 text-[11px] font-semibold hover:text-white hover:border-white/40 transition-all"
            >Staff CRM</button>

            <div className="w-px h-6 bg-white/15" />
            <select
              value={selectedOrgId}
              onChange={(e) => { setSelectedOrgId(e.target.value); setSelectedConvId(''); }}
              className="bg-white/10 text-white border border-white/20 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer"
            >
              {orgList.map((o) => (
                <option key={o.orgId} value={o.orgId} className="text-black">
                  {o.orgShortName || o.orgName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ═══ ORG INFO BANNER ═══ */}
      {org && (
        <div className="bg-white border-b border-iw-border">
          <div className="mx-auto max-w-[1320px] px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-iw-navy font-display">{org.orgName}</h1>
              <div className="flex gap-4 mt-1 text-xs text-iw-textSecondary">
                <span>ID: {org.legacyEmployerId}</span>
                <span>{org.memberCount} members</span>
                <span>Last contribution: {org.lastContributionDate}</span>
                <span>{org.reportingFrequency} reporting</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              org.employerStatus === 'active'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}>
              {org.employerStatus}
            </span>
          </div>
        </div>
      )}

      {/* ═══ CONTENT AREA ═══ */}
      <div className="mx-auto max-w-[1320px] px-8 py-6 pb-16 iw-view-enter">

        {/* ── REPORTING TAB ── */}
        {activeTab === 'reporting' && (
          <div>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Current Period', value: 'Feb 2026', sub: 'Due Mar 15, 2026' },
                { label: 'Active Members', value: String(org?.memberCount ?? 142), sub: 'Eligible for contributions' },
                { label: 'YTD Employee', value: '$96,120.50', sub: '2 periods reported' },
                { label: 'YTD Employer', value: '$144,180.75', sub: '2 periods reported' },
              ].map((s) => (
                <div key={s.label} className="iw-card p-5">
                  <div className="text-[11px] text-iw-textTertiary uppercase tracking-wide font-semibold">{s.label}</div>
                  <div className="text-2xl font-bold text-iw-navy font-display mt-1">{s.value}</div>
                  <div className="text-xs text-iw-textSecondary mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Actions bar */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-iw-navy font-display">Contribution Reports</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl border border-iw-border bg-white text-iw-textSecondary text-[13px] font-medium hover:bg-iw-page transition-all">
                  Download Template
                </button>
                <button className="px-4 py-2 rounded-xl bg-iw-navy text-white text-[13px] font-semibold hover:bg-iw-navyLight transition-all">
                  Submit New Report
                </button>
              </div>
            </div>

            {/* Reports table */}
            <div className="iw-card overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1.5fr_1fr] gap-2 px-5 py-3 bg-iw-page border-b border-iw-border text-[11px] font-semibold text-iw-textTertiary uppercase tracking-wide">
                <div>Period</div>
                <div>Due Date</div>
                <div>Members</div>
                <div className="text-right">Employee Total</div>
                <div className="text-right">Employer Total</div>
                <div>Submitted</div>
                <div>Status</div>
              </div>

              {/* Rows */}
              {DEMO_REPORTING_PERIODS.map((r) => {
                const st = REPORT_STATUS[r.status] || REPORT_STATUS.draft;
                return (
                  <div
                    key={r.period}
                    className="group grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.5fr_1.5fr_1fr] gap-2 px-5 py-3.5 border-b border-iw-borderLight text-[13px] text-iw-text items-center cursor-pointer hover:bg-iw-page transition-all"
                  >
                    <div className="font-semibold">{r.period}</div>
                    <div className="text-iw-textSecondary">{r.dueDate}</div>
                    <div>{r.members}</div>
                    <div className="text-right font-mono">${r.eeTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-right font-mono">${r.erTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-iw-textSecondary">{r.submittedDate}</div>
                    <div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${st.tw}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ENROLLMENT TAB ── */}
        {activeTab === 'enrollment' && (
          <div className="iw-card p-12 text-center">
            <div className="text-sm text-iw-textTertiary mb-2">
              Member enrollment management coming soon.
            </div>
            <div className="text-xs text-iw-textTertiary">
              Submit new hires, terminations, and status changes from this tab.
            </div>
          </div>
        )}

        {/* ── COMMUNICATIONS TAB ── */}
        {activeTab === 'communications' && (
        <div className="grid grid-cols-[340px_1fr] gap-4 min-h-[480px]">
          {/* Left: Thread list */}
          <div className="iw-card overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-iw-borderLight flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-iw-navy font-display">Threads</h3>
              <button
                onClick={() => { setComposing(true); setSelectedConvId(''); }}
                className="px-2.5 py-1 rounded-lg border border-iw-border bg-iw-page text-iw-textSecondary text-[11px] font-semibold hover:bg-iw-borderLight transition-all"
              >+ New</button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {convList.map((conv) => {
                const isSelected = conv.conversationId === effectiveConvId && !composing;
                const badgeTw = statusColors[conv.status] || statusColors.closed;

                return (
                  <button
                    key={conv.conversationId}
                    onClick={() => { setSelectedConvId(conv.conversationId); setComposing(false); }}
                    className={`block w-full text-left px-5 py-3 border-b border-iw-borderLight transition-all ${
                      isSelected
                        ? 'bg-iw-sageLight/40 border-l-[3px] border-l-iw-sage'
                        : 'border-l-[3px] border-l-transparent hover:bg-iw-page'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-iw-navy truncate flex-1">
                        {conv.subject || 'Untitled'}
                      </span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${badgeTw}`}>
                        {conv.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-iw-textTertiary mt-1">
                      {conv.interactionCount} message{conv.interactionCount !== 1 ? 's' : ''}
                    </div>
                  </button>
                );
              })}

              {convList.length === 0 && (
                <div className="p-6 text-center text-iw-textTertiary text-xs">
                  No communication threads.
                </div>
              )}
            </div>
          </div>

          {/* Right: Thread detail */}
          <div className="iw-card overflow-hidden flex flex-col">
            {composing ? (
              <>
                <div className="px-5 py-3.5 border-b border-iw-borderLight">
                  <h3 className="text-[15px] font-semibold text-iw-navy font-display">New Thread</h3>
                  <p className="text-xs text-iw-textTertiary mt-0.5">Send a message to DERP employer services</p>
                </div>
                <div className="flex-1" />
                <MessageComposer
                  theme={EMPLOYER_THEME}
                  onSend={handleSend}
                  placeholder="Type your message..."
                  showSubject
                  onSubjectChange={setNewSubject}
                />
              </>
            ) : effectiveConvId ? (
              <>
                <div className="px-5 py-3.5 border-b border-iw-borderLight">
                  <h3 className="text-[15px] font-semibold text-iw-navy font-display">
                    {convList.find((c) => c.conversationId === effectiveConvId)?.subject || 'Thread'}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-4">
                  <ConversationThread
                    interactions={interactions ?? []}
                    visibility="public"
                    theme={EMPLOYER_THEME}
                  />
                </div>
                <MessageComposer
                  theme={EMPLOYER_THEME}
                  onSend={handleSend}
                  placeholder="Reply..."
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-iw-textTertiary text-[13px]">
                Select a thread to view messages
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
