import { useState } from 'react'
import { WorkspaceShell } from '@/components/WorkspaceShell'
import { MemberWorkspace } from '@/pages/MemberWorkspace'

function App() {
  const [memberId, setMemberId] = useState('')

  return (
    <WorkspaceShell memberId={memberId} onMemberSearch={setMemberId}>
      {memberId ? (
        <MemberWorkspace memberId={memberId} />
      ) : (
        <WelcomeScreen />
      )}
    </WorkspaceShell>
  )
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h2 className="text-2xl font-bold text-gray-900">Retirement Application Workspace</h2>
      <p className="mt-3 text-muted max-w-lg">
        Enter a member ID above to load their retirement workspace. The system identifies and presents
        the relevant information for each member's situation.
      </p>
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <DemoCard id="10001" name="Robert Martinez" tier={1} desc="Tier 1, Rule of 75, Leave Payout" />
        <DemoCard id="10002" name="Jennifer Kim" tier={2} desc="Tier 2, Early Retirement, Purchased Service" />
        <DemoCard id="10003" name="Marcus Thompson" tier={3} desc="Tier 3, Early Retirement" />
        <DemoCard id="10004" name="Robert Martinez" tier={1} desc="Tier 1, Rule of 75, DRO" />
      </div>
    </div>
  )
}

function DemoCard({ id, name, tier, desc }: { id: string; name: string; tier: number; desc: string }) {
  return (
    <div className="p-4 bg-white border border-border rounded-lg text-left">
      <p className="font-semibold text-gray-900">{name}</p>
      <p className="text-xs text-muted mt-1">ID: {id} | Tier {tier}</p>
      <p className="text-xs text-muted mt-1">{desc}</p>
    </div>
  )
}

export default App
