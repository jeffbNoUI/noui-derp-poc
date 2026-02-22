import { useState } from 'react'
import { WorkspaceShell } from '@/components/WorkspaceShell'
import { MemberWorkspace } from '@/pages/MemberWorkspace'
import { Eye } from 'lucide-react'

const tierBadge: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-emerald-100 text-emerald-700',
  3: 'bg-amber-100 text-amber-700',
}

function App() {
  const [memberId, setMemberId] = useState('')

  return (
    <WorkspaceShell memberId={memberId} onMemberSearch={setMemberId}>
      {memberId ? (
        <MemberWorkspace memberId={memberId} />
      ) : (
        <WelcomeScreen onSelectMember={setMemberId} />
      )}
    </WorkspaceShell>
  )
}

function WelcomeScreen({ onSelectMember }: { onSelectMember: (id: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-6 h-6 text-primary" />
        <span className="text-xs font-medium text-primary uppercase tracking-wider">Phase 1: Transparent</span>
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Retirement Application Workspace</h2>
      <p className="mt-3 text-muted max-w-lg">
        Enter a member ID above to load their retirement workspace. The system identifies and presents
        the relevant information for each member's situation. Every calculation is transparent and verifiable.
      </p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <DemoCard id="10001" name="Robert Martinez" tier={1} desc="Rule of 75, Leave Payout" onClick={onSelectMember} />
        <DemoCard id="10002" name="Jennifer Kim" tier={2} desc="Early Retirement, Purchased Service" onClick={onSelectMember} />
        <DemoCard id="10003" name="David Washington" tier={3} desc="Early Retirement, Tier 3 Rules" onClick={onSelectMember} />
        <DemoCard id="10004" name="Robert Martinez" tier={1} desc="Rule of 75, DRO Division" onClick={onSelectMember} />
      </div>
      <p className="mt-6 text-xs text-muted max-w-md">
        The rules engine is configured with certified plan provisions.
        AI composes the workspace; the rules engine determines the numbers.
      </p>
    </div>
  )
}

function DemoCard({ id, name, tier, desc, onClick }: {
  id: string; name: string; tier: number; desc: string; onClick: (id: string) => void
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className="p-4 bg-white border border-border rounded-lg text-left hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{name}</p>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${tierBadge[tier] ?? 'bg-gray-100 text-gray-700'}`}>
          T{tier}
        </span>
      </div>
      <p className="text-xs text-muted">Case {id === '10004' ? '4' : Number(id) - 10000}</p>
      <p className="text-xs text-muted mt-1">{desc}</p>
    </button>
  )
}

export default App
