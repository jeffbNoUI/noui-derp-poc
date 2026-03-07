import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useMember, useEmployment, useServiceCredit } from '@/hooks/useMember';
import { useBenefitCalculation, useScenario } from '@/hooks/useBenefitCalculation';
import MemberBanner from '@/components/MemberBanner';
import BenefitCalculationPanel from '@/components/BenefitCalculationPanel';
import PaymentOptionsComparison from '@/components/PaymentOptionsComparison';
import ServiceCreditSummary from '@/components/ServiceCreditSummary';
import ScenarioModeler from '@/components/ScenarioModeler';
import DROImpactPanel from '@/components/DROImpactPanel';
import IPRCalculator from '@/components/IPRCalculator';
import DeathBenefitPanel from '@/components/DeathBenefitPanel';
import EmploymentTimeline from '@/components/EmploymentTimeline';
import MemberPortal from '@/components/portal/MemberPortal';
import CRMWorkspace from '@/components/CRMWorkspace';
import EmployerPortal from '@/components/portal/EmployerPortal';
import StaffPortal from '@/components/StaffPortal';
import RetirementApplication from '@/components/RetirementApplication';
import CommandPalette from '@/components/CommandPalette';
import VendorPortal from '@/components/portal/VendorPortal';

type ViewMode = 'staff' | 'portal' | 'workspace' | 'crm' | 'employer' | 'vendor' | 'retirement-app';

// Demo case members with their retirement dates
const DEMO_CASES = [
  { id: 10001, name: 'Robert Martinez', retDate: '2026-04-01', label: 'Case 1: Tier 1, Rule of 75' },
  { id: 10002, name: 'Jennifer Kim', retDate: '2026-05-01', label: 'Case 2: Tier 2, Early Retirement' },
  { id: 10003, name: 'David Washington', retDate: '2026-04-01', label: 'Case 3: Tier 3, Early Retirement' },
  { id: 10001, name: 'Robert Martinez (DRO)', retDate: '2026-04-01', label: 'Case 4: Tier 1, DRO' },
];

// ── Shared top-level navigation bar ──────────────────────────────────────────

