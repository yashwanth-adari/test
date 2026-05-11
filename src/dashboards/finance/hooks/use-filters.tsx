'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type { FinanceFilters } from '@/lib/shared/types'
import type { Granularity } from '@/lib/shared/constants'

interface FilterContextValue {
  filters: FinanceFilters
  setFilter: <K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) => void
  resetFilters: () => void
  queryString: string
}

const DEFAULTS: FinanceFilters = {
  segment: 'All',
  granularity: 'month',
  fiscalYear: 'All',
}

const FilterContext = createContext<FilterContextValue | null>(null)

export function FinanceFilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<FinanceFilters>(DEFAULTS)

  const setFilter = useCallback(<K extends keyof FinanceFilters>(key: K, value: FinanceFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => setFilters(DEFAULTS), [])

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (filters.segment !== 'All') p.set('segment', filters.segment)
    p.set('granularity', filters.granularity)
    if (filters.fiscalYear !== 'All') p.set('fiscalYear', filters.fiscalYear)
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

export type { Granularity }
