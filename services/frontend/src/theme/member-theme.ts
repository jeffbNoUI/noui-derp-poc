/** Member portal light theme — DERP brand, warm teal, from multi-portal prototype */
import type { PortalTheme } from './types'

export const memberTheme: PortalTheme = {
  id: 'member',
  name: 'Member Portal',
  subtitle: 'MyDERP · Your Retirement Journey',
  surface: { bg: '#f6f9f9', card: '#ffffff', cardAlt: '#f0f6f6', elevated: '#ffffff' },
  text: { primary: '#1a2e2e', secondary: '#4a6363', muted: '#5a7878', dim: '#9bb0b0' },
  border: { base: '#d4e0e0', subtle: '#e8efef', active: '#00796b', focus: '#00796b' },
  accent: { primary: '#00796b', primaryHover: '#00695c', light: '#b2dfdb', surface: '#e0f2f1', on: '#fff' },
  status: {
    success: '#2e7d32', successBg: '#e8f5e9',
    warning: '#e65100', warningBg: '#fff3e0',
    danger: '#c62828', dangerBg: '#ffebee',
    info: '#0369a1', infoBg: '#e0f2fe',
  },
  tier: {
    t1: '#1565c0', t1bg: 'rgba(21,101,192,0.08)',
    t2: '#e65100', t2bg: 'rgba(230,81,0,0.08)',
    t3: '#2e7d32', t3bg: 'rgba(46,125,50,0.08)',
  },
  shadow: '0 2px 8px rgba(0,54,58,0.06)',
  shadowLg: '0 8px 24px rgba(0,54,58,0.08)',
  density: 'comfortable',
  layout: 'topnav',
}
