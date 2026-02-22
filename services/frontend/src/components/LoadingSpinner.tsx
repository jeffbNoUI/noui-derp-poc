import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({ message = 'Loading...', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="mt-3 text-sm text-muted">{message}</p>
    </div>
  )
}
