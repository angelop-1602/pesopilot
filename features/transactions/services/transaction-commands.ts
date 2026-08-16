import type { Transaction } from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions/types/transaction-form-values"
import { createId, nowIso } from "@/lib/db/client"
import { getBudgetRecord } from "@/lib/db/repositories/budgets"
import { getTransaction } from "@/lib/db/repositories/transactions"
import {
  deleteTransactionWithBalanceSync,
  saveTransactionWithBalanceSync,
} from "@/lib/db/services/transaction-writes"
import { pesosToCentavos } from "@/lib/finance/currency"
import { isInputDate } from "@/lib/finance/dates"

export async function saveTransaction(values: TransactionFormValues) {
  const now = nowIso()
  const existing = values.id ? await getTransaction(values.id) : undefined
  const transaction: Transaction = {
    id: existing?.id ?? createId(),
    type: values.type,
    amountCentavos: pesosToCentavos(values.amount),
    accountId: values.accountId,
    transferAccountId:
      values.type === "transfer" ? values.transferAccountId : undefined,
    categoryId: values.type === "transfer" ? undefined : values.categoryId,
    budgetId: values.type === "expense" ? values.budgetId : undefined,
    billId: values.type === "expense" ? values.billId : undefined,
    billOccurrenceDate:
      values.type === "expense" && values.billId
        ? values.billOccurrenceDate
        : undefined,
    date: values.date,
    description: values.description.trim(),
    notes: values.notes?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  validateTransaction(transaction)
  await validateTransactionBudget(transaction)

  return saveTransactionWithBalanceSync(transaction)
}

export function deleteTransaction(id: string) {
  return deleteTransactionWithBalanceSync(id)
}

function validateTransaction(transaction: Transaction) {
  if (!transaction.accountId) {
    throw new Error("Choose an account.")
  }

  if (transaction.amountCentavos <= 0) {
    throw new Error("Amount must be greater than zero.")
  }

  if (!isInputDate(transaction.date)) {
    throw new Error("Choose a valid transaction date.")
  }

  if (
    transaction.billOccurrenceDate &&
    !isInputDate(transaction.billOccurrenceDate)
  ) {
    throw new Error("Choose a valid bill occurrence.")
  }

  if (
    transaction.type === "transfer" &&
    (!transaction.transferAccountId ||
      transaction.transferAccountId === transaction.accountId)
  ) {
    throw new Error("Choose a different destination account for transfers.")
  }

  if (!transaction.description) {
    throw new Error("Transaction description is required.")
  }
}

async function validateTransactionBudget(transaction: Transaction) {
  if (transaction.type !== "expense") {
    return
  }

  if (!transaction.budgetId) {
    throw new Error("Choose a budget for this expense.")
  }

  const budget = await getBudgetRecord(transaction.budgetId)

  if (!budget) {
    throw new Error("The selected budget no longer exists.")
  }

  if (budget.monthId !== transaction.date.slice(0, 7)) {
    throw new Error("Choose a budget for the transaction month.")
  }

  if (budget.categoryId !== transaction.categoryId) {
    throw new Error("The expense category must match the selected budget.")
  }
}
