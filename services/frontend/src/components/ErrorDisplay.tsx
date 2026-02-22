import { AlertTriangle } from 'lucide-react'

interface ErrorDisplayProps {
  message: string
  onRetry?: () => void
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="w-10 h-10 text-danger" />
      <p className="mt-3 text-sm text-danger font-medium">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}
