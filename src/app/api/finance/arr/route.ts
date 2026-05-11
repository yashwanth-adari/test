import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/shared/bigquery'
import { json } from '@/lib/shared/json'
import { ARR_TABLE } from '@/lib/shared/constants'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const segment = searchParams.get('segment') ?? 'All'

  try {
    const rows = await runQuery<{
      month_label: string
      month_sort: number
      segment: string
      arr_eur: number
    }>(
      `
      SELECT
        FORMAT_DATE('%b %Y', month) AS month_label,
        UNIX_DATE(month) AS month_sort,
        segment,
        SUM(arr_eur) AS arr_eur
      FROM ${ARR_TABLE}
      WHERE (@segment = 'All' OR segment = @segment)
      GROUP BY 1, 2, 3
      ORDER BY 2
      `,
      { segment }
    )

    return json({ ok: true, rows })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ ok: false, error: message }, { status: 500 })
  }
}
