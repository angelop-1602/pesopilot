import { RiFileList3Line } from "@remixicon/react"

import type { Account, Bill, Category, Transaction } from "@/types/finance"
import type { TransactionFilter } from "@/features/transactions/types/transaction-filter"
import { TransactionRow } from "@/features/transactions/components/transaction-row"
import { EmptyState } from "@/components/shared/empty-state"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"

interface TransactionsPanelProps {
  accounts: Account[]
  bills: Bill[]
  categories: Category[]
  filter: TransactionFilter
  transactions: Transaction[]
  onFilterChange: (filter: TransactionFilter) => void
}

export function TransactionsPanel({
  accounts,
  bills,
  categories,
  filter,
  transactions,
  onFilterChange,
}: TransactionsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-white/72 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div>
          <p className="text-xs font-medium">Quick filter</p>
          <p className="text-xs text-muted-foreground">
            Transfers are excluded from income and expense totals.
          </p>
        </div>
        <NativeSelect
          aria-label="Transaction filter"
          className="w-32 shrink-0"
          value={filter}
          onChange={(event) =>
            onFilterChange(event.target.value as TransactionFilter)
          }
        >
          <NativeSelectOption value="all">All</NativeSelectOption>
          <NativeSelectOption value="expense">Expenses</NativeSelectOption>
          <NativeSelectOption value="income">Income</NativeSelectOption>
          <NativeSelectOption value="transfer">Transfers</NativeSelectOption>
        </NativeSelect>
      </div>
      {transactions.length === 0 ? (
        <EmptyState
          icon={<RiFileList3Line aria-hidden="true" />}
          title="No transactions yet"
          description="Add income, expenses, or transfers to build this month's activity."
        />
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {transactions.map((transaction) => (
            <TransactionRow
              accounts={accounts}
              bills={bills}
              categories={categories}
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </div>
      )}
    </div>
  )
}
