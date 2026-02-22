/**
 * Shared InfoCallout component — colored callout box for success/warning/info messages.
 * Follows the Callout pattern from noui-multi-portal.jsx prototype.
 * Consumed by: ApplicationWizard steps, MemberDashboard, ApplicationStatus
 * Depends on: theme (useTheme or inline color props)
 */

type CalloutType = 'success' | 'warning' | 'info' | 'danger'

interface InfoCalloutProps {
  type: CalloutType
  title?: string
  text: string
  colors: {
    success: string; successBg: string
    warning: string; warningBg: string
    info: string; infoBg: string
    danger: string; dangerBg: string
  }
}

export function InfoCallout({ type, title, text, colors }: InfoCalloutProps) {
  const colorMap: Record<CalloutType, { fg: string; bg: string }> = {
    success: { fg: colors.success, bg: colors.successBg },
    warning: { fg: colors.warning, bg: colors.warningBg },
    info: { fg: colors.info, bg: colors.infoBg },
    danger: { fg: colors.danger, bg: colors.dangerBg },
  }
  const c = colorMap[type]
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: c.bg, borderLeft: `3px solid ${c.fg}`,
    }}>
      {title && <div style={{ fontSize: 13, fontWeight: 600, color: c.fg, marginBottom: 2 }}>{title}</div>}
      <div style={{ fontSize: 12, color: c.fg, lineHeight: 1.5 }}>{text}</div>
    </div>
  )
}
