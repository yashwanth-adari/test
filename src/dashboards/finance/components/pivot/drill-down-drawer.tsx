'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { apiFetch } from '@/lib/shared/api'
import { cn } from '@/lib/shared/utils'
import type { AcvDetailRow } from '@/lib/shared/types'

interface DrawerProps {
  kpiType: string
  month: string       // 'YYYY-MM-01'
  monthLabel: string  // 'Oct 2025'
  segment: string
  onClose: () => void
}

interface DetailResponse {
  ok: boolean
  kpiType: string
  rows: AcvDetailRow[]
}

function fmtValue(n: number): string {
  const abs = Math.abs(n)
  const s = abs.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return n < 0 ? `(€${s})` : `€${s}`
}

export function DrillDownDrawer({ kpiType, month, monthLabel, segment, onClose }: DrawerProps) {
  const qs = new URLSearchParams({ kpiType, month, segment }).toString()

  const { data, isLoading } = useQuery<DetailResponse>({
    queryKey: ['pivot-detail', kpiType, month, segment],
    queryFn: () => apiFetch<DetailResponse>(`/api/finance/pivot/detail?${qs}`),
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const rows = data?.rows ?? []
  const total = rows.reduce((sum, r) => sum + r.value, 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{monthLabel}</p>
            <h2 className="text-base font-semibold text-foreground">{kpiType}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-9 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No data for this period.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr className="border-b border-border">
                  <th className="px-5 py-2.5 text-left font-medium text-muted-foreground">Account</th>
                  <th className="px-5 py-2.5 text-right font-medium text-muted-foreground">Value</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      'border-b border-border/50 last:border-0',
                      'hover:bg-muted/40 transition-colors'
                    )}
                  >
                    <td
                      className="px-5 py-2.5 text-foreground truncate max-w-[280px]"
                      title={row.account_name}
                    >
                      {row.account_name}
                    </td>
                    <td
                      className={cn(
                        'px-5 py-2.5 text-right tabular-nums font-medium',
                        row.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                      )}
                    >
                      {fmtValue(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer total */}
        {!isLoading && rows.length > 0 && (
          <div className="border-t border-border px-5 py-3 flex items-center justify-between bg-muted/30">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Total</span>
            <span
              className={cn(
                'text-sm font-bold tabular-nums',
                total < 0 ? 'text-red-600 dark:text-red-400' : 'text-foreground'
              )}
            >
              {fmtValue(total)}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
