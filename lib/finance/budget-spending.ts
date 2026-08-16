import type { MonthlyBudget, Transaction } from "@/types/finance"
import { compareBudgetsByAge } from "@/lib/finance/budgets"
import { transactionCountsInMonth } from "@/lib/finance/transaction-summaries"

export function resolveExpenseBudgetId(
  budgets: readonly MonthlyBudget[],
  transaction: Transaction,
  monthId: string
) {
  if (
    transaction.type !== "expense" ||
    !transactionCountsInMonth(transaction, monthId)
  ) {
    return undefined
  }

  const monthBudgets = budgets.filter((budget) => budget.monthId === monthId)

  if (transaction.budgetId) {
    return monthBudgets.some((budget) => budget.id === transaction.budgetId)
      ? transaction.budgetId
      : undefined
  }

  if (!transaction.categoryId) {
    return undefined
  }

  return monthBudgets
    .filter((budget) => budget.categoryId === transaction.categoryId)
    .reduce<MonthlyBudget | undefined>((oldest, budget) => {
      if (!oldest) {
        return budget
      }

      return compareBudgetsByAge(budget, oldest) < 0 ? budget : oldest
    }, undefined)?.id
}

export function getBudgetSpend(
  budgets: readonly MonthlyBudget[],
  transactions: readonly Transaction[],
  monthId: string
) {
  const monthBudgets = budgets.filter((budget) => budget.monthId === monthId)
  const spentByBudgetId = new Map<string, number>()

  for (const transaction of transactions) {
    const budgetId = resolveExpenseBudgetId(monthBudgets, transaction, monthId)

    if (budgetId) {
      spentByBudgetId.set(
        budgetId,
        (spentByBudgetId.get(budgetId) ?? 0) + transaction.amountCentavos
      )
    }
  }

  return monthBudgets
    .map((budget) => {
      const spentCentavos = spentByBudgetId.get(budget.id) ?? 0

      return {
        ...budget,
        spentCentavos,
        remainingCentavos: budget.limitCentavos - spentCentavos,
        progress:
          budget.limitCentavos > 0
            ? Math.min(100, (spentCentavos / budget.limitCentavos) * 100)
            : 0,
      }
    })
}
