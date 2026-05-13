'use client'

import { AppShell } from '@/components/layout/app-shell'
import { FinancePivotTab } from '@/dashboards/finance/components/pivot/finance-pivot-tab'
import { FinanceFilterProvider } from '@/dashboards/finance/hooks/use-filters'

export default function FinancePage() {
  return (
    <AppShell topBarTitle="Finance Movements">
      <FinanceFilterProvider>
        <div className="flex-1 overflow-y-auto p-6 print:p-0">
          <FinancePivotTab />
        </div>
      </FinanceFilterProvider>
    </AppShell>
  )
}
