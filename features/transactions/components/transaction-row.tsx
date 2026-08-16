"use client"

import { RiDeleteBinLine, RiEditLine } from "@remixicon/react"
import { toast } from "sonner"

import type {
  Account,
  Bill,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import { TransactionDialog } from "@/features/transactions/components/transaction-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteTransaction } from "@/features/transactions/services/transaction-commands"
import { getBudgetDisplayName } from "@/lib/finance/budgets"
import { formatPeso } from "@/lib/finance/currency"
import { formatShortDate } from "@/lib/finance/dates"
import { cn } from "@/lib/utils"

interface TransactionRowProps {
  accounts: Account[]
  bills: Bill[]
  budgets: MonthlyBudget[]
  categories: Category[]
  transaction: Transaction
  transactions: Transaction[]
}

export function TransactionRow({
  accounts,
  bills,
  budgets,
  categories,
  transaction,
  transactions,
}: TransactionRowProps) {
  const account = accounts.find((item) => item.id === transaction.accountId)
  const transferAccount = accounts.find(
    (item) => item.id === transaction.transferAccountId
  )
  const category = categories.find((item) => item.id === transaction.categoryId)
  const budget = budgets.find((item) => item.id === transaction.budgetId)
  const amountPrefix =
    transaction.type === "income"
      ? "+"
      : transaction.type === "expense"
        ? "-"
        : ""
  const detail =
    transaction.type === "transfer"
      ? `${account?.displayName ?? "Account"} to ${transferAccount?.displayName ?? "Account"}`
      : `${account?.displayName ?? "Account"}${category ? ` - ${category.name}` : ""}${budget ? ` / ${getBudgetDisplayName(budget, category?.name)}` : ""}`

  return (
    <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {transaction.description}
          </p>
          <Badge className="shrink-0 capitalize" variant="secondary">
            {transaction.type}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatShortDate(transaction.date)} - {detail}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <TransactionDialog
            accounts={accounts}
            bills={bills}
            budgets={budgets}
            categories={categories}
            transaction={transaction}
            transactions={transactions}
            trigger={
              <Button
                aria-label={`Edit ${transaction.description}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete transaction?"
            description="The account balance will be recalculated after this transaction is removed."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${transaction.description}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await deleteTransaction(transaction.id)
              toast.success("Transaction deleted")
            }}
          />
        </div>
      </div>
      <div
        className={cn(
          "min-w-[6.5rem] text-right font-mono text-sm font-semibold",
          transaction.type === "expense" && "text-destructive",
          transaction.type === "income" && "text-primary"
        )}
      >
        {amountPrefix}
        {formatPeso(transaction.amountCentavos)}
      </div>
    </div>
  )
}