function TopNav({
  viewMode,
  onChangeView,
}: {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
}) {
  const tabs: { key: ViewMode; label: string; description: string }[] = [
    { key: 'staff', label: 'Staff Portal', description: 'Work queue and case management' },
    { key: 'portal', label: 'Member Portal', description: 'Self-service member view' },
    { key: 'workspace', label: 'Agent Workspace', description: 'Benefit calculations' },
    { key: 'crm', label: 'CRM', description: 'Contact management' },
    { key: 'employer', label: 'Employer Portal', description: 'Employer self-service' },
  ];

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-iw-border sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-iw-navy to-iw-navyLight flex items-center justify-center text-white font-bold text-sm font-display">
                N
              </div>
              <div>
                <div className="text-sm font-bold text-iw-navy font-display leading-none">NoUI</div>
                <div className="text-[9px] text-iw-textTertiary tracking-[1.5px] uppercase font-semibold">DERP POC</div>
              </div>
            </div>

            <div className="h-7 w-px bg-iw-borderLight" />

            <div className="flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onChangeView(tab.key)}
                  title={tab.description}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    viewMode === tab.key
                      ? 'bg-iw-sageLight text-iw-sage font-semibold'
                      : 'text-iw-textSecondary hover:text-iw-text hover:bg-iw-page'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[10px] text-iw-textTertiary font-mono px-2 py-1 rounded-lg bg-iw-page border border-iw-borderLight">&#8984;K</div>
            <div className="text-[11px] text-iw-textTertiary font-medium">Phase 1: Transparent</div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('staff');
  const [memberID, setMemberID] = useState(10001);
  const [retirementDate, setRetirementDate] = useState('2026-04-01');
  const [memberIDInput, setMemberIDInput] = useState('10001');
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);

  // Retirement application state
  const [activeCaseId, setActiveCaseId] = useState('');
  const [caseMemberId, setCaseMemberId] = useState(10001);
  const [caseRetDate, setCaseRetDate] = useState('2026-04-01');
  const [caseFlagsState, setCaseFlagsState] = useState<string[]>([]);

  const handleOpenCase = useCallback((caseId: string, memberId: number, retDate: string, flags?: string[]) => {
    setActiveCaseId(caseId);
    setCaseMemberId(memberId);
    setCaseRetDate(retDate);
    setCaseFlagsState(flags || []);
    setViewMode('retirement-app');
  }, []);

  const handleChangeView = useCallback((mode: string) => {
    setViewMode(mode as ViewMode);
  }, []);

  // Global ⌘K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Command palette commands
  const commands = useMemo(() => [
    { id: 'search-member', label: 'Search Member', icon: '🔍', shortcut: 'G M', category: 'Navigation', action: () => setViewMode('staff') },
    { id: 'open-queue', label: 'My Work Queue', icon: '📋', shortcut: 'G Q', category: 'Navigation', action: () => setViewMode('staff') },
    { id: 'run-calc', label: 'Run Calculation', icon: '🧮', category: 'Actions', action: () => setViewMode('workspace') },
    { id: 'open-crm', label: 'Open CRM', icon: '💬', shortcut: 'G C', category: 'Navigation', action: () => setViewMode('crm') },
    { id: 'member-portal', label: 'Member Portal', icon: '👤', category: 'Navigation', action: () => setViewMode('portal') },
    { id: 'employer-portal', label: 'Employer Portal', icon: '🏢', category: 'Navigation', action: () => setViewMode('employer') },
    { id: 'vendor-portal', label: 'Vendor Portal', icon: '\ud83c\udfe5', category: 'Navigation', action: () => setViewMode('vendor') },
    { id: 'case-robert', label: 'Open Case: Robert Martinez', icon: '📂', category: 'Cases', action: () => handleOpenCase('RET-2026-0147', 10001, '2026-04-01', ['leave-payout']) },
    { id: 'case-jennifer', label: 'Open Case: Jennifer Kim', icon: '📂', category: 'Cases', action: () => handleOpenCase('RET-2026-0152', 10002, '2026-05-01', ['early-retirement', 'purchased-service']) },
  ], [handleOpenCase]);

  // ── View transition key — triggers re-animation on view change ──────
  const viewKey = useRef(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const prevViewMode = useRef(viewMode);

  useEffect(() => {
    if (prevViewMode.current !== viewMode) {
      viewKey.current += 1;
      setTransitionKey(viewKey.current);
      prevViewMode.current = viewMode;
    }
  }, [viewMode]);

  // Command palette is global across all views
  const cmdPalette = <CommandPalette commands={commands} isOpen={cmdPaletteOpen} onClose={() => setCmdPaletteOpen(false)} />;

  // ── Staff Portal (default landing) ──────────────────────────────────────

  if (viewMode === 'staff') {
    return (
      <div key={transitionKey} className="iw-fade-in">
        {cmdPalette}
        <StaffPortal
          onOpenCase={handleOpenCase}
          onChangeView={handleChangeView}
        />
      </div>
    );
  }

  // ── Retirement Application (from Staff Portal case click) ───────────────

  if (viewMode === 'retirement-app') {
    return (
      <div key={transitionKey} className="iw-fade-in">
        {cmdPalette}
        <RetirementApplication
          caseId={activeCaseId}
          memberId={caseMemberId}
          retirementDate={caseRetDate}
          caseFlags={caseFlagsState}
          onBack={() => setViewMode('staff')}
          onChangeView={handleChangeView}
        />
      </div>
    );
  }

  // ── Member Portal view ──────────────────────────────────────────────────

  if (viewMode === 'portal') {
    return (
      <div key={transitionKey} className="iw-fade-in">
        {cmdPalette}
        <MemberPortal
          memberID={memberID}
          retirementDate={retirementDate}
          onSwitchToWorkspace={() => setViewMode('workspace')}
          onSwitchToCRM={() => setViewMode('crm')}
          onChangeView={handleChangeView}
        />
      </div>
    );
  }

  // ── CRM Workspace view ────────────────────────────────────────────────

  if (viewMode === 'crm') {
    return (
      <div key={transitionKey} className="iw-fade-in">
        {cmdPalette}
        <TopNav viewMode={viewMode} onChangeView={handleChangeView} />
        <CRMWorkspace />
      </div>
    );
  }

  // ── Employer Portal view ──────────────────────────────────────────────

  if (viewMode === 'employer') {
    return <div key={transitionKey} className="iw-fade-in">{cmdPalette}<EmployerPortal onChangeView={handleChangeView} /></div>;
  }

  // ── Vendor Portal view ──────────────────────────────────────────────

  if (viewMode === 'vendor') {
    return <div key={transitionKey} className="iw-fade-in">{cmdPalette}<VendorPortal onChangeView={handleChangeView} /></div>;
  }

  // ── Agent Workspace view (calculations) ───────────────────────────────

  return <div key={transitionKey} className="iw-fade-in">{cmdPalette}<AgentWorkspace
    memberID={memberID}
    setMemberID={setMemberID}
    retirementDate={retirementDate}
    setRetirementDate={setRetirementDate}
    memberIDInput={memberIDInput}
    setMemberIDInput={setMemberIDInput}
    viewMode={viewMode}
    setViewMode={handleChangeView}
  /></div>;
}

