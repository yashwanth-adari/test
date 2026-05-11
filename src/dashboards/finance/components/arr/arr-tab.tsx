'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useFinanceFilters } from '@/dashboards/finance/hooks/use-filters'
import { apiFetch } from '@/lib/shared/api'
import { formatCurrency } from '@/lib/shared/format'
import { KpiCard } from '@/components/shared/kpi-card'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { AreaChart } from '@/components/shared/charts/AreaChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ArrRow, FilterOptionsResponse } from '@/lib/shared/types'

interface ArrResponse {
  ok: boolean
  rows: ArrRow[]
  error?: string
}

export function ArrTab() {
  const { filters, setFilter } = useFinanceFilters()

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.segment !== 'All') p.set('segment', filters.segment)
    return p.toString()
  }, [filters.segment])

  const { data, isLoading, error, refetch } = useQuery<ArrResponse>({
    queryKey: ['arr', qs],
    queryFn: () => apiFetch<ArrResponse>(`/api/finance/arr?${qs}`),
  })

  const { data: filterOptions } = useQuery<FilterOptionsResponse>({
    queryKey: ['filter-options'],
    queryFn: () => apiFetch<FilterOptionsResponse>('/api/finance/filter-options'),
    staleTime: Infinity,
  })

  const rows = data?.rows ?? []

  const segments = useMemo(() => {
    return [...new Set(rows.map((r) => r.segment))].sort()
  }, [rows])

  const chartData = useMemo(() => {
    const byPeriod = new Map<string, Record<string, number>>()
    for (const row of rows) {
      if (!byPeriod.has(row.month_label)) {
        byPeriod.set(row.month_label, { _sort: row.month_sort })
      }
      byPeriod.get(row.month_label)![row.segment] = row.arr_eur
    }
    return [...byPeriod.entries()]
      .sort((a, b) => (a[1]._sort as number) - (b[1]._sort as number))
      .map(([month_label, vals]) => {
        const { _sort: _unused, ...rest } = vals
        return { month_label, ...rest }
      })
  }, [rows])

  const totalArrData = useMemo(() => {
    const byPeriod = new Map<string, { month_label: string; month_sort: number; total: number }>()
    for (const row of rows) {
      const existing = byPeriod.get(row.month_label)
      if (existing) {
        existing.total += row.arr_eur
      } else {
        byPeriod.set(row.month_label, { month_label: row.month_label, month_sort: row.month_sort, total: row.arr_eur })
      }
    }
    return [...byPeriod.values()].sort((a, b) => a.month_sort - b.month_sort)
  }, [rows])

  const latestTotal = totalArrData[totalArrData.length - 1]?.total ?? 0
  const prevTotal = totalArrData[totalArrData.length - 2]?.total ?? 0

  if (error) {
    return <ErrorFallback message={(error as Error).message} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      {/* Segment Filter */}
      <div className="flex items-center gap-3">
        <Select
          value={filters.segment}
          onValueChange={(v) => v && setFilter('segment', v)}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue>{filters.segment === 'All' ? 'All Segments' : filters.segment}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Segments</SelectItem>
            {filterOptions?.segments.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 [grid-template-rows:subgrid] [grid-row:span_4]">
        <KpiCard
          label="Total ARR (latest month)"
          value={formatCurrency(latestTotal)}
          previousValue={formatCurrency(prevTotal)}
          loading={isLoading}
        />
      </div>

      {/* Total ARR Trend */}
      <Card>
        <CardHeader>
          <CardTitle>ARR Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <AreaChart
            data={totalArrData.map((r) => ({ period: r.month_label, 'Total ARR': Math.round(r.total) }))}
            index="period"
            categories={['Total ARR']}
            colors={['blue']}
            valueFormatter={(v) => formatCurrency(v)}
            startEndOnly
            showLegend={false}
            className="h-64"
          />
        </CardContent>
      </Card>

      {/* ARR by Segment */}
      {segments.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>ARR by Segment</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={chartData}
              index="month_label"
              categories={segments}
              type="stacked"
              valueFormatter={(v) => formatCurrency(v)}
              startEndOnly
              className="h-64"
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
