import type { ReactNode } from 'react'
import { Shield, Eye } from 'lucide-react'

interface WorkspaceShellProps {
  children: ReactNode
  memberId?: string
  onMemberSearch: (id: string) => void
}

export function WorkspaceShell({ children, memberId, onMemberSearch }: WorkspaceShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">DERP Retirement Workspace</h1>
              <p className="text-xs text-muted">
                Denver Employees Retirement Plan — Retirement Application
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-primary/70 no-print">
              <Eye className="w-3.5 h-3.5" />
              <span>Phase 1: Transparent</span>
            </div>
            <MemberSearch currentId={memberId ?? ''} onSearch={onMemberSearch} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      <footer className="bg-white border-t border-border py-3 text-center text-xs text-muted">
        <p>
          Deterministic rules engine executing certified plan provisions.
          Every calculation is transparent and verifiable. The system shows its work.
        </p>
      </footer>
    </div>
  )
}

function MemberSearch({
  currentId,
  onSearch,
}: {
  currentId: string
  onSearch: (id: string) => void
}) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const id = (form.get('memberId') as string).trim()
    if (id) onSearch(id)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        name="memberId"
        type="text"
        placeholder="Member ID..."
        defaultValue={currentId}
        className="px-3 py-1.5 text-sm border border-border rounded-md w-40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      <button
        type="submit"
        className="px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
      >
        Load
      </button>
    </form>
  )
}
