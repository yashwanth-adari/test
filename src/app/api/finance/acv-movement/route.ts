import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/shared/bigquery'
import { json } from '@/lib/shared/json'
import { ACV_MOVEMENT_TABLE } from '@/lib/shared/constants'
import type { Granularity } from '@/lib/shared/constants'

const VALID_GRANULARITIES = new Set<string>(['month', 'quarter', 'year'])

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const segment = searchParams.get('segment') ?? 'All'
  const rawGranularity = searchParams.get('granularity') ?? 'month'
  const fiscalYear = searchParams.get('fiscalYear') ?? 'All'

  if (!VALID_GRANULARITIES.has(rawGranularity)) {
    return json({ ok: false, error: 'Invalid granularity' }, { status: 400 })
  }
  const granularity = rawGranularity as Granularity

  const periodExpr =
    granularity === 'month'
      ? `FORMAT_DATE('%b %Y', month)`
      : granularity === 'quarter'
      ? `fiscal_year_quarter`
      : `fiscal_year`

  const periodSortExpr =
    granularity === 'month'
      ? `UNIX_DATE(month)`
      : granularity === 'quarter'
      ? `fiscal_qtr_sort`
      : `fiscal_year_num`

  const acvEopExpr =
    granularity === 'month'
      ? `kpi_value`
      : granularity === 'quarter'
      ? `kpi_value_for_quarter`
      : `kpi_value_for_fiscal_year`

  try {
    const rows = await runQuery<{
      period: string
      period_sort: number
      new_logo: number
      upsell: number
      churn: number
      downgrade: number
      net_new_acv: number
      acv_eop: number | null
    }>(
      `
      SELECT
        ${periodExpr} AS period,
        MIN(${periodSortExpr}) AS period_sort,
        SUM(CASE WHEN kpi_type = 'New Logo'   THEN kpi_value ELSE 0 END) AS new_logo,
        SUM(CASE WHEN kpi_type = 'Upsell'     THEN kpi_value ELSE 0 END) AS upsell,
        SUM(CASE WHEN kpi_type = 'Churn'      THEN kpi_value ELSE 0 END) AS churn,
        SUM(CASE WHEN kpi_type = 'Downgrade'  THEN kpi_value ELSE 0 END) AS downgrade,
        SUM(CASE WHEN kpi_type = 'Net New ACV' THEN kpi_value ELSE 0 END) AS net_new_acv,
        MAX(CASE WHEN kpi_type = 'ACV (EoP)'  THEN ${acvEopExpr} END) AS acv_eop
      FROM ${ACV_MOVEMENT_TABLE}
      WHERE kpi_type NOT IN ('New ACV', 'Bookings')
        AND (@segment = 'All' OR segment = @segment)
        AND (@fiscalYear = 'All' OR fiscal_year = @fiscalYear)
      GROUP BY 1
      ORDER BY 2
      `,
      { segment, fiscalYear }
    )

    return json({ ok: true, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ ok: false, error: message }, { status: 500 })
  }
}
