'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileText, Sheet } from 'lucide-react'
import { cn } from '@/lib/shared/utils'
import type { PivotData } from './finance-pivot-tab'

interface ExportMenuProps {
  pivot: PivotData
  startMonth: string
  endMonth: string
}

function buildCsv(pivot: PivotData): string {
  const { months, kpiRows, quarterGroups } = pivot

  const lines: string[] = []

  // Quarter header row
  const qRow = [''].concat(
    quarterGroups.flatMap((qg) => [qg.label, ...Array(qg.count - 1).fill('')])
  )
  lines.push(qRow.map(csvCell).join(','))

  // Month header row
  const mRow = ['KPI', ...months.map((m) => m.label)]
  lines.push(mRow.map(csvCell).join(','))

  // Data rows
  for (const row of kpiRows) {
    const cells = [
      row.kpiType,
      ...months.map((m) => {
        const v = row.cells.get(m.sort) ?? 0
        return v === 0 ? '' : String(Math.round(v))
      }),
    ]
    lines.push(cells.map(csvCell).join(','))
  }

  return lines.join('\n')
}

function csvCell(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

export function ExportMenu({ pivot, startMonth, endMonth }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function downloadCsv() {
    const csv = buildCsv(pivot)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finance-movements-${startMonth.slice(0, 7)}-${endMonth.slice(0, 7)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  function downloadPdf() {
    setOpen(false)
    // Small delay to let the dropdown close before print dialog opens
    setTimeout(() => window.print(), 100)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5',
          'text-sm font-medium text-foreground bg-background',
          'hover:bg-muted transition-colors shadow-sm'
        )}
      >
        <Download size={14} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 w-40 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
          <button
            onClick={downloadCsv}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <Sheet size={14} className="text-emerald-600" />
            Download CSV
          </button>
          <button
            onClick={downloadPdf}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
          >
            <FileText size={14} className="text-red-500" />
            Print / PDF
          </button>
        </div>
      )}
    </div>
  )
}
