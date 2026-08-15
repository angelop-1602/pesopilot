"use client"

import { useState, type ReactElement } from "react"

import type { Account, Bill, Category, Transaction } from "@/types/finance"
import { TransactionForm } from "@/features/transactions/components/transaction-form"
import { getInitialTransactionFormValues } from "@/features/transactions/utils/transaction-form-values"
import { EmptyState } from "@/components/shared/empty-state"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"

interface TransactionDialogProps {
  accounts: Account[]
  categories: Category[]
  bills: Bill[]
  transaction?: Transaction
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TransactionDialog({
  accounts,
  categories,
  bills,
  transaction,
  trigger,
  open,
  onOpenChange,
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <BottomSheetForm
      description="Transfers move money between accounts and stay out of income and expense totals."
      open={dialogOpen}
      title={transaction ? "Edit transaction" : "Add transaction"}
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
          key={transaction?.id ?? "new-transaction"}
          accounts={accounts}
          bills={bills}
          categories={categories}
          initialValues={getInitialTransactionFormValues(
            accounts,
            categories,
            transaction
          )}
          onSaved={() => setDialogOpen(false)}
        />
      )}
    </BottomSheetForm>
  )
}
