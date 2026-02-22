/** Staff portal theme — light theme matching member portal palette */
import type { PortalTheme } from './types'

export const staffTheme: PortalTheme = {
  id: 'staff',
  name: 'Staff Portal',
  subtitle: 'Service Retirement Workspace',
  surface: { bg: '#f6f9f9', card: '#ffffff', cardAlt: '#f0f6f6', elevated: '#f0f6f6' },
  text: { primary: '#1a2e2e', secondary: '#4a6363', muted: '#728f8f', dim: '#9bb0b0' },
  border: { base: '#d4e0e0', subtle: '#e8efef', active: '#00796b', focus: '#00796b' },
  accent: { primary: '#00796b', primaryHover: '#00695c', light: 'rgba(0,121,107,0.15)', surface: 'rgba(0,121,107,0.08)', on: '#ffffff' },
  status: {
    success: '#2e7d32', successBg: 'rgba(46,125,50,0.08)',
    warning: '#e65100', warningBg: 'rgba(230,81,0,0.08)',
    danger: '#c62828', dangerBg: 'rgba(198,40,40,0.08)',
    info: '#1565c0', infoBg: 'rgba(21,101,192,0.08)',
  },
  tier: {
    t1: '#1565c0', t1bg: 'rgba(21,101,192,0.08)',
    t2: '#e65100', t2bg: 'rgba(230,81,0,0.08)',
    t3: '#2e7d32', t3bg: 'rgba(46,125,50,0.08)',
  },
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.12)',
  density: 'high',
  layout: 'sidebar',
}
