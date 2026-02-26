import type { EmploymentEvent } from '@/types/Member'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Briefcase, ArrowUpRight, Building2, LogOut, RotateCcw } from 'lucide-react'

const eventConfig: Record<string, { icon: typeof Briefcase; color: string; label: string }> = {
  hire: { icon: Briefcase, color: 'text-green-600 bg-green-100', label: 'Hired' },
  promotion: { icon: ArrowUpRight, color: 'text-blue-600 bg-blue-100', label: 'Promotion' },
  transfer: { icon: Building2, color: 'text-purple-600 bg-purple-100', label: 'Transfer' },
  separation: { icon: LogOut, color: 'text-red-600 bg-red-100', label: 'Separation' },
  rehire: { icon: RotateCcw, color: 'text-teal-600 bg-teal-100', label: 'Rehire' },
}

interface EmploymentTimelineProps {
  events: EmploymentEvent[]
}

export function EmploymentTimeline({ events }: EmploymentTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
  )

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm p-6 animate-fadeIn">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Employment Timeline</h2>

      <div className="relative">
        {sorted.map((event, i) => {
          const config = eventConfig[event.event_type.toLowerCase()] ?? {
            icon: Briefcase,
            color: 'text-gray-600 bg-gray-100',
            label: event.event_type,
          }
          const Icon = config.icon
          const isLast = i === sorted.length - 1

          return (
            <div key={`${event.event_type}-${event.effective_date}`} className="relative flex gap-4 pb-6">
              {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-px bg-gray-200" />
              )}
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full shrink-0',
                  config.color
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900">{config.label}</span>
                  <span className="text-xs text-muted">{formatDate(event.effective_date)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {event.department} — {event.position}
                </p>
                {event.notes && (
                  <p className="text-xs text-muted mt-1 italic">{event.notes}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
