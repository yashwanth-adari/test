'use client'

import { useCallback, useLayoutEffect, useState } from 'react'
import { STORAGE_KEY_SIDEBAR_COLLAPSED } from '@/lib/shared/constants'

export function useSidebarCollapsed(): readonly [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED)
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((c) => {
      const next = !c
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(next))
      }
      return next
    })
  }, [])

  return [collapsed, toggle] as const
}
