'use client'

import { useQuery } from '@tanstack/react-query'
import { useFinanceFilters } from '@/dashboards/finance/hooks/use-filters'
import { apiFetch } from '@/lib/shared/api'
import { formatCurrency, pctChange } from '@/lib/shared/format'
import { GRANULARITY_OPTIONS } from '@/lib/shared/constants'
import { KpiCard } from '@/components/shared/kpi-card'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { BarChart } from '@/components/shared/charts/BarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { AcvMovementRow } from '@/lib/shared/types'

interface AcvMovementResponse {
  ok: boolean
  rows: AcvMovementRow[]
  error?: string
}

interface FilterOptionsResponse {
  ok: boolean
  segments: string[]
  fiscalYears: string[]
}

export function AcvMovementTab() {
  const { filters, setFilter, queryString } = useFinanceFilters()

  const { data, isLoading, error, refetch } = useQuery<AcvMovementResponse>({
    queryKey: ['acv-movement', queryString],
    queryFn: () => apiFetch<AcvMovementResponse>(`/api/finance/acv-movement?${queryString}`),
  })

  const { data: filterOptions } = useQuery<FilterOptionsResponse>({
    queryKey: ['filter-options'],
    queryFn: () => apiFetch<FilterOptionsResponse>('/api/finance/filter-options'),
    staleTime: Infinity,
  })

  const rows = data?.rows ?? []

  const lastRow = rows[rows.length - 1]
  const prevRow = rows[rows.length - 2]

  const netNewAcv = lastRow?.net_new_acv ?? 0
  const newLogo = lastRow?.new_logo ?? 0
  const upsell = lastRow?.upsell ?? 0
  const churn = lastRow?.churn ?? 0
  const acvEop = lastRow?.acv_eop ?? null

  const chartData = rows.map((r) => ({
    period: r.period,
    'New Logo': Math.round(r.new_logo),
    Upsell: Math.round(r.upsell),
    Churn: Math.round(r.churn),
    Downgrade: Math.round(r.downgrade),
  }))

  const netNewData = rows.map((r) => ({
    period: r.period,
    'Net New ACV': Math.round(r.net_new_acv),
  }))

  if (error) {
    return <ErrorFallback message={(error as Error).message} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={filters.granularity}
          onValueChange={(v) => v && setFilter('granularity', v as 'month' | 'quarter' | 'year')}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue>{GRANULARITY_OPTIONS.find((o) => o.value === filters.granularity)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Select
          value={filters.fiscalYear}
          onValueChange={(v) => v && setFilter('fiscalYear', v)}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue>{filters.fiscalYear === 'All' ? 'All Years' : filters.fiscalYear}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Years</SelectItem>
            {filterOptions?.fiscalYears.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid auto-rows-[auto] grid-cols-2 gap-4 sm:grid-cols-4" style={{ gridAutoRows: 'subgrid' }}>
        <div className="col-span-2 sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4 [grid-template-rows:subgrid] [grid-row:span_4]">
          <KpiCard
            label="Net New ACV"
            value={formatCurrency(netNewAcv)}
            previousValue={prevRow ? formatCurrency(prevRow.net_new_acv) : undefined}
            changePercent={prevRow ? pctChange(netNewAcv, prevRow.net_new_acv) : undefined}
            loading={isLoading}
          />
          <KpiCard
            label="New Logo"
            value={formatCurrency(newLogo)}
            previousValue={prevRow ? formatCurrency(prevRow.new_logo) : undefined}
            changePercent={prevRow ? pctChange(newLogo, prevRow.new_logo) : undefined}
            loading={isLoading}
          />
          <KpiCard
            label="Upsell"
            value={formatCurrency(upsell)}
            previousValue={prevRow ? formatCurrency(prevRow.upsell) : undefined}
            changePercent={prevRow ? pctChange(upsell, prevRow.upsell) : undefined}
            loading={isLoading}
          />
          <KpiCard
            label="Churn"
            value={formatCurrency(churn)}
            changeDirection="down-is-good"
            rag={churn < 0 ? 'red' : 'neutral'}
            loading={isLoading}
          />
        </div>
      </div>

      {acvEop !== null && (
        <div className="grid grid-cols-1 gap-4">
          <KpiCard
            label="ACV (End of Period)"
            value={formatCurrency(acvEop)}
            loading={isLoading}
          />
        </div>
      )}

      {/* Movement Chart */}
      <Card>
        <CardHeader>
          <CardTitle>ACV Movement by Period</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={chartData}
            index="period"
            categories={['New Logo', 'Upsell', 'Churn', 'Downgrade']}
            colors={['emerald', 'blue', 'red', 'amber']}
            type="stacked"
            valueFormatter={(v) => formatCurrency(v)}
            showLegend
            className="h-72"
          />
        </CardContent>
      </Card>

      {/* Net New ACV Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Net New ACV</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={netNewData}
            index="period"
            categories={['Net New ACV']}
            colors={['blue']}
            valueFormatter={(v) => formatCurrency(v)}
            showLegend={false}
            className="h-56"
          />
        </CardContent>
      </Card>
    </div>
  )
}
