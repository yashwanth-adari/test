export interface FinanceFilters {
  startMonth: string     // 'YYYY-MM-01'
  endMonth: string       // 'YYYY-MM-01'
  fiscalQuarter: string  // 'All' | "FY'26 Q3" etc.
  segment: string        // 'All' | specific segment
}

export interface PivotDataRow {
  kpi_type: string
  kpi_order: number
  month: string           // 'YYYY-MM-01' for drill-down param
  month_label: string     // 'Oct 2025' for display
  month_sort: number      // unix days for ordering
  fiscal_year_quarter: string
  fiscal_qtr_sort: number
  value: number
}

export interface AcvDetailRow {
  account_name: string
  segment: string
  value: number
}

export interface BookingDetailRow {
  account_name: string
  segment: string
  type: string
  value: number
}

export interface FilterOptionsResponse {
  ok: boolean
  segments: string[]
  fiscalQuarters: string[]
  minMonth: string   // 'YYYY-MM-01'
  maxMonth: string   // 'YYYY-MM-01'
}
