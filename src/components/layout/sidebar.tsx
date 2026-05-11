'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PanelLeftClose } from 'lucide-react'
import { cn } from '@/lib/shared/utils'
import { ThemeToggle } from './theme-toggle'

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const financeActive = pathname === '/finance'

  if (collapsed) return null

  return (
    <nav className="flex h-screen w-[260px] flex-col bg-slate-900 dark:bg-slate-950 text-slate-400 flex-shrink-0">
      <div className="border-b border-slate-800 px-4 py-5 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-slate-100">Finance</h1>
          <p className="text-xs text-slate-500 mt-0.5">KPI Dashboards</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded p-1 transition-colors"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="py-3">
        <Link
          href="/finance"
          aria-current={financeActive ? 'page' : undefined}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium border-l-[3px] border-transparent transition-colors',
            financeActive && 'bg-slate-800 text-slate-100 border-l-blue-500',
            !financeActive && 'hover:bg-slate-800 hover:text-slate-100'
          )}
        >
          <span className="text-sm">Finance Movements</span>
        </Link>
      </div>

      <div className="flex-1" />

      <div className="border-t border-slate-800 px-4 py-3 flex items-center gap-2">
        <ThemeToggle />
      </div>
    </nav>
  )
}
