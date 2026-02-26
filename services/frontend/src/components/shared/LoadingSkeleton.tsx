/**
 * LoadingSkeleton — animated pulse skeleton for data-fetching loading states.
 * Renders configurable skeleton lines, cards, or table rows with shimmer animation.
 * Consumed by: BenefitWorkspace, MemberDashboard, or any data-fetching view
 * Depends on: animations.css (shimmer keyframes)
 */

interface LoadingSkeletonProps {
  /** Number of skeleton lines / cards / table rows to render */
  lines?: number
  /** Visual variant: text lines, card blocks, or table rows */
  type?: 'text' | 'card' | 'table'
  /** Use dark-theme colors (staff workspace) vs light-theme colors (other portals) */
  dark?: boolean
}

export function LoadingSkeleton({ lines = 3, type = 'text', dark = false }: LoadingSkeletonProps) {
  const baseBg = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const shimmerClass = dark ? 'animate-shimmer' : 'animate-shimmer-light'

  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={shimmerClass}
            style={{
              background: baseBg,
              borderRadius: 8,
              height: 120,
              animationDelay: `${i * 100}ms`,
            }}
          />
        ))}
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Table header skeleton */}
        <div
          className={shimmerClass}
          style={{
            background: baseBg,
            borderRadius: 4,
            height: 32,
            marginBottom: 4,
          }}
        />
        {/* Table rows */}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={shimmerClass}
            style={{
              background: baseBg,
              borderRadius: 4,
              height: 28,
              opacity: 1 - i * 0.1,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    )
  }

  // Default: text lines with varying widths
  const widths = ['100%', '85%', '92%', '78%', '88%', '70%']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={shimmerClass}
          style={{
            background: baseBg,
            borderRadius: 4,
            height: 14,
            width: widths[i % widths.length],
            animationDelay: `${i * 60}ms`,
          }}
        />
      ))}
    </div>
  )
}
