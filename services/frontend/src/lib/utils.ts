import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** Format a date string (YYYY-MM-DD or ISO timestamp) as MM-DD-YYYY.
 *  Returns '\u2014' (em dash) for null, undefined, or empty/invalid date strings. */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '\u2014'
  // Append noon for YYYY-MM-DD strings to avoid timezone date-shift
  const d = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr)
  if (isNaN(d.getTime())) return '\u2014'
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}-${dd}-${yyyy}`
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}
