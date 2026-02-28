/**
 * CSV generation and download utilities — shared by all report pages.
 * Handles comma/quote escaping per RFC 4180.
 * Consumed by: EmployerReports.tsx, VendorReports.tsx
 * Depends on: nothing (pure utility)
 */

/** Escape a CSV cell value — wraps in quotes if it contains commas, quotes, or newlines. */
function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Generate a CSV string from headers and rows. */
export function generateCSV(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCell).join(',')
  const dataLines = rows.map(row => row.map(escapeCell).join(','))
  return [headerLine, ...dataLines].join('\n')
}

/** Trigger a browser download of CSV content. */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
