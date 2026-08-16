import { RiAddLine, RiBillLine } from "@remixicon/react"

import type {
  Account,
  Bill,
  BillOccurrence,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import { BillDialog } from "@/features/bills/components/bill-dialog"
import { BillRow } from "@/features/bills/components/bill-row"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

interface BillsPanelProps {
  accounts: Account[]
  bills: Bill[]
  budgets: MonthlyBudget[]
  categories: Category[]
  occurrences: BillOccurrence[]
  transactions: Transaction[]
}

export function BillsPanel({
  accounts,
  bills,
  budgets,
  categories,
  occurrences,
  transactions,
}: BillsPanelProps) {
  const addBill = (variant: "default" | "outline" = "default") => (
    <BillDialog
      accounts={accounts}
      categories={categories}
      trigger={
        <Button className="rounded-full" variant={variant}>
          <RiAddLine data-icon="inline-start" aria-hidden="true" />
          {variant === "outline" ? "Bill" : "Add bill"}
        </Button>
      }
    />
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">{addBill("outline")}</div>
      {bills.length === 0 ? (
        <EmptyState
          icon={<RiBillLine aria-hidden="true" />}
          title="No recurring bills"
          description="Track rent, subscriptions, utilities, and other repeated expenses."
          action={addBill()}
        />
      ) : occurrences.length === 0 ? (
        <EmptyState
          icon={<RiBillLine aria-hidden="true" />}
          title="No bills due this month"
          description="Active weekly, monthly, and yearly schedules will appear when an occurrence is due."
        />
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {occurrences.map((occurrence) => (
            <BillRow
              accounts={accounts}
              budgets={budgets}
              categories={categories}
              key={occurrence.occurrenceKey}
              occurrence={occurrence}
              transactions={transactions}
            />
          ))}
        </div>
      )}
    </div>
  )
}
