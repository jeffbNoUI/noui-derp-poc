/** Employer portal theme — navy sidebar, blue accent, white/slate surfaces.
 * Consumed by: EmployerLayout, employer portal pages
 * Depends on: PortalTheme type
 */
import type { PortalTheme } from './types'

export const employerTheme: PortalTheme = {
  id: 'employer',
  name: 'Employer Portal',
  subtitle: 'Department Reporting & Contributions',
  surface: { bg: '#f8fafc', card: '#ffffff', cardAlt: '#f1f5f9', elevated: '#ffffff' },
  text: { primary: '#0f172a', secondary: '#475569', muted: '#64748b', dim: '#94a3b8' },
  border: { base: '#e2e8f0', subtle: '#f1f5f9', active: '#3b82f6', focus: '#3b82f6' },
  accent: { primary: '#3b82f6', primaryHover: '#2563eb', light: 'rgba(59,130,246,0.15)', surface: 'rgba(59,130,246,0.08)', on: '#ffffff' },
  status: {
    success: '#16a34a', successBg: 'rgba(22,163,74,0.08)',
    warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)',
    danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.08)',
    info: '#2563eb', infoBg: 'rgba(37,99,235,0.08)',
  },
  tier: {
    t1: '#1565c0', t1bg: 'rgba(21,101,192,0.08)',
    t2: '#e65100', t2bg: 'rgba(230,81,0,0.08)',
    t3: '#2e7d32', t3bg: 'rgba(46,125,50,0.08)',
  },
  shadow: '0 1px 3px rgba(15,23,42,0.08)',
  shadowLg: '0 8px 24px rgba(15,23,42,0.12)',
  density: 'high',
  layout: 'sidebar',
}
