import { runQuery } from '@/lib/shared/bigquery'
import { json } from '@/lib/shared/json'
import { ACV_MOVEMENT_TABLE } from '@/lib/shared/constants'

export async function GET() {
  try {
    const [segments, quarters, bounds] = await Promise.all([
      runQuery<{ segment: string }>(`
        SELECT DISTINCT Segment AS segment
        FROM ${ACV_MOVEMENT_TABLE}
        WHERE Segment IS NOT NULL
        ORDER BY segment
      `),
      runQuery<{ fiscal_year_quarter: string; fiscal_qtr_sort: number }>(`
        SELECT DISTINCT fiscal_year_quarter, MIN(fiscal_qtr_sort) AS fiscal_qtr_sort
        FROM ${ACV_MOVEMENT_TABLE}
        GROUP BY fiscal_year_quarter
        ORDER BY fiscal_qtr_sort
      `),
      runQuery<{ min_month: string; max_month: string }>(`
        SELECT
          FORMAT_DATE('%Y-%m-01', DATE_TRUNC(MIN(month), MONTH)) AS min_month,
          FORMAT_DATE('%Y-%m-01', DATE_TRUNC(MAX(month), MONTH)) AS max_month
        FROM ${ACV_MOVEMENT_TABLE}
      `),
    ])

    return json({
      ok: true,
      segments: segments.map((r) => r.segment),
      fiscalQuarters: quarters.map((r) => r.fiscal_year_quarter),
      minMonth: bounds[0]?.min_month ?? '',
      maxMonth: bounds[0]?.max_month ?? '',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ ok: false, error: message }, { status: 500 })
  }
}
