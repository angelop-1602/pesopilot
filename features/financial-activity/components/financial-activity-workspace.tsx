"use client"

import { RiAddLine } from "@remixicon/react"

import { BillsPanel } from "@/features/bills"
import {
  TransactionDialog,
  TransactionSummary,
  TransactionsPanel,
} from "@/features/transactions"
import { useFinancialActivity } from "@/features/financial-activity/hooks/use-financial-activity"
import { PageHeader } from "@/components/shared/page-header"
import { PageError } from "@/components/shared/page-error"
import { PageLoading } from "@/components/shared/page-loading"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function FinancialActivityWorkspace() {
  const {
    billOccurrences,
    data,
    error,
    filter,
    isLoading,
    setFilter,
    summary,
    visibleTransactions,
  } = useFinancialActivity()

  if (isLoading) {
    return <PageLoading label="Loading transactions and bills" />
  }

  if (error) {
    return <PageError title="Unable to load transactions and bills" />
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Transactions"
        description="Fast capture, quick filters, and recurring bill actions."
        action={
          <TransactionDialog
            accounts={data.accounts}
            bills={data.bills}
            categories={data.categories}
            trigger={
              <Button className="rounded-full">
                <RiAddLine data-icon="inline-start" aria-hidden="true" />
                Add
              </Button>
            }
          />
        }
      />
      <TransactionSummary
        expenseCentavos={summary.expenseCentavos}
        incomeCentavos={summary.incomeCentavos}
        netCentavos={summary.netCentavos}
      />
      <Tabs defaultValue="activity">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <TransactionsPanel
            accounts={data.accounts}
            bills={data.bills}
            categories={data.categories}
            filter={filter}
            transactions={visibleTransactions}
            onFilterChange={setFilter}
          />
        </TabsContent>
        <TabsContent value="bills">
          <BillsPanel
            accounts={data.accounts}
            bills={data.bills}
            categories={data.categories}
            occurrences={billOccurrences}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
