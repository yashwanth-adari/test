export const DATA_PROJECT = 'data-warehouse-deepset'
export const DATA_SCHEMA = 'raw_salesforce'

export const ACV_MOVEMENT_TABLE = `\`${DATA_PROJECT}.${DATA_SCHEMA}.mart_sf_acv_booking_movement_kpis\``
export const ARR_TABLE = `\`${DATA_PROJECT}.${DATA_SCHEMA}.mart_sf_arr_by_customer_monthly\``

export const STORAGE_KEY_SIDEBAR_COLLAPSED = 'finance.sidebar.collapsed'

export type Granularity = 'month' | 'quarter' | 'year'

export const GRANULARITY_OPTIONS: { value: Granularity; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
]
