'use client'

import React, { memo, useMemo } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { cn } from '@/lib/shared/utils'
import { getColorHex, type AvailableChartColors } from './chartUtils'

interface BarChartProps {
  data: Record<string, unknown>[]
  index: string
  categories: string[]
  colors?: AvailableChartColors[]
  valueFormatter?: (value: number) => string
  showXAxis?: boolean
  showYAxis?: boolean
  showGridLines?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  type?: 'default' | 'stacked'
  layout?: 'vertical' | 'horizontal'
  className?: string
  yAxisWidth?: number
  barCategoryGap?: string | number
}

const DEFAULT_COLORS: AvailableChartColors[] = ['blue', 'emerald', 'violet', 'amber', 'cyan']
const RADIUS = 4
const MIN_LABEL_PX = 24

interface RechartsLabelGeometry {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  value?: string | number
}

function SegmentLabel({
  x, y, width, height, value, layout, formatter,
}: RechartsLabelGeometry & { layout: 'horizontal' | 'vertical'; formatter: (v: number) => string }) {
  if (value == null || value === 0) return null
  const nx = Number(x ?? 0)
  const ny = Number(y ?? 0)
  const nw = Number(width ?? 0)
  const nh = Number(height ?? 0)
  const span = layout === 'horizontal' ? nh : nw
  if (span < MIN_LABEL_PX) return null
  const text = typeof value === 'number' ? formatter(value) : String(value)
  return (
    <text
      x={nx + nw / 2}
      y={ny + nh / 2}
      textAnchor="middle"
      dominantBaseline="central"
      className="fill-white text-[11px] font-semibold tabular-nums"
      style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 2 }}
    >
      {text}
    </text>
  )
}

export const BarChart = memo(function BarChart({
  data,
  index,
  categories,
  colors = DEFAULT_COLORS,
  valueFormatter = (v) => v.toLocaleString(),
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  showLegend = true,
  showTooltip = true,
  type = 'default',
  layout = 'horizontal',
  className,
  yAxisWidth = 56,
  barCategoryGap = '20%',
}: BarChartProps) {
  const isVertical = layout === 'vertical'
  const isStacked = type === 'stacked'

  const chartConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {}
    categories.forEach((cat, i) => {
      cfg[cat] = { label: cat, color: getColorHex(colors[i % colors.length]) }
    })
    return cfg
  }, [categories, colors])

  const lastIdx = categories.length - 1
  const radiusFor = (i: number): [number, number, number, number] => {
    if (!isStacked) return isVertical ? [0, RADIUS, RADIUS, 0] : [RADIUS, RADIUS, 0, 0]
    if (categories.length === 1) return [RADIUS, RADIUS, RADIUS, RADIUS]
    if (isVertical) {
      if (i === 0) return [RADIUS, 0, 0, RADIUS]
      if (i === lastIdx) return [0, RADIUS, RADIUS, 0]
      return [0, 0, 0, 0]
    }
    if (i === 0) return [0, 0, RADIUS, RADIUS]
    if (i === lastIdx) return [RADIUS, RADIUS, 0, 0]
    return [0, 0, 0, 0]
  }

  return (
    <ChartContainer config={chartConfig} className={cn('h-80 w-full', className)}>
      <RechartsBarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        barCategoryGap={barCategoryGap}
      >
        {showGridLines && (
          <CartesianGrid strokeDasharray="3 3" horizontal={!isVertical} vertical={isVertical} className="stroke-border/50" />
        )}
        {isVertical ? (
          <>
            <YAxis dataKey={index} type="category" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={yAxisWidth} className="text-muted-foreground" hide={!showYAxis} />
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={valueFormatter} className="text-muted-foreground" hide={!showXAxis} />
          </>
        ) : (
          <>
            <XAxis dataKey={index} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-muted-foreground" hide={!showXAxis} />
            <YAxis width={yAxisWidth} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={valueFormatter} className="text-muted-foreground" hide={!showYAxis} />
          </>
        )}
        {showTooltip && (
          <ChartTooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-medium tabular-nums">{valueFormatter(value as number)}</span>
                  </div>
                )}
              />
            }
          />
        )}
        {showLegend && categories.length > 1 && (
          <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        )}
        {categories.map((category, i) => (
          <Bar
            key={category}
            dataKey={category}
            name={category}
            fill={getColorHex(colors[i % colors.length])}
            radius={radiusFor(i)}
            stackId={isStacked ? 'stack' : undefined}
            isAnimationActive={false}
          >
            <LabelList
              dataKey={category}
              content={(props) => (
                <SegmentLabel
                  {...(props as RechartsLabelGeometry)}
                  layout={isVertical ? 'vertical' : 'horizontal'}
                  formatter={valueFormatter}
                />
              )}
            />
          </Bar>
        ))}
      </RechartsBarChart>
    </ChartContainer>
  )
})
