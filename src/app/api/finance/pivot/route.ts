import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/shared/bigquery'
import { json } from '@/lib/shared/json'
import { ACV_MOVEMENT_TABLE } from '@/lib/shared/constants'
import type { PivotDataRow } from '@/lib/shared/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const startMonth = searchParams.get('startMonth') ?? ''
  const endMonth = searchParams.get('endMonth') ?? ''
  const segment = searchParams.get('segment') ?? 'All'
  const fiscalQuarter = searchParams.get('fiscalQuarter') ?? 'All'

  if (!startMonth || !endMonth) {
    return json({ ok: false, error: 'startMonth and endMonth are required' }, { status: 400 })
  }

  try {
    const rows = await runQuery<PivotDataRow>(
      `
      SELECT
        kpi_type,
        MIN(kpi_order)                                                AS kpi_order,
        FORMAT_DATE('%Y-%m-01', DATE_TRUNC(month, MONTH))             AS month,
        FORMAT_DATE('%b %Y',    DATE_TRUNC(month, MONTH))             AS month_label,
        UNIX_DATE(DATE_TRUNC(month, MONTH))                           AS month_sort,
        fiscal_year_quarter,
        MIN(fiscal_qtr_sort)                                          AS fiscal_qtr_sort,
        SUM(kpi_value)                                                AS value
      FROM ${ACV_MOVEMENT_TABLE}
      WHERE DATE_TRUNC(month, MONTH) >= DATE(@startMonth)
        AND DATE_TRUNC(month, MONTH) <= DATE(@endMonth)
        AND (@segment = 'All' OR Segment = @segment)
        AND (@fiscalQuarter = 'All' OR fiscal_year_quarter = @fiscalQuarter)
      GROUP BY kpi_type, month, month_label, month_sort, fiscal_year_quarter
      ORDER BY kpi_order, month_sort
      `,
      { startMonth, endMonth, segment, fiscalQuarter }
    )

    return json({ ok: true, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ ok: false, error: message }, { status: 500 })
  }
}
