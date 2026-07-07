import type {
  Account,
  Bill,
  Category,
  MonthlyBudget,
  SavingsGoal,
  Transaction,
} from "@/types/finance"
import { getBalanceNature } from "@/lib/finance/accounts"
import { getBillDueDate } from "@/lib/finance/dates"

export function isDebtAccount(account: Partial<Account>) {
  return getBalanceNature(account) === "liability"
}

export function getNetWorth(accounts: Account[]) {
  return accounts.reduce((total, account) => {
    if (account.archived || !account.includeInNetWorth) {
      return total
    }

    return getBalanceNature(account) === "liability"
      ? total - account.balanceCentavos
      : total + account.balanceCentavos
  }, 0)
}

export function getAvailableBalance(accounts: Account[]) {
  return accounts.reduce((total, account) => {
    if (account.archived || isDebtAccount(account)) {
      return total
    }

    return total + account.balanceCentavos
  }, 0)
}

export function getDebtTotal(accounts: Account[]) {
  return accounts.reduce((total, account) => {
    if (account.archived || !isDebtAccount(account)) {
      return total
    }

    return total + account.balanceCentavos
  }, 0)
}

export function transactionCountsInMonth(
  transaction: Transaction,
  monthId: string
) {
  return transaction.date.startsWith(monthId)
}

export function getMonthlySummary(transactions: Transaction[], monthId: string) {
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

export function getBudgetSpend(
  budgets: MonthlyBudget[],
  transactions: Transaction[],
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

export function getCategoryTotals(
  categories: Category[],
  transactions: Transaction[],
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

export function getGoalProgress(goal: SavingsGoal) {
  if (goal.targetCentavos <= 0) {
    return 0
  }

  return Math.min(100, (goal.currentCentavos / goal.targetCentavos) * 100)
}

export function getUpcomingBills(bills: Bill[], monthId: string) {
  return bills
    .filter((bill) => bill.active)
    .map((bill) => ({
      ...bill,
      dueDate: getBillDueDate(monthId, bill.dueDay),
    }))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}
