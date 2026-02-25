/** Vendor portal theme — teal-green accent, white surfaces, clean/transactional.
 * Consumed by: VendorLayout, vendor portal pages
 * Depends on: PortalTheme type
 */
import type { PortalTheme } from './types'

export const vendorTheme: PortalTheme = {
  id: 'vendor',
  name: 'Vendor Portal',
  subtitle: 'Insurance Enrollment & IPR Verification',
  surface: { bg: '#f9fafb', card: '#ffffff', cardAlt: '#f0fdf4', elevated: '#ffffff' },
  text: { primary: '#111827', secondary: '#4b5563', muted: '#6b7280', dim: '#9ca3af' },
  border: { base: '#e5e7eb', subtle: '#f3f4f6', active: '#059669', focus: '#059669' },
  accent: { primary: '#059669', primaryHover: '#047857', light: 'rgba(5,150,105,0.15)', surface: 'rgba(5,150,105,0.08)', on: '#ffffff' },
  status: {
    success: '#16a34a', successBg: 'rgba(22,163,74,0.08)',
    warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)',
    danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.08)',
    info: '#0284c7', infoBg: 'rgba(2,132,199,0.08)',
  },
  tier: {
    t1: '#1565c0', t1bg: 'rgba(21,101,192,0.08)',
    t2: '#e65100', t2bg: 'rgba(230,81,0,0.08)',
    t3: '#2e7d32', t3bg: 'rgba(46,125,50,0.08)',
  },
  shadow: '0 1px 3px rgba(0,0,0,0.06)',
  shadowLg: '0 8px 24px rgba(0,0,0,0.10)',
  density: 'comfortable',
  layout: 'topnav',
}
