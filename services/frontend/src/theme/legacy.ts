/**
 * Colorado PERA brand color system — blue/gold theme from copera.org
 * Consumed by: staff workspace components, shared components
 * Depends on: nothing (leaf constants)
 */
export const C = {
  bg: '#f5f7fa',
  surface: '#ffffff',
  elevated: '#eef2f7',
  border: '#d1d9e6',
  borderSubtle: '#dce3ed',
  accent: '#003366',         // COPERA navy blue
  accentMuted: 'rgba(0,51,102,0.08)',
  accentGlow: 'rgba(0,51,102,0.15)',
  accentSolid: 'rgba(0,51,102,0.20)',
  warm: '#c08b00',           // COPERA gold
  warmMuted: 'rgba(192,139,0,0.08)',
  warmBorder: 'rgba(192,139,0,0.20)',
  danger: '#c62828',
  dangerMuted: 'rgba(198,40,40,0.08)',
  dangerBorder: 'rgba(198,40,40,0.20)',
  success: '#2e7d32',
  successMuted: 'rgba(46,125,50,0.08)',
  successBorder: 'rgba(46,125,50,0.20)',
  text: '#1a2233',
  textSecondary: '#4a5568',
  textMuted: '#5a6b7f',
  textDim: '#9ba8b8',
  // Division colors (replacing tier colors)
  state: '#003366',         // Navy
  stateMuted: 'rgba(0,51,102,0.08)',
  school: '#0066a1',        // Medium blue
  schoolMuted: 'rgba(0,102,161,0.08)',
  localGov: '#2e7d32',      // Green
  localGovMuted: 'rgba(46,125,50,0.08)',
  judicial: '#6a1b9a',      // Purple
  judicialMuted: 'rgba(106,27,154,0.08)',
  dps: '#c08b00',           // Gold
  dpsMuted: 'rgba(192,139,0,0.08)',
}

// Division metadata (replaces tierMeta)
export const divisionMeta: Record<string, { color: string; muted: string; label: string; sub: string }> = {
  State: { color: C.state, muted: C.stateMuted, label: 'State Division', sub: 'PERA DB' },
  School: { color: C.school, muted: C.schoolMuted, label: 'School Division', sub: 'PERA DB' },
  LocalGov: { color: C.localGov, muted: C.localGovMuted, label: 'Local Government', sub: 'PERA DB' },
  Judicial: { color: C.judicial, muted: C.judicialMuted, label: 'Judicial Division', sub: 'PERA DB' },
  DPS: { color: C.dps, muted: C.dpsMuted, label: 'DPS Division', sub: 'Denver Public Safety' },
}

// HAS table metadata for display
export const hasTableMeta: Record<number, { name: string; era: string; ruleOfN: number }> = {
  1: { name: 'PERA 1', era: 'Pre-2007', ruleOfN: 80 },
  2: { name: 'PERA 2', era: '2007–2010', ruleOfN: 80 },
  3: { name: 'PERA 3', era: '2007–2010', ruleOfN: 80 },
  4: { name: 'PERA 4', era: '2011–2019 (vested)', ruleOfN: 85 },
  5: { name: 'PERA 5', era: '2011–2019 (vested)', ruleOfN: 85 },
  6: { name: 'PERA 6', era: '2011–2019 (vested)', ruleOfN: 85 },
  7: { name: 'PERA 7', era: 'Post-2020', ruleOfN: 90 },
  8: { name: 'PERA 8', era: 'Post-2020', ruleOfN: 90 },
  9: { name: 'PERA 9', era: 'Post-2020', ruleOfN: 90 },
  10: { name: 'DPS 1', era: 'Pre-2005', ruleOfN: 80 },
  11: { name: 'DPS 2', era: '2005–2019 (vested)', ruleOfN: 85 },
  12: { name: 'DPS 3', era: '2005–2019 (vested)', ruleOfN: 85 },
  13: { name: 'DPS 4', era: 'Post-2020', ruleOfN: 90 },
}

// Backward compatibility — tierMeta mapped from division
export const tierMeta = divisionMeta

// Format helpers
export const fmt = {
  currency: (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n),
  pct: (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`,
  date: (s: string) => {
    if (!s) return '—'
    const d = new Date(s + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  },
  years: (n: number) => `${n.toFixed(2)} years`,
}
