'use client'

import { memo, useMemo } from 'react'
import {
  Info,
  FileText,
  UserPlus,
  TrendingUp,
  CheckCircle2,
  UserMinus,
  ArrowDownRight,
  ArrowUpDown,
  Landmark,
  TableProperties,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/shared/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { PivotData } from './finance-pivot-tab'

// ── Value formatting ─────────────────────────────────────────────────────────

function fmtCell(n: number | null | undefined): string {
  if (n == null || n === 0) return '—'
  const abs = Math.abs(n)
  const s = abs.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n < 0 ? `(€${s})` : `€${s}`
}

function fmtPct(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`
}

// ── KPI metadata ─────────────────────────────────────────────────────────────

interface KpiMeta {
  icon: LucideIcon
  iconBg: string       // icon wrapper background + text color
  rowBg: string        // <tr> background (drives non-sticky cells)
  stickyBg: string     // <td sticky> solid background (no opacity — prevents bleed-through)
  leftBorder: string   // left accent on sticky td
  labelText: string    // label text styles
  dividerAbove?: boolean
  indent?: boolean
}

const KPI_META: Record<string, KpiMeta> = {
  'Bookings': {
    icon: FileText,
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300',
    rowBg: 'bg-violet-50/70 dark:bg-violet-950/20',
    stickyBg: 'bg-violet-50 dark:bg-violet-950/40',
    leftBorder: 'border-l-2 border-l-violet-400',
    labelText: 'font-semibold text-violet-900 dark:text-violet-200',
  },
  'New Logo': {
    icon: UserPlus,
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300',
    rowBg: 'bg-white dark:bg-slate-950',
    stickyBg: 'bg-white dark:bg-slate-950',
    leftBorder: 'border-l-2 border-l-slate-200 dark:border-l-slate-700',
    labelText: 'text-slate-600 dark:text-slate-400',
    indent: true,
  },
  'Upsell': {
    icon: TrendingUp,
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/60 dark:text-sky-300',
    rowBg: 'bg-white dark:bg-slate-950',
    stickyBg: 'bg-white dark:bg-slate-950',
    leftBorder: 'border-l-2 border-l-slate-200 dark:border-l-slate-700',
    labelText: 'text-slate-600 dark:text-slate-400',
    indent: true,
  },
  'New ACV': {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    rowBg: 'bg-emerald-50/60 dark:bg-emerald-950/20',
    stickyBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    leftBorder: 'border-l-2 border-l-emerald-400',
    labelText: 'font-semibold text-emerald-900 dark:text-emerald-200',
    dividerAbove: true,
  },
  'Churn': {
    icon: UserMinus,
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300',
    rowBg: 'bg-white dark:bg-slate-950',
    stickyBg: 'bg-white dark:bg-slate-950',
    leftBorder: 'border-l-2 border-l-red-300',
    labelText: 'text-red-700 dark:text-red-400',
    dividerAbove: true,
    indent: true,
  },
  'Downgrade': {
    icon: ArrowDownRight,
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-300',
    rowBg: 'bg-white dark:bg-slate-950',
    stickyBg: 'bg-white dark:bg-slate-950',
    leftBorder: 'border-l-2 border-l-orange-300',
    labelText: 'text-orange-700 dark:text-orange-400',
    indent: true,
  },
  'Net New ACV': {
    icon: ArrowUpDown,
    iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    rowBg: 'bg-amber-50/60 dark:bg-amber-950/20',
    stickyBg: 'bg-amber-50 dark:bg-amber-950/40',
    leftBorder: 'border-l-2 border-l-amber-400',
    labelText: 'font-bold text-amber-900 dark:text-amber-200',
    dividerAbove: true,
  },
  'ACV (EoP)': {
    icon: Landmark,
    iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
    rowBg: 'bg-blue-50/60 dark:bg-blue-950/20',
    stickyBg: 'bg-blue-50 dark:bg-blue-950/40',
    leftBorder: 'border-l-2 border-l-blue-400',
    labelText: 'font-semibold text-blue-900 dark:text-blue-200',
    dividerAbove: true,
  },
}

const KPI_TOOLTIPS: Record<string, string> = {
  'Bookings':    'Total contract value of all signed deals in the reporting period, including POCs, one-time revenue, and recurring revenue.',
  'New Logo':    'ACV generated from new customers.',
  'Upsell':      'Additional ACV from existing customers expanding their contracts.',
  'New ACV':     'Total positive ACV generated during the month (New Logo + Upsell), excluding POCs.',
  'Churn':       'ACV lost due to customer cancellations.',
  'Downgrade':   'Reduction in ACV from customers reducing their contract size.',
  'Net New ACV': 'Net change in ACV after churn and downgrades.',
  'ACV (EoP)':   'Annual value of all deals signed to date (new logo and upsell), net of churn and downgrade.',
}

function cellChangeClass(kpiType: string, value: number, pct: number | null): string {
  // Net New ACV: value itself is colored
  if (kpiType === 'Net New ACV') {
    return value >= 0
      ? 'text-emerald-700 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400'
  }
  return ''
}

// ── Component ────────────────────────────────────────────────────────────────

interface PivotTableProps {
  pivot: PivotData
  isLoading: boolean
  activeMonthSort: number | null
  onCellClick: (kpiType: string, month: string, monthLabel: string, monthSort: number) => void
}

export const PivotTable = memo(function PivotTable({
  pivot,
  isLoading,
  activeMonthSort,
  onCellClick,
}: PivotTableProps) {
  const { months, kpiRows, quarterGroups } = pivot

  // Build prev-month lookup: monthSort → previous monthSort
  const prevSortMap = useMemo(() => {
    const map = new Map<number, number>()
    for (let i = 1; i < months.length; i++) {
      map.set(months[i].sort, months[i - 1].sort)
    }
    return map
  }, [months])

  const periodLabel =
    months.length > 0
      ? `${months[0].label} – ${months[months.length - 1].label}`
      : ''

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border">
        <div className="h-64 flex items-center justify-center text-muted-foreground text-sm animate-pulse">
          Loading data…
        </div>
      </div>
    )
  }

  if (months.length === 0) {
    return (
      <div className="rounded-xl border border-border">
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          No data for the selected period.
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delay={300}>
      <div className="rounded-xl border border-border shadow-sm overflow-hidden print:shadow-none print:border-0">

        {/* ── Table title bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-white dark:bg-slate-950">
          <div className="flex items-center gap-2.5">
            {/* Gradient accent */}
            <div className="w-[3px] h-5 rounded-full bg-gradient-to-b from-violet-500 via-emerald-500 to-blue-500 shrink-0" />
            <TableProperties size={15} className="text-muted-foreground" />
            <span className="font-semibold text-sm text-foreground">ACV &amp; Bookings</span>
            <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">EUR</span>
          </div>
          {periodLabel && (
            <span className="text-xs text-muted-foreground">{periodLabel}</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm border-collapse">
            <thead>
              {/* Row 1: fiscal quarter groups — alternating tint per group */}
              <tr className="border-b border-border">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 text-left min-w-[200px] border-r border-border">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Metric
                  </span>
                </th>
                {quarterGroups.map((qg, qi) => (
                  <th
                    key={qg.label}
                    colSpan={qg.count}
                    className={cn(
                      'px-3 py-2.5 text-center text-xs font-bold tracking-wider uppercase border-l border-border/70',
                      qi % 2 === 0
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                    )}
                  >
                    {qg.label}
                  </th>
                ))}
              </tr>

              {/* Row 2: month labels */}
              <tr className="border-b-2 border-border">
                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 px-4 py-2 border-r border-border" />
                {months.map((m, mi) => {
                  // Determine which quarter group this month belongs to (for alternating shading)
                  let qIdx = 0
                  let count = 0
                  for (let i = 0; i < quarterGroups.length; i++) {
                    count += quarterGroups[i].count
                    if (mi < count) { qIdx = i; break }
                  }
                  return (
                    <th
                      key={m.sort}
                      className={cn(
                        'px-3 py-2 text-center text-xs font-semibold whitespace-nowrap border-l border-border/50 min-w-[110px]',
                        qIdx % 2 === 0
                          ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                          : 'bg-slate-50/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400',
                        activeMonthSort === m.sort && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                      )}
                    >
                      {m.label}
                    </th>
                  )
                })}
              </tr>
            </thead>

            <tbody>
              {kpiRows.map((row) => {
                const meta = KPI_META[row.kpiType]
                const tooltip = KPI_TOOLTIPS[row.kpiType]
                return (
                  <tr
                    key={row.kpiType}
                    className={cn(
                      meta?.rowBg ?? 'bg-white dark:bg-transparent',
                      'border-b border-border/40 last:border-0',
                      meta?.dividerAbove && 'border-t-2 border-t-border/60',
                      'transition-colors duration-150 hover:bg-muted/50'
                    )}
                  >
                    {/* ── Sticky label cell ── */}
                    <td
                      className={cn(
                        'sticky left-0 z-10 px-3 py-2.5 border-r border-border',
                        meta?.stickyBg ?? 'bg-white dark:bg-slate-950',
                        meta?.leftBorder,
                      )}
                    >
                      <div className={cn('flex items-center gap-2', meta?.indent && 'pl-5')}>
                        {/* Label + tooltip */}
                        {tooltip ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={<span />}
                              className={cn(
                                'inline-flex items-center gap-1 cursor-default whitespace-nowrap',
                                meta?.labelText
                              )}
                            >
                              {row.kpiType}
                              <Info size={10} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[260px] text-left leading-relaxed">
                              {tooltip}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className={cn('whitespace-nowrap', meta?.labelText)}>
                            {row.kpiType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* ── Value cells ── */}
                    {months.map((m) => {
                      const value = row.cells.get(m.sort) ?? 0
                      const prevSort = prevSortMap.get(m.sort)
                      const prevValue = prevSort !== undefined ? (row.cells.get(prevSort) ?? null) : null
                      const changePct =
                        prevValue !== null && prevValue !== 0
                          ? ((value - prevValue) / Math.abs(prevValue)) * 100
                          : null

                      return (
                        <td
                          key={m.sort}
                          onClick={() => onCellClick(row.kpiType, m.month, m.label, m.sort)}
                          className={cn(
                            'px-3 py-2 border-l border-border/30',
                            'cursor-pointer transition-colors duration-150',
                            activeMonthSort === m.sort &&
                              'ring-1 ring-inset ring-blue-400/50 bg-blue-50/60 dark:bg-blue-900/20'
                          )}
                        >
                          {/* Main value */}
                          <div
                            className={cn(
                              'text-right tabular-nums text-sm font-medium whitespace-nowrap',
                              cellChangeClass(row.kpiType, value, changePct)
                            )}
                          >
                            {fmtCell(value)}
                          </div>

                          {/* Period-over-period % change */}
                          {changePct !== null && value !== 0 && (
                            <div
                              className={cn(
                                'text-right tabular-nums text-[10px] font-semibold leading-tight mt-0.5',
                                changePct >= 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-red-500 dark:text-red-400'
                              )}
                            >
                              {fmtPct(changePct)}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TooltipProvider>
  )
})
