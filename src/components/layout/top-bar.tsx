'use client'

import { PanelLeftOpen } from 'lucide-react'
import { cn } from '@/lib/shared/utils'

export function TopBar({
  title,
  collapsed,
  onToggle,
}: {
  title: string
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b bg-card px-6 py-3 flex items-center gap-3">
      {collapsed && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Expand sidebar"
          className={cn(
            'text-muted-foreground hover:text-foreground hover:bg-accent rounded p-1 transition-colors'
          )}
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  )
}
