'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { FinanceFilters } from '@/lib/shared/types'

interface FilterContextValue {
  filters: FinanceFilters
  setFilter: <K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) => void
  resetFilters: () => void
  queryString: string
}

function getDefaultFilters(): FinanceFilters {
  const now = new Date()
  // Default endMonth = first day of last complete month (never the current in-progress month)
  const endDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  // Default startMonth = 5 months before endMonth → 6 months total
  const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 5, 1)

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`

  return {
    startMonth: fmt(startDate),
    endMonth: fmt(endDate),
    fiscalQuarter: 'All',
    segment: 'All',
  }
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FinanceFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FinanceFilters>(getDefaultFilters)

  const setFilter = useCallback(<K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(getDefaultFilters()), [])

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    p.set('startMonth', filters.startMonth)
    p.set('endMonth', filters.endMonth)
    if (filters.segment !== 'All') p.set('segment', filters.segment)
    if (filters.fiscalQuarter !== 'All') p.set('fiscalQuarter', filters.fiscalQuarter)
    return p.toString()
  }, [filters])

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, queryString }}>
      {children}
    </FilterContext.Provider>
  )
}

export function useFinanceFilters() {
  const ctx = useContext(FilterContext)
  if (!ctx) throw new Error('useFinanceFilters must be used within FinanceFilterProvider')
  return ctx
}
