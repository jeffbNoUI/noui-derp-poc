export interface ProcessingTimeAnalysis {
  case_type: string
  tier: number
  avg_processing_days: number
  median_processing_days: number
  p95_processing_days: number
  sample_size: number
}

export interface ExceptionFrequency {
  exception_type: string
  count: number
  pct_of_total: number
  trend: 'increasing' | 'stable' | 'decreasing'
}

export interface WorkflowPattern {
  pattern_name: string
  description: string
  frequency: number
  avg_duration_days: number
  steps: string[]
}

export interface OperationalSummary {
  total_cases_analyzed: number
  date_range_start: string
  date_range_end: string
  processing_times: ProcessingTimeAnalysis[]
  exceptions: ExceptionFrequency[]
  workflow_patterns: WorkflowPattern[]
}
