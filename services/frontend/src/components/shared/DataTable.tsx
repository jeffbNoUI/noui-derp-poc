/**
 * Sortable, filterable data table — shared across employer roster, vendor queue, and reports.
 * Consumed by: EmployeeRoster, ContributionReporting, VendorDashboard, VendorReports
 * Depends on: PortalTheme (via useTheme or passed styles)
 */
import { useState, useMemo, type ReactNode } from 'react'

export interface Column<T> {
  key: string
  label: string
  render?: (row: T) => ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage?: string
  colors?: { bg: string; card: string; border: string; text: string; accent: string; hoverBg: string }
}

const DEFAULT_COLORS = {
  bg: '#ffffff', card: '#ffffff', border: '#e2e8f0',
  text: '#0f172a', accent: '#3b82f6', hoverBg: '#f8fafc',
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, onRowClick, emptyMessage = 'No data available',
  colors = DEFAULT_COLORS,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = av < bv ? -1 : av > bv ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string, sortable?: boolean) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key, col.sortable)}
                style={{
                  padding: '10px 12px', textAlign: 'left', fontWeight: 600,
                  color: colors.text, borderBottom: `2px solid ${colors.border}`,
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none', fontSize: 11, textTransform: 'uppercase',
                  letterSpacing: 0.5, width: col.width,
                }}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '\u25B2' : '\u25BC'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick?.(row)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: `1px solid ${colors.border}`,
              }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = colors.hoverBg }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '10px 12px', color: colors.text }}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
