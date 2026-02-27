/**
 * Developer feedback overlay — secret ?dev mode for capturing bugs, ideas, and polish
 * notes while using the running app. Persists to localStorage, exports as JSON.
 * Consumed by: main.tsx (conditionally rendered when ?dev query param present)
 * Depends on: Nothing (self-contained, reads window.location.pathname directly)
 * Bridge: Fire-and-forget POST to localhost:3001 when dev-feedback-server.mjs is running
 */
import { useState, useRef, useEffect, useCallback } from 'react'

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

// Self-contained dark styling — 75% transparent, works over any theme
const OPACITY = 0.25  // 75% transparent = 25% opaque
const OPACITY_HOVER = 0.88  // Nearly opaque when interacting

const S = {
  pill: {
    position: 'fixed' as const,
    bottom: 20,
    left: 16,
    zIndex: 7000,
    background: `rgba(30, 30, 30, ${OPACITY})`,
    backdropFilter: 'blur(12px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: '6px 14px',
    fontSize: 13,
    fontFamily: 'system-ui, sans-serif',
    cursor: 'grab',
    userSelect: 'none' as const,
    transition: 'background 0.2s',
  },
  panel: {
    position: 'fixed' as const,
    zIndex: 7000,
    width: 340,
    maxHeight: 'calc(100vh - 40px)',
    background: `rgba(30, 30, 30, ${OPACITY})`,
    backdropFilter: 'blur(12px)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    fontFamily: 'system-ui, sans-serif',
    fontSize: 13,
    display: 'flex' as const,
    flexDirection: 'column' as const,
    overflow: 'hidden' as const,
    transition: 'background 0.2s',
  },
  header: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'grab',
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

// Persist position in localStorage so the overlay stays where you left it
const POS_KEY = 'noui:dev:position'

function readPosition() {
  try {
    const raw = localStorage.getItem(POS_KEY)
    return raw ? JSON.parse(raw) as { x: number; y: number } : null
  } catch { return null }
}

function savePosition(pos: { x: number; y: number }) {
  localStorage.setItem(POS_KEY, JSON.stringify(pos))
}

export function DevFeedbackOverlay() {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<DevFeedbackEntry[]>(readEntries)
  const [comment, setComment] = useState('')
  const [hovered, setHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Drag state
  const saved = readPosition()
  const [pos, setPos] = useState({ x: saved?.x ?? 16, y: saved?.y ?? 20 })
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null)

  // Focus textarea when panel opens
  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  // Drag handlers — attached to document so drag works outside the element
  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const newX = Math.max(0, Math.min(window.innerWidth - 100, dragRef.current.originX + dx))
    const newY = Math.max(0, Math.min(window.innerHeight - 40, dragRef.current.originY - dy))
    setPos({ x: newX, y: newY })
  }, [])

  const onMouseUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    setPos(p => { savePosition(p); return p })
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const startDrag = useCallback((e: React.MouseEvent) => {
    // Don't drag when clicking buttons or textarea
    if ((e.target as HTMLElement).closest('button, textarea')) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y }
    document.body.style.cursor = 'grabbing'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [pos.x, pos.y, onMouseMove, onMouseUp])

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

  const [batchSent, setBatchSent] = useState(false)

  function handleSendBatch() {
    fetch(`${FEEDBACK_SERVER}/batch`, { method: 'POST' })
      .then(() => { setBatchSent(true); setTimeout(() => setBatchSent(false), 3000) })
      .catch(() => {})
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

  const bgOpacity = hovered ? OPACITY_HOVER : OPACITY

  // Collapsed pill
  if (!open) {
    return (
      <div
        style={{
          ...S.pill,
          left: pos.x,
          bottom: pos.y,
          background: `rgba(30, 30, 30, ${bgOpacity})`,
        }}
        onMouseDown={startDrag}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => {
          // Only open if we didn't drag
          if (!dragRef.current) setOpen(true)
        }}
      >
        Dev{entries.length > 0 && ` [${entries.length}]`}
      </div>
    )
  }

  // Expanded panel
  return (
    <div
      style={{
        ...S.panel,
        left: pos.x,
        bottom: pos.y,
        background: `rgba(30, 30, 30, ${bgOpacity})`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={S.header} onMouseDown={startDrag}>
        <span>Dev Feedback</span>
        <button style={S.closeBtn} onClick={() => setOpen(false)}>&#x2715;</button>
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

      {/* Send batch to Claude */}
      {entries.length > 0 && (
        <div style={{ padding: '0 14px 8px' }}>
          <button onClick={handleSendBatch} disabled={batchSent} style={{
            width: '100%', padding: '7px', borderRadius: '6px', fontSize: '12px',
            fontWeight: 600, cursor: batchSent ? 'default' : 'pointer',
            border: 'none', transition: 'all 0.2s',
            background: batchSent ? 'rgba(46,125,50,0.3)' : 'rgba(124,58,237,0.25)',
            color: batchSent ? '#4ade80' : '#c084fc',
          }}>
            {batchSent ? `Sent ${entries.length} notes to Claude` : `Send ${entries.length} to Claude`}
          </button>
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
