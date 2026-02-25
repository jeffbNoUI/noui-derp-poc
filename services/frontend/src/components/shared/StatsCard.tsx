/**
 * Dashboard metric card — label, value, trend indicator.
 * Consumed by: EmployerDashboard, VendorDashboard
 * Depends on: none (self-contained)
 */

interface StatsCardProps {
  label: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'flat'
  color?: string
  bg?: string
}

export function StatsCard({ label, value, subtitle, trend, color = '#0f172a', bg = '#ffffff' }: StatsCardProps) {
  const trendIcon = trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : null
  const trendColor = trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#94a3b8'

  return (
    <div style={{
      padding: 20, background: bg, borderRadius: 10,
      border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        {trendIcon && (
          <span style={{ fontSize: 11, color: trendColor, fontWeight: 600 }}>{trendIcon}</span>
        )}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{subtitle}</div>
      )}
    </div>
  )
}
