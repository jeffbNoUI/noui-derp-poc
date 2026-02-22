import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertSeverity = 'info' | 'success' | 'warning' | 'error'

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  message: string
  ruleRef?: string
}

const severityConfig: Record<AlertSeverity, { icon: typeof Info; bg: string; border: string; text: string }> = {
  info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  success: { icon: CheckCircle2, bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
  error: { icon: XCircle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' },
}

interface AlertBarProps {
  alerts: Alert[]
}

export function AlertBar({ alerts }: AlertBarProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity]
        const Icon = config.icon
        return (
          <div
            key={alert.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border',
              config.bg,
              config.border
            )}
          >
            <Icon className={cn('w-5 h-5 mt-0.5 shrink-0', config.text)} />
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-semibold', config.text)}>
                {alert.title}
              </p>
              <p className={cn('text-sm mt-0.5', config.text)}>{alert.message}</p>
              {alert.ruleRef && (
                <p className="text-xs mt-1 opacity-70">
                  Source: {alert.ruleRef}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
