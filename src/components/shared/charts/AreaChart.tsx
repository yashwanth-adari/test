'use client'

import React, { memo } from 'react'
import {
  AreaChart as RechartsAreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from 'recharts'
import { cn } from '@/lib/shared/utils'
import { getColorHex, type AvailableChartColors } from './chartUtils'

interface AreaChartProps {
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
  startEndOnly?: boolean
  connectNulls?: boolean
  type?: 'default' | 'stacked'
  fill?: 'gradient' | 'solid' | 'none'
  className?: string
  yAxisWidth?: number
}

export const AreaChart = memo(function AreaChart({
  data,
  index,
  categories,
  colors = ['blue', 'emerald', 'violet', 'amber', 'cyan'],
  valueFormatter = (v) => v.toLocaleString(),
  showXAxis = true,
  showYAxis = true,
  showGridLines = true,
  showLegend = true,
  showTooltip = true,
  startEndOnly = false,
  connectNulls = false,
  type = 'default',
  fill = 'gradient',
  className,
  yAxisWidth = 56,
}: AreaChartProps) {
  return (
    <div className={cn('h-80 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <RechartsAreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          {showGridLines && (
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} className="stroke-border/50" />
          )}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              interval={startEndOnly ? 'preserveStartEnd' : 'equidistantPreserveStart'}
              minTickGap={5}
            />
          )}
          {showYAxis && (
            <YAxis width={yAxisWidth} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={valueFormatter} className="text-muted-foreground" />
          )}
          {showTooltip && (
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                    {payload.map((p) => (
                      <div key={p.dataKey as string} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                        <span className="text-muted-foreground">{p.name}</span>
                        <span className="ml-auto font-medium tabular-nums">{valueFormatter(p.value as number)}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
          )}
          {showLegend && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          )}
          {categories.map((category, i) => {
            const color = getColorHex(colors[i % colors.length])
            const gradientId = `area-gradient-${category}`
            return (
              <React.Fragment key={category}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={fill === 'gradient' ? 0.3 : fill === 'solid' ? 0.5 : 0} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey={category}
                  name={category}
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  stackId={type === 'stacked' ? 'stack' : undefined}
                  connectNulls={connectNulls}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1 }}
                />
              </React.Fragment>
            )
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
})
