'use client'

import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { Sidebar } from './sidebar'
import { TopBar } from './top-bar'

export function AppShell({
  topBarTitle,
  children,
}: {
  topBarTitle: string
  children: React.ReactNode
}) {
  const [collapsed, toggle] = useSidebarCollapsed()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={toggle} />
      <main className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={topBarTitle} collapsed={collapsed} onToggle={toggle} />
        {children}
      </main>
    </div>
  )
}
