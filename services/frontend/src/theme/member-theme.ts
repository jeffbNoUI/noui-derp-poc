/** Member portal light theme — Colorado PERA brand, blue/gold */
import type { PortalTheme } from './types'

export const memberTheme: PortalTheme = {
  id: 'member',
  name: 'Member Portal',
  subtitle: 'MyCOPERA · Your Retirement Journey',
  surface: { bg: '#f5f7fa', card: '#ffffff', cardAlt: '#eef2f7', elevated: '#ffffff' },
  text: { primary: '#1a2233', secondary: '#4a5568', muted: '#5a6b7f', dim: '#9ba8b8' },
  border: { base: '#d1d9e6', subtle: '#e2e8f0', active: '#003366', focus: '#003366' },
  accent: { primary: '#003366', primaryHover: '#002244', light: '#b3cce6', surface: '#e6eef5', on: '#fff' },
  status: {
    success: '#2e7d32', successBg: '#e8f5e9',
    warning: '#c08b00', warningBg: '#fff8e1',
    danger: '#c62828', dangerBg: '#ffebee',
    info: '#0369a1', infoBg: '#e0f2fe',
  },
  tier: {
    t1: '#003366', t1bg: 'rgba(0,51,102,0.08)',
    t2: '#0066a1', t2bg: 'rgba(0,102,161,0.08)',
    t3: '#c08b00', t3bg: 'rgba(192,139,0,0.08)',
  },
  shadow: '0 2px 8px rgba(0,20,60,0.06)',
  shadowLg: '0 8px 24px rgba(0,20,60,0.08)',
  density: 'comfortable',
  layout: 'topnav',
}
