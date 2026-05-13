'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RotateCcw, TrendingDown, TrendingUp, Euro, ArrowUpDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { apiFetch } from '@/lib/shared/api'
import { pctChange } from '@/lib/shared/format'
import { ErrorFallback } from '@/components/shared/error-fallback'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/shared/utils'
import { useFinanceFilters } from '@/dashboards/finance/hooks/use-filters'
import { PivotTable } from './pivot-table'
import { DrillDownDrawer } from './drill-down-drawer'
import { PivotChart } from './pivot-chart'
import { ExportMenu } from './export-menu'
import type { PivotDataRow, FilterOptionsResponse } from '@/lib/shared/types'

// ── Pivot data structure ────────────────────────────────────────────────────

export interface PivotMonth {
  label: string
  sort: number
  month: string    // 'YYYY-MM-01'
  fqLabel: string
  fqSort: number
}

export interface PivotKpiRow {
  kpiType: string
  kpiOrder: number
  cells: Map<number, number>  // monthSort → value
}

export interface PivotData {
  months: PivotMonth[]
  kpiRows: PivotKpiRow[]
  quarterGroups: Array<{ label: string; count: number }>
}

function buildPivot(rows: PivotDataRow[]): PivotData {
  const monthMap = new Map<number, PivotMonth>()
  const kpiMap = new Map<string, PivotKpiRow>()

  for (const row of rows) {
    if (!monthMap.has(row.month_sort)) {
      monthMap.set(row.month_sort, {
        label: row.month_label,
        sort: row.month_sort,
        month: row.month,
        fqLabel: row.fiscal_year_quarter,
        fqSort: row.fiscal_qtr_sort,
      })
    }
    if (!kpiMap.has(row.kpi_type)) {
      kpiMap.set(row.kpi_type, {
        kpiType: row.kpi_type,
        kpiOrder: row.kpi_order,
        cells: new Map(),
      })
    }
    kpiMap.get(row.kpi_type)!.cells.set(row.month_sort, row.value)
  }

  const months = [...monthMap.values()].sort((a, b) => a.sort - b.sort)
  const kpiRows = [...kpiMap.values()].sort((a, b) => a.kpiOrder - b.kpiOrder)

  const quarterGroups: Array<{ label: string; count: number }> = []
  for (const m of months) {
    const last = quarterGroups[quarterGroups.length - 1]
    if (last && last.label === m.fqLabel) {
      last.count++
    } else {
      quarterGroups.push({ label: m.fqLabel, count: 1 })
    }
  }

  return { months, kpiRows, quarterGroups }
}

// ── Period presets ──────────────────────────────────────────────────────────

const PERIOD_PRESETS = [
  { label: '6M',  months: 5 },
  { label: '12M', months: 11 },
  { label: '24M', months: 23 },
]

