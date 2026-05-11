import { runQuery } from '@/lib/shared/bigquery'
import { json } from '@/lib/shared/json'
import { ACV_MOVEMENT_TABLE } from '@/lib/shared/constants'

export async function GET() {
  try {
    const [segments, fiscalYears] = await Promise.all([
      runQuery<{ segment: string }>(`
        SELECT DISTINCT segment
        FROM ${ACV_MOVEMENT_TABLE}
        WHERE segment IS NOT NULL
        ORDER BY segment
      `),
      runQuery<{ fiscal_year: string; fiscal_year_num: number }>(`
        SELECT DISTINCT fiscal_year, fiscal_year_num
        FROM ${ACV_MOVEMENT_TABLE}
        ORDER BY fiscal_year_num
      `),
    ])

    return json({
      ok: true,
      segments: segments.map((r) => r.segment),
      fiscalYears: fiscalYears.map((r) => r.fiscal_year),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return json({ ok: false, error: message }, { status: 500 })
  }
}
