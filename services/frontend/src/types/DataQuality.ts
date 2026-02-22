export type FindingSeverity = 'critical' | 'warning' | 'info'
export type FindingCategory = 'structural' | 'calculation' | 'balance'

export interface DataQualityFinding {
  id: string
  category: FindingCategory
  severity: FindingSeverity
  member_id: string
  description: string
  details: Record<string, string>
  detected_at: string
  proposed_resolution: string
}

export interface DataQualitySummary {
  total_findings: number
  by_severity: Record<FindingSeverity, number>
  by_category: Record<FindingCategory, number>
  findings: DataQualityFinding[]
}
