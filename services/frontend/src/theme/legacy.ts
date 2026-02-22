/** Dark theme color system matching benefit-estimator prototypes */
export const C = {
  bg: '#0B1017',
  surface: '#131C27',
  elevated: '#1A2736',
  border: '#243447',
  borderSubtle: '#1B2D40',
  accent: '#22D3EE',
  accentMuted: 'rgba(34,211,238,0.10)',
  accentGlow: 'rgba(34,211,238,0.20)',
  accentSolid: 'rgba(34,211,238,0.15)',
  warm: '#F59E0B',
  warmMuted: 'rgba(245,158,11,0.10)',
  warmBorder: 'rgba(245,158,11,0.25)',
  danger: '#EF4444',
  dangerMuted: 'rgba(239,68,68,0.10)',
  dangerBorder: 'rgba(239,68,68,0.25)',
  success: '#10B981',
  successMuted: 'rgba(16,185,129,0.10)',
  successBorder: 'rgba(16,185,129,0.25)',
  text: '#E2E8F0',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDim: '#475569',
  tier1: '#3B82F6',
  tier1Muted: 'rgba(59,130,246,0.12)',
  tier2: '#F59E0B',
  tier2Muted: 'rgba(245,158,11,0.12)',
  tier3: '#10B981',
  tier3Muted: 'rgba(16,185,129,0.12)',
}

export const tierMeta: Record<number, { color: string; muted: string; label: string; sub: string }> = {
  1: { color: C.tier1, muted: C.tier1Muted, label: 'Tier 1', sub: 'Pre-2004' },
  2: { color: C.tier2, muted: C.tier2Muted, label: 'Tier 2', sub: '2004-2011' },
  3: { color: C.tier3, muted: C.tier3Muted, label: 'Tier 3', sub: 'Post-2011' },
}

export function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
