import type { Granularity } from './constants'

export interface FinanceFilters {
  segment: string
  granularity: Granularity
  fiscalYear: string
}

export interface AcvMovementRow {
  period: string
  period_sort: number
  new_logo: number
  upsell: number
  churn: number
  downgrade: number
  net_new_acv: number
  acv_eop: number | null
}

export interface ArrRow {
  month_label: string
  month_sort: number
  segment: string
  arr_eur: number
}

export interface FilterOptionsResponse {
  ok: boolean
  segments: string[]
  fiscalYears: string[]
}
