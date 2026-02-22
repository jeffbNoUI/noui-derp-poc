/** Staff portal theme — maps from existing C object to PortalTheme interface */
import type { PortalTheme } from './types'

export const staffTheme: PortalTheme = {
  id: 'staff',
  name: 'Staff Portal',
  subtitle: 'Service Retirement Workspace',
  surface: { bg: '#0B1017', card: '#131C27', cardAlt: '#1A2736', elevated: '#1A2736' },
  text: { primary: '#E2E8F0', secondary: '#94A3B8', muted: '#64748B', dim: '#475569' },
  border: { base: '#243447', subtle: '#1B2D40', active: '#22D3EE', focus: '#22D3EE' },
  accent: { primary: '#22D3EE', primaryHover: '#06B6D4', light: 'rgba(34,211,238,0.20)', surface: 'rgba(34,211,238,0.10)', on: '#0B1017' },
  status: {
    success: '#10B981', successBg: 'rgba(16,185,129,0.10)',
    warning: '#F59E0B', warningBg: 'rgba(245,158,11,0.10)',
    danger: '#EF4444', dangerBg: 'rgba(239,68,68,0.10)',
    info: '#3B82F6', infoBg: 'rgba(59,130,246,0.10)',
  },
  tier: {
    t1: '#3B82F6', t1bg: 'rgba(59,130,246,0.12)',
    t2: '#F59E0B', t2bg: 'rgba(245,158,11,0.12)',
    t3: '#10B981', t3bg: 'rgba(16,185,129,0.12)',
  },
  shadow: '0 1px 3px rgba(0,0,0,0.3)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.4)',
  density: 'high',
  layout: 'sidebar',
}
