'use client'

import { memo, useMemo } from 'react'
import { BarChart } from '@/components/shared/charts/BarChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/shared/format'
import type { PivotData } from './finance-pivot-tab'

const MOVEMENT_KPIS = ['New Logo', 'Upsell', 'Churn', 'Downgrade']
const MOVEMENT_COLORS = ['emerald', 'blue', 'red', 'amber'] as const

interface PivotChartProps {
  pivot: PivotData
  activeMonthSort: number | null
  onBarClick: (monthSort: number) => void
}

export const PivotChart = memo(function PivotChart({ pivot, activeMonthSort, onBarClick }: PivotChartProps) {
  const { months, kpiRows } = pivot

  const chartData = useMemo(() => {
    const kpiMap = new Map(kpiRows.map((r) => [r.kpiType, r]))
    return months.map((m) => {
      const point: Record<string, unknown> = {
        period: m.label,
        _monthSort: m.sort,
      }
      for (const kpi of MOVEMENT_KPIS) {
        point[kpi] = Math.round(kpiMap.get(kpi)?.cells.get(m.sort) ?? 0)
      }
      return point
    })
  }, [months, kpiRows])

  if (months.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          ACV Movement by Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart
          data={chartData}
          index="period"
          categories={MOVEMENT_KPIS}
          colors={[...MOVEMENT_COLORS]}
          type="stacked"
          valueFormatter={(v) => formatCurrency(v)}
          showLegend
          yAxisWidth={64}
          className="h-64"
        />
        {activeMonthSort !== null && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Click a table cell or bar to highlight a month
          </p>
        )}
      </CardContent>
    </Card>
  )
})
