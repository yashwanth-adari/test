'use client'

import { AppShell } from '@/components/layout/app-shell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AcvMovementTab } from '@/dashboards/finance/components/acv-movement/acv-movement-tab'
import { ArrTab } from '@/dashboards/finance/components/arr/arr-tab'
import { FinanceFilterProvider } from '@/dashboards/finance/hooks/use-filters'

export default function FinancePage() {
  return (
    <AppShell topBarTitle="Finance Movements">
      <FinanceFilterProvider>
        <Tabs defaultValue="acv" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-6 mt-2">
            <TabsTrigger value="acv">ACV Movement</TabsTrigger>
            <TabsTrigger value="arr">ARR</TabsTrigger>
          </TabsList>

          <TabsContent value="acv" className="flex-1 overflow-y-auto p-6 mt-0">
            <AcvMovementTab />
          </TabsContent>

          <TabsContent value="arr" className="flex-1 overflow-y-auto p-6 mt-0">
            <ArrTab />
          </TabsContent>
        </Tabs>
      </FinanceFilterProvider>
    </AppShell>
  )
}
