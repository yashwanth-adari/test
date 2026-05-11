'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/shared/utils'

type RagColor = 'green' | 'amber' | 'red' | 'neutral'

interface KpiCardProps {
  label: string
  value: string | number | React.ReactNode
  previousValue?: string | number
  changePercent?: number | null
  changeDirection?: 'up-is-good' | 'down-is-good'
  subline?: string
  sublineRag?: RagColor
  rag?: RagColor
  onClick?: () => void
  loading?: boolean
}

const RAG_VALUE: Record<RagColor, string> = {
  green: 'text-green-600 dark:text-green-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  neutral: '',
}

const SUBLINE_RAG_CLASSES: Record<RagColor, string> = {
  green: 'text-green-600 dark:text-green-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground',
}

function getDeltaBadge(changePercent: number | null | undefined, direction: 'up-is-good' | 'down-is-good' = 'up-is-good') {
  if (changePercent == null) return null
  const isUp = changePercent > 0
  const isPositive = (isUp && direction === 'up-is-good') || (!isUp && direction === 'down-is-good')
  const Icon = isUp ? TrendingUp : TrendingDown
  const color = isPositive
    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950'
    : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950'
  return (
    <Badge variant="secondary" className={cn('gap-0.5 text-[10px] font-medium px-1.5 py-0', color)}>
      <Icon className="h-3 w-3" />
      {isUp ? '+' : ''}{changePercent.toFixed(1)}%
    </Badge>
  )
}

export function KpiCard({
  label,
  value,
  previousValue,
  changePercent,
  changeDirection = 'up-is-good',
  subline,
  sublineRag,
  rag,
  onClick,
  loading,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card className="row-span-4 grid grid-rows-subgrid p-4 gap-0">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-24" />
        <div />
      </Card>
    )
  }

  const deltaBadge = getDeltaBadge(changePercent, changeDirection)

  return (
    <Card
      className={cn(
        'row-span-4 grid grid-rows-subgrid gap-0 p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
      onClick={onClick}
    >
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-baseline justify-between gap-2">
        <div className={cn('text-2xl font-bold tracking-tight tabular-nums', rag ? RAG_VALUE[rag] : '')}>{value}</div>
        {deltaBadge}
      </div>
      <div className="min-h-[16px]">
        {previousValue != null && (
          <p className="text-[11px] text-muted-foreground">vs {previousValue} prev. period</p>
        )}
        {subline && (
          <p className={cn('text-[11px]', sublineRag ? SUBLINE_RAG_CLASSES[sublineRag] : 'text-muted-foreground')}>{subline}</p>
        )}
      </div>
      <div />
    </Card>
  )
}
