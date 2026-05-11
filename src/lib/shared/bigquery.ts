import { BigQuery } from '@google-cloud/bigquery'

declare global {
  // eslint-disable-next-line no-var
  var __bigquery__: BigQuery | undefined
}

export const bigquery =
  global.__bigquery__ ||
  new BigQuery({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  })

if (process.env.NODE_ENV !== 'production') {
  global.__bigquery__ = bigquery
}

export async function runQuery<T extends Record<string, unknown>>(
  sql: string,
  params?: Record<string, unknown>
): Promise<T[]> {
  try {
    const [job] = await bigquery.createQueryJob({
      query: sql,
      params: params && Object.keys(params).length > 0 ? params : undefined,
      maximumBytesBilled: '500000000',
      useLegacySql: false,
    })

    const [rows] = await job.getQueryResults()
    return rows as T[]
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const errorId = crypto.randomUUID()
    console.error(`BigQuery error [${errorId}]:`, message)

    if (message.includes('bytesBilled') || message.includes('bytes billed')) {
      throw new Error(
        `Query exceeded the scan limit (ref: ${errorId}). Try narrowing your filters.`
      )
    }

    throw new Error(
      `Data query failed (ref: ${errorId}). Try refreshing — if this persists, contact the dashboard admin.`
    )
  }
}
