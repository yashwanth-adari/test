import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/shared/bigquery'
import { json } from '@/lib/shared/json'
import { ACV_MOVEMENT_TABLE } from '@/lib/shared/constants'
import type { AcvDetailRow } from '@/lib/shared/types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const kpiType = searchParams.get('kpiType') ?? ''
  const month = searchParams.get('month') ?? ''   // 'YYYY-MM-01'
  const segment = searchParams.get('segment') ?? 'All'

  if (!kpiType || !month) {
    return json({ ok: false, error: 'kpiType and month are required' }, { status: 400 })
  }

  try {
    const rows = await runQuery<AcvDetailRow>(
      `
      SELECT
        Account_Name AS account_name,
        Segment      AS segment,
        SUM(kpi_value) AS value
      FROM ${ACV_MOVEMENT_TABLE}
      WHERE kpi_type = @kpiType
        AND DATE_TRUNC(month, MONTH) = DATE(@month)
        AND (@segment = 'All' OR Segment = @segment)
      GROUP BY account_name, segment
      HAVING SUM(kpi_value) != 0
      ORDER BY ABS(SUM(kpi_value)) DESC
      `,
      { kpiType, month, segment }
    )
    return json({ ok: true, kpiType, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ ok: false, error: message }, { status: 500 })
  }
}
