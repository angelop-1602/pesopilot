import type { Category, Transaction } from "@/types/finance"
import { isDateInMonth } from "@/lib/finance/dates"

export function transactionCountsInMonth(
  transaction: Transaction,
  monthId: string
) {
  return isDateInMonth(transaction.date, monthId)
}

export function getMonthlySummary(
  transactions: readonly Transaction[],
  monthId: string
) {
  return transactions.reduce(
    (summary, transaction) => {
      if (!transactionCountsInMonth(transaction, monthId)) {
        return summary
      }

      if (transaction.type === "income") {
        summary.incomeCentavos += transaction.amountCentavos
      }

      if (transaction.type === "expense") {
        summary.expenseCentavos += transaction.amountCentavos
      }

      return summary
    },
    {
      incomeCentavos: 0,
      expenseCentavos: 0,
      netCentavos: 0,
    }
  )
}

export function withNet(summary: {
  incomeCentavos: number
  expenseCentavos: number
}) {
  return {
    ...summary,
    netCentavos: summary.incomeCentavos - summary.expenseCentavos,
  }
}

export function getCategoryTotals(
  categories: readonly Category[],
  transactions: readonly Transaction[],
  monthId: string,
  kind: "income" | "expense"
) {
  return categories
    .filter((category) => category.kind === kind)
    .map((category) => {
      const totalCentavos = transactions
        .filter(
          (transaction) =>
            transaction.type === kind &&
            transaction.categoryId === category.id &&
            transactionCountsInMonth(transaction, monthId)
        )
        .reduce((total, transaction) => total + transaction.amountCentavos, 0)

      return {
        category,
        totalCentavos,
      }
    })
    .filter((item) => item.totalCentavos > 0)
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
}
