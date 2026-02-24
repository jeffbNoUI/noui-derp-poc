/**
 * Command palette overlay — global Ctrl+K / Cmd+K quick-jump with search, category grouping,
 * and keyboard navigation (Up/Down/Enter/Escape).
 * Consumed by: StaffLayout.tsx
 * Depends on: command-registry.ts, command-types.ts, theme (C), react-router-dom
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { C } from '@/theme'
import { buildCommands } from './command-registry'
import type { CommandItem } from './command-types'

const CATEGORY_ORDER: CommandItem['category'][] = ['Case', 'Stage', 'Tool', 'View']

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { memberId } = useParams()
  const location = useLocation()
  const isKiosk = location.search.includes('kiosk')
  const isGuided = location.pathname.endsWith('/guided')

  const commands = useMemo(
    () => buildCommands(navigate, memberId, isGuided),
    [navigate, memberId, isGuided],
  )

  // Filter by query
  const filtered = useMemo(() => {
    if (!query.trim()) return commands
    const q = query.toLowerCase()
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.keywords?.some(kw => kw.toLowerCase().includes(q))
    )
  }, [commands, query])

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const cat of CATEGORY_ORDER) {
      const items = filtered.filter(c => c.category === cat)
      if (items.length) map.set(cat, items)
    }
    return map
  }, [filtered])

  // Flat list for keyboard navigation
  const flatList = useMemo(() => {
    const items: CommandItem[] = []
    for (const [, list] of grouped) items.push(...list)
    return items
  }, [grouped])

  // Global shortcut
  useEffect(() => {
    if (isKiosk) return
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setQuery('')
        setSelectedIndex(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isKiosk])

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Reset selection on filter change
  useEffect(() => { setSelectedIndex(0) }, [query])

  const execute = useCallback((item: CommandItem) => {
    item.action()
    setOpen(false)
    setQuery('')
  }, [])

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, flatList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (flatList[selectedIndex]) execute(flatList[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }, [flatList, selectedIndex, execute])

  if (!open) return null

  let runningIndex = 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 9500, cursor: 'pointer',
        }}
      />
      {/* Palette */}
      <div style={{
        position: 'fixed', top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: '480px', maxWidth: '90vw',
        background: C.surface, borderRadius: '12px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
        zIndex: 9501, overflow: 'hidden',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ color: C.textDim, fontSize: '14px' }}>{'\uD83D\uDD0D'}</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Jump to case, stage, tool, or view..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              outline: 'none', color: C.text, fontSize: '13px',
              fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            padding: '1px 5px', borderRadius: '3px', fontSize: '9px',
            background: C.elevated, color: C.textDim,
            border: `1px solid ${C.borderSubtle}`,
          }}>ESC</kbd>
        </div>
        {/* Results */}
        <div style={{ maxHeight: '320px', overflow: 'auto', padding: '4px 0' }}>
          {flatList.length === 0 && (
            <div style={{
              padding: '16px', textAlign: 'center' as const,
              color: C.textDim, fontSize: '11px',
            }}>No results</div>
          )}
          {[...grouped.entries()].map(([category, items]) => {
            const header = (
              <div key={`h-${category}`} style={{
                padding: '6px 14px 2px', color: C.textDim,
                fontSize: '9px', fontWeight: 600,
                textTransform: 'uppercase' as const, letterSpacing: '1px',
              }}>{category}</div>
            )
            const rows = items.map(item => {
              const idx = runningIndex++
              const isSelected = idx === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 14px', cursor: 'pointer',
                    background: isSelected ? C.accentMuted : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: '13px', width: '20px', textAlign: 'center' as const }}>{item.icon}</span>
                  <span style={{
                    color: isSelected ? C.accent : C.text,
                    fontSize: '12px', fontWeight: isSelected ? 600 : 400,
                  }}>{item.label}</span>
                </div>
              )
            })
            return [header, ...rows]
          })}
        </div>
      </div>
    </>
  )
}
