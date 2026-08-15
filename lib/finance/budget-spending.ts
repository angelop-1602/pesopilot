import type { MonthlyBudget, Transaction } from "@/types/finance"
import { transactionCountsInMonth } from "@/lib/finance/transaction-summaries"

export function getBudgetSpend(
  budgets: readonly MonthlyBudget[],
  transactions: readonly Transaction[],
  monthId: string
) {
  return budgets
    .filter((budget) => budget.monthId === monthId)
    .map((budget) => {
      const spentCentavos = transactions
        .filter(
          (transaction) =>
            transaction.type === "expense" &&
            transaction.categoryId === budget.categoryId &&
            transactionCountsInMonth(transaction, monthId)
        )
        .reduce((total, transaction) => total + transaction.amountCentavos, 0)

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
