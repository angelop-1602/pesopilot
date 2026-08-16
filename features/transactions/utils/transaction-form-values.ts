import type {
  Account,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions/types/transaction-form-values"
import { centavosToInput } from "@/lib/finance/currency"
import { getTodayInputDate } from "@/lib/finance/dates"

function sortBudgetsByAge(budgets: readonly MonthlyBudget[]) {
  return [...budgets].sort(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  )
}

export function getTransactionMonthBudgets(
  budgets: readonly MonthlyBudget[],
  date: string
) {
  const monthId = date.slice(0, 7)

  return sortBudgetsByAge(
    budgets.filter((budget) => budget.monthId === monthId)
  )
}

export function getSuggestedExpenseBudgetId(
  budgets: readonly MonthlyBudget[],
  date: string,
  categoryId?: string,
  existingBudgetId?: string
) {
  const monthBudgets = getTransactionMonthBudgets(budgets, date)
  const existing = monthBudgets.find(
    (budget) => budget.id === existingBudgetId
  )

  if (existingBudgetId) {
    return existing?.id
  }

  const matching = categoryId
    ? monthBudgets.filter((budget) => budget.categoryId === categoryId)
    : monthBudgets

  return matching.length === 1 ? matching[0].id : undefined
}

export function getInitialTransactionFormValues(
  accounts: readonly Account[],
  categories: readonly Category[],
  budgets: readonly MonthlyBudget[],
  transaction?: Transaction
): TransactionFormValues {
  const type = transaction?.type ?? "expense"
  const date = transaction?.date ?? getTodayInputDate()
  const defaultBudget =
    type === "expense"
      ? getTransactionMonthBudgets(budgets, date)[0]
      : undefined
  const defaultCategory = defaultBudget
    ? categories.find((category) => category.id === defaultBudget.categoryId)
    : type === "income"
      ? categories.find((category) => category.kind === type)
      : undefined
  const categoryId = transaction?.categoryId ?? defaultCategory?.id
  const legacyBudgetId = transaction?.budgetId
    ? undefined
    : getTransactionMonthBudgets(budgets, date).find(
        (budget) => budget.categoryId === transaction?.categoryId
      )?.id

  return {
    id: transaction?.id,
    type,
    amount: transaction ? centavosToInput(transaction.amountCentavos) : "",
    accountId: transaction?.accountId ?? accounts[0]?.id ?? "",
    transferAccountId:
      transaction?.transferAccountId ??
      accounts.find((account) => account.id !== accounts[0]?.id)?.id,
    categoryId,
    budgetId:
      type === "expense"
        ? transaction
          ? getSuggestedExpenseBudgetId(
              budgets,
              date,
              categoryId,
              transaction.budgetId
            ) ?? legacyBudgetId
          : defaultBudget?.id
        : undefined,
    billId: transaction?.billId,
    billOccurrenceDate: transaction?.billOccurrenceDate,
    date,
    description: transaction?.description ?? "",
    notes: transaction?.notes ?? "",
  }
}
