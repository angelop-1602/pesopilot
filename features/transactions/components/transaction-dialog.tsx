"use client"

import { useState, type ReactElement } from "react"

import type {
  Account,
  Bill,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions/types/transaction-form-values"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import { getInitialTransactionFormValues } from "@/features/transactions/utils/transaction-form-values"
import { EmptyState } from "@/components/shared/empty-state"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"

interface TransactionDialogProps {
  accounts: Account[]
  categories: Category[]
  bills: Bill[]
  budgets: MonthlyBudget[]
  transactions: Transaction[]
  transaction?: Transaction
  initialValues?: TransactionFormValues
  description?: string
  title?: string
  lockedType?: boolean
  lockedBillId?: string
  lockedTransferAccountId?: string
  sourceAccountIds?: string[]
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransactionDialog({
  accounts,
  categories,
  bills,
  budgets,
  transactions,
  transaction,
  initialValues,
  description,
  title,
  lockedType,
  lockedBillId,
  lockedTransferAccountId,
  sourceAccountIds,
  trigger,
  open,
  onOpenChange,
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <BottomSheetForm
      description={
        description ??
        "Expenses use a monthly budget. Transfers move money without counting as income or spending."
      }
      open={dialogOpen}
      title={title ?? (transaction ? "Edit transaction" : "Add transaction")}
      trigger={trigger}
      onOpenChange={setDialogOpen}
    >
      {accounts.length === 0 ? (
        <EmptyState
          title="Add an account first"
          description="Transactions need at least one wallet, bank, e-wallet, credit card, or loan account."
        />
      ) : (
        <TransactionForm
          key={
            transaction?.id ??
            initialValues?.billOccurrenceDate ??
            initialValues?.transferAccountId ??
            "new-transaction"
          }
          accounts={accounts}
          bills={bills}
          budgets={budgets}
          categories={categories}
          initialValues={
            initialValues ??
            getInitialTransactionFormValues(
              accounts,
              categories,
              budgets,
              transaction
            )
          }
          lockedTransferAccountId={lockedTransferAccountId}
          lockedType={lockedType}
          lockedBillId={lockedBillId}
          sourceAccountIds={sourceAccountIds}
          transactions={transactions}
          onSaved={() => setDialogOpen(false)}
        />
      )}
    </BottomSheetForm>
  )
}