// ── Agent Workspace (split out for clarity) ──────────────────────────────────

function AgentWorkspace({
  memberID,
  setMemberID,
  retirementDate,
  setRetirementDate,
  memberIDInput,
  setMemberIDInput,
  viewMode,
  setViewMode,
}: {
  memberID: number;
  setMemberID: (id: number) => void;
  retirementDate: string;
  setRetirementDate: (d: string) => void;
  memberIDInput: string;
  setMemberIDInput: (v: string) => void;
  viewMode: ViewMode;
  setViewMode: (m: string) => void;
}) {
  const { data: member, isLoading: memberLoading, error: memberError } = useMember(memberID);
  const { data: employment } = useEmployment(memberID);
  const { data: svcCreditData } = useServiceCredit(memberID);
  const { data: calculation, isLoading: calcLoading } = useBenefitCalculation(memberID, retirementDate);

  const scenarioDates = [
    retirementDate,
    addYears(retirementDate, 1),
    addYears(retirementDate, 2),
    addYears(retirementDate, 3),
  ];
  const { data: scenario } = useScenario(memberID, scenarioDates);

  const isEarlyRetirement = calculation?.eligibility.best_eligible_type === 'EARLY';
  const svcSummary = svcCreditData?.summary;

  const handleLookup = () => {
    const id = parseInt(memberIDInput, 10);
    if (id > 0) setMemberID(id);
  };

  return (
    <div className="iw-page">
      <TopNav viewMode={viewMode} onChangeView={(mode) => setViewMode(mode)} />

      {/* Workspace controls */}
      <div className="border-b border-iw-border bg-white">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-iw-textSecondary font-medium">Retirement Application Workspace</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={memberIDInput}
                onChange={(e) => setMemberIDInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="Member ID"
                className="w-28 rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
              <input
                type="date"
                value={retirementDate}
                onChange={(e) => setRetirementDate(e.target.value)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={handleLookup}
                className="rounded-xl bg-iw-sage px-4 py-1.5 text-sm font-medium text-white hover:bg-iw-sageDark transition-all"
              >
                Calculate
              </button>
            </div>
          </div>

          {/* Demo case quick-select */}
          <div className="mt-2 flex gap-2">
            {DEMO_CASES.map((dc, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setMemberID(dc.id);
                  setMemberIDInput(String(dc.id));
                  setRetirementDate(dc.retDate);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
                  ${memberID === dc.id && retirementDate === dc.retDate
                    ? 'bg-iw-sage text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {dc.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main workspace content */}
      <main className="mx-auto max-w-7xl px-6 py-6 space-y-6 iw-view-enter">
        {memberLoading && (
          <div className="iw-card p-8 text-center text-iw-textTertiary">
            Loading member data...
          </div>
        )}

        {memberError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {memberError.message}
          </div>
        )}

        {member && (
          <>
            <MemberBanner member={member} />

            {svcSummary && <ServiceCreditSummary summary={svcSummary} />}

            {calcLoading && (
              <div className="iw-card p-8 text-center text-iw-textTertiary">
                Calculating benefit...
              </div>
            )}

            {calculation && (
              <>
                <BenefitCalculationPanel calculation={calculation} />

                <PaymentOptionsComparison
                  options={calculation.payment_options}
                  maritalStatus={member.marital_status}
                />

                {calculation.dro && <DROImpactPanel dro={calculation.dro} />}

                {isEarlyRetirement && scenario && (
                  <ScenarioModeler
                    scenarios={scenario.scenarios}
                    currentRetirementDate={retirementDate}
                  />
                )}

                <div className="grid grid-cols-2 gap-6">
                  <DeathBenefitPanel deathBenefit={calculation.death_benefit} />
                  <IPRCalculator ipr={calculation.ipr} medicareFlag={member.medicare_flag} />
                </div>
              </>
            )}

            {employment && employment.length > 0 && (
              <EmploymentTimeline events={employment} />
            )}
          </>
        )}

        <footer className="rounded-2xl bg-iw-warm border border-iw-borderLight px-6 py-4 text-center">
          <p className="text-[11px] font-semibold text-iw-textTertiary tracking-wide">Phase 1: Transparent</p>
          <p className="text-[11px] text-iw-textTertiary mt-1">
            The system shows its work. Every calculation is transparent and verifiable.
            The deterministic rules engine executes certified plan provisions.
          </p>
        </footer>
      </main>
    </div>
  );
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}