function calcStartForPreset(preset: string, endMonth: string): string {
  const p = PERIOD_PRESETS.find((p) => p.label === preset)
  if (!p) return endMonth
  const [y, m] = endMonth.split('-').map(Number)
  const d = new Date(y, m - 1 - p.months, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function getActivePreset(
  startMonth: string,
  endMonth: string,
  minMonth: string | undefined,
  maxMonth: string | undefined
): string | null {
  if (minMonth && maxMonth && startMonth === minMonth && endMonth === maxMonth) return 'All'
  const [sy, sm] = startMonth.split('-').map(Number)
  const [ey, em] = endMonth.split('-').map(Number)
  const diff = (ey - sy) * 12 + (em - sm)
  if (diff === 5) return '6M'
  if (diff === 11) return '12M'
  if (diff === 23) return '24M'
  return null
}

// ── Formatting helpers ──────────────────────────────────────────────────────

function fmtFull(n: number | null | undefined): string {
  if (n == null) return '—'
  const abs = Math.abs(n)
  const s = abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
  return n < 0 ? `(€${s})` : `€${s}`
}

function fmtAsOf(dateStr: string): string {
  if (!dateStr) return ''
  const [y, m] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function toMonthInput(s: string) { return s.slice(0, 7) }
function fromMonthInput(s: string) { return `${s}-01` }

// ── KPI header tile ─────────────────────────────────────────────────────────

function HeadlineTile({
  label,
  value,
  change,
  icon: Icon,
  iconBg,
  loading,
  negative,
}: {
  label: string
  value: string
  change: number | null
  icon: LucideIcon
  iconBg: string
  loading: boolean
  negative?: boolean
}) {
  const isUp = change !== null && change > 0
  const ChangeIcon = isUp ? TrendingUp : TrendingDown
  const changeColor = change === null
    ? ''
    : isUp
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400'

  return (
    <Card className="flex-1 min-w-0 px-5 py-4">
      {loading ? (
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-11 w-11 rounded-xl bg-muted shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded bg-muted" />
            <div className="h-6 w-32 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconBg)}>
            <Icon size={20} />
          </div>
          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
              {label}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={cn(
                  'text-xl font-bold tabular-nums tracking-tight leading-none',
                  negative ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                )}
              >
                {value}
              </span>
              {change !== null && (
                <span className={cn('flex items-center gap-0.5 text-[11px] font-bold', changeColor)}>
                  <ChangeIcon size={11} />
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">vs prior month</p>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

interface PivotResponse {
  ok: boolean
  rows: PivotDataRow[]
  error?: string
}

interface DrillDownState {
  kpiType: string
  month: string
  monthLabel: string
  monthSort: number
}

export function FinancePivotTab() {
  const { filters, setFilter, resetFilters, queryString } = useFinanceFilters()
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null)
  const [activeMonthSort, setActiveMonthSort] = useState<number | null>(null)

  const { data: options } = useQuery<FilterOptionsResponse>({
    queryKey: ['filter-options'],
    queryFn: () => apiFetch<FilterOptionsResponse>('/api/finance/filter-options'),
    staleTime: Infinity,
  })

  const { data, isLoading, error, refetch } = useQuery<PivotResponse>({
    queryKey: ['pivot', queryString],
    queryFn: () => apiFetch<PivotResponse>(`/api/finance/pivot?${queryString}`),
    enabled: !!filters.startMonth && !!filters.endMonth,
  })

  const pivot = useMemo(() => buildPivot(data?.rows ?? []), [data])

  // Derive KPI headline values from the last two months in the pivot
  const { curAcvEop, prvAcvEop, curNetNew, prvNetNew } = useMemo(() => {
    const last = pivot.months[pivot.months.length - 1]
    const prev = pivot.months[pivot.months.length - 2]
    const acvRow = pivot.kpiRows.find((r) => r.kpiType === 'ACV (EoP)')
    const netRow = pivot.kpiRows.find((r) => r.kpiType === 'Net New ACV')
    return {
      curAcvEop: last ? (acvRow?.cells.get(last.sort) ?? null) : null,
      prvAcvEop: prev ? (acvRow?.cells.get(prev.sort) ?? null) : null,
      curNetNew: last ? (netRow?.cells.get(last.sort) ?? null) : null,
      prvNetNew: prev ? (netRow?.cells.get(prev.sort) ?? null) : null,
    }
  }, [pivot])

  const activePreset = getActivePreset(
    filters.startMonth,
    filters.endMonth,
    options?.minMonth,
    options?.maxMonth
  )

  const handlePreset = useCallback(
    (preset: string) => {
      if (preset === 'All') {
        if (options?.minMonth) setFilter('startMonth', options.minMonth)
        if (options?.maxMonth) setFilter('endMonth', options.maxMonth)
      } else {
        setFilter('startMonth', calcStartForPreset(preset, filters.endMonth))
      }
    },
    [filters.endMonth, options, setFilter]
  )

  const handleCellClick = useCallback(
    (kpiType: string, month: string, monthLabel: string, monthSort: number) => {
      setActiveMonthSort(monthSort)
      setDrillDown({ kpiType, month, monthLabel, monthSort })
    },
    []
  )

  const handleDrawerClose = useCallback(() => setDrillDown(null), [])

  if (error) {
    return <ErrorFallback message={(error as Error).message} onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-5 print:space-y-3">

      {/* ── Dashboard header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Investor Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">As of {fmtAsOf(filters.endMonth)}</p>
        </div>

        {/* Period pills */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 shrink-0">
          {PERIOD_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => handlePreset(p.label)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                activePreset === p.label
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => handlePreset('All')}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              activePreset === 'All'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>
        </div>
      </div>

      {/* ── KPI headline tiles ─────────────────────────────────────── */}
      <div className="flex gap-4 print:hidden">
        <HeadlineTile
          label="ACV (End of Period)"
          value={fmtFull(curAcvEop)}
          change={curAcvEop !== null && prvAcvEop !== null ? pctChange(curAcvEop, prvAcvEop) : null}
          icon={Euro}
          iconBg="bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300"
          loading={isLoading}
        />
        <HeadlineTile
          label="Net New ACV"
          value={fmtFull(curNetNew)}
          change={curNetNew !== null && prvNetNew !== null ? pctChange(curNetNew, prvNetNew) : null}
          icon={ArrowUpDown}
          iconBg={
            curNetNew !== null && curNetNew < 0
              ? 'bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300'
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300'
          }
          loading={isLoading}
          negative={curNetNew !== null && curNetNew < 0}
        />
      </div>

      {/* ── Filter bar ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground whitespace-nowrap">From</label>
          <input
            type="month"
            value={toMonthInput(filters.startMonth)}
            min={options?.minMonth ? toMonthInput(options.minMonth) : undefined}
            max={toMonthInput(filters.endMonth)}
            onChange={(e) => e.target.value && setFilter('startMonth', fromMonthInput(e.target.value))}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-muted-foreground whitespace-nowrap">To</label>
          <input
            type="month"
            value={toMonthInput(filters.endMonth)}
            min={toMonthInput(filters.startMonth)}
            max={options?.maxMonth ? toMonthInput(options.maxMonth) : undefined}
            onChange={(e) => e.target.value && setFilter('endMonth', fromMonthInput(e.target.value))}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Select
          value={filters.fiscalQuarter}
          onValueChange={(v) => v !== null && setFilter('fiscalQuarter', v ?? 'All')}
        >
          <SelectTrigger size="sm" className="w-36">
            <SelectValue>
              {filters.fiscalQuarter === 'All' ? 'All Quarters' : filters.fiscalQuarter}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Quarters</SelectItem>
            {options?.fiscalQuarters.map((q) => (
              <SelectItem key={q} value={q}>{q}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.segment}
          onValueChange={(v) => v !== null && setFilter('segment', v ?? 'All')}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue>
              {filters.segment === 'All' ? 'All Segments' : filters.segment}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Segments</SelectItem>
            {options?.segments.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border transition-colors"
        >
          <RotateCcw size={13} />
          Reset
        </button>

        <div className="ml-auto">
          <ExportMenu
            pivot={pivot}
            startMonth={filters.startMonth}
            endMonth={filters.endMonth}
          />
        </div>
      </div>

      {/* ── Pivot table ───────────────────────────────────────────── */}
      <PivotTable
        pivot={pivot}
        isLoading={isLoading}
        activeMonthSort={activeMonthSort}
        onCellClick={handleCellClick}
      />

      {/* ── Movement chart ────────────────────────────────────────── */}
      <PivotChart
        pivot={pivot}
        activeMonthSort={activeMonthSort}
        onBarClick={(sort) => setActiveMonthSort((prev) => (prev === sort ? null : sort))}
      />

      {/* ── Drill-down drawer ─────────────────────────────────────── */}
      {drillDown && (
        <DrillDownDrawer
          kpiType={drillDown.kpiType}
          month={drillDown.month}
          monthLabel={drillDown.monthLabel}
          segment={filters.segment}
          onClose={handleDrawerClose}
        />
      )}
    </div>
  )
}
