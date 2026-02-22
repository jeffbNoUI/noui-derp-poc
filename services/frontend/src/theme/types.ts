/** Portal theme type definitions — shared shape for staff and member themes */

export interface PortalTheme {
  id: 'staff' | 'member'
  name: string
  subtitle: string
  surface: {
    bg: string
    card: string
    cardAlt: string
    elevated: string
  }
  text: {
    primary: string
    secondary: string
    muted: string
    dim: string
  }
  border: {
    base: string
    subtle: string
    active: string
    focus: string
  }
  accent: {
    primary: string
    primaryHover: string
    light: string
    surface: string
    on: string
  }
  status: {
    success: string
    successBg: string
    warning: string
    warningBg: string
    danger: string
    dangerBg: string
    info: string
    infoBg: string
  }
  tier: {
    t1: string
    t1bg: string
    t2: string
    t2bg: string
    t3: string
    t3bg: string
  }
  shadow: string
  shadowLg: string
  density: 'high' | 'comfortable'
  layout: 'sidebar' | 'topnav'
}
