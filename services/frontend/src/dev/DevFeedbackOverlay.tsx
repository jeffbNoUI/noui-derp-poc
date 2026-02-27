/**
 * Developer feedback overlay — secret ?dev mode for capturing bugs, ideas, and polish
 * notes while using the running app. Persists to localStorage, exports as JSON.
 * Consumed by: main.tsx (conditionally rendered when ?dev query param present)
 * Depends on: Nothing (self-contained, reads window.location.pathname directly)
 * Bridge: Fire-and-forget POST to localhost:3001 when dev-feedback-server.mjs is running
 */
import { useState, useRef, useEffect } from 'react'

interface DevFeedbackEntry {
  id: string
  timestamp: string
  route: string
  comment: string
}

const STORAGE_KEY = 'noui:dev:feedback'
const FEEDBACK_SERVER = 'http://localhost:3001/feedback'

// Fire-and-forget POST to local dev-feedback-server (no-op if server isn't running)
function sendToServer(entry: DevFeedbackEntry) {
  fetch(FEEDBACK_SERVER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {})
}

function readEntries(): DevFeedbackEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveEntries(entries: DevFeedbackEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// Self-contained dark styling that works over any theme
const S = {
  pill: {
    position: 'fixed' as const,
    bottom: 20,
    left: 16,
    zIndex: 7000,
    background: 'rgba(30, 30, 30, 0.92)',
    backdropFilter: 'blur(12px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
    fontFamily: 'system-ui, sans-serif',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  panel: {
    position: 'fixed' as const,
    bottom: 20,
    left: 16,
    zIndex: 7000,
    width: 340,
    maxHeight: 'calc(100vh - 40px)',
    background: 'rgba(30, 30, 30, 0.92)',
    backdropFilter: 'blur(12px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 600,
    fontSize: 14,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 16,
    padding: '2px 6px',
  },
  route: {
    padding: '8px 14px',
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#999',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    padding: '8px 10px',
    resize: 'vertical' as const,
    fontFamily: 'system-ui, sans-serif',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  submitBtn: {
    background: '#14B8A6',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 6,
    alignSelf: 'flex-end' as const,
  },
  entryList: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '6px 14px',
    maxHeight: 260,
  },
  entry: {
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  entryMeta: {
    display: 'flex' as const,
    gap: 8,
    alignItems: 'center' as const,
    marginBottom: 4,
    fontSize: 11,
  },
  entryTime: { color: '#888' },
  entryRoute: {
    background: 'rgba(20,184,166,0.2)',
    color: '#14B8A6',
    borderRadius: 4,
    padding: '1px 6px',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  entryComment: { color: '#ccc', lineHeight: 1.4 },
  footer: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    padding: '8px 14px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    fontSize: 12,
  },
  footerBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 12,
    padding: '2px 4px',
  },
} as const

export function DevFeedbackOverlay() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<DevFeedbackEntry[]>(readEntries)
  const [comment, setComment] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  function handleSubmit() {
    const text = comment.trim()
    if (!text) return
    const entry: DevFeedbackEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      route: window.location.pathname,
      comment: text,
    }
    const updated = [entry, ...entries]
    setEntries(updated)
    saveEntries(updated)
    sendToServer(entry)
    setComment('')
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `dev-feedback-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleClear() {
    if (!confirm('Clear all dev feedback entries?')) return
    setEntries([])
    localStorage.removeItem(STORAGE_KEY)
    fetch(FEEDBACK_SERVER, { method: 'DELETE' }).catch(() => {})
  }

  function fmtTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Collapsed pill
  if (!open) {
    return (
      <div style={S.pill} onClick={() => setOpen(true)}>
        Dev{entries.length > 0 && ` [${entries.length}]`}
      </div>
    )
  }

  // Expanded panel
  return (
    <div style={S.panel}>
      <div style={S.header}>
        <span>Dev Feedback</span>
        <button style={S.closeBtn} onClick={() => setOpen(false)}>✕</button>
      </div>

      <div style={S.route}>{window.location.pathname}</div>

      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column' as const }}>
        <textarea
          ref={textareaRef}
          rows={3}
          style={S.textarea}
          placeholder="Bug, idea, or note..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleSubmit() }}
        />
        <button
          style={{ ...S.submitBtn, opacity: comment.trim() ? 1 : 0.5 }}
          onClick={handleSubmit}
          disabled={!comment.trim()}
        >
          Submit
        </button>
      </div>

      {entries.length > 0 && (
        <div style={S.entryList}>
          {entries.map(e => (
            <div key={e.id} style={S.entry}>
              <div style={S.entryMeta}>
                <span style={S.entryTime}>{fmtTime(e.timestamp)}</span>
                <span style={S.entryRoute}>{e.route}</span>
              </div>
              <div style={S.entryComment}>{e.comment}</div>
            </div>
          ))}
        </div>
      )}

      <div style={S.footer}>
        <button style={{ ...S.footerBtn, color: '#14B8A6' }} onClick={handleExport}>
          Export JSON
        </button>
        <button style={{ ...S.footerBtn, color: '#f87171' }} onClick={handleClear}>
          Clear All
        </button>
      </div>
    </div>
  )
}
