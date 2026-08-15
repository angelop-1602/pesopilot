import type { FinanceSnapshot } from "@/lib/db/queries/finance-snapshot"
import type { DashboardViewModel } from "@/features/dashboard/types/dashboard-view-model"
import { getNetWorth } from "@/lib/finance/account-metrics"
import { getBudgetSpend } from "@/lib/finance/budget-spending"
import { getPendingCommitments, getSafeToSpend } from "@/lib/finance/commitments"
import { formatMonthLabel } from "@/lib/finance/dates"
import {
  getMonthlySummary,
  withNet,
} from "@/lib/finance/transaction-summaries"

export function createDashboardViewModel(
  data: FinanceSnapshot,
  monthId: string
): DashboardViewModel {
  const monthlySummary = withNet(getMonthlySummary(data.transactions, monthId))
  const pendingCommitments = getPendingCommitments(
    data.bills,
    data.transactions,
    monthId
  )
  const safeToSpend = getSafeToSpend(data.accounts, pendingCommitments)
  const budgetSpend = getBudgetSpend(data.budgets, data.transactions, monthId)

  return {
    accounts: data.accounts,
    categories: data.categories,
    recentTransactions: data.transactions.slice(0, 5),
    goals: data.goals,
    monthLabel: formatMonthLabel(monthId),
    netWorthCentavos: getNetWorth(data.accounts),
    availableAssetsCentavos: safeToSpend.availableAssetsCentavos,
    pendingCommitmentsCentavos: safeToSpend.pendingCommitmentsCentavos,
    safeToSpendCentavos: safeToSpend.safeToSpendCentavos,
    incomeCentavos: monthlySummary.incomeCentavos,
    expenseCentavos: monthlySummary.expenseCentavos,
    netCentavos: monthlySummary.netCentavos,
    budgetedCentavos: budgetSpend.reduce(
      (total, budget) => total + budget.limitCentavos,
      0
    ),
    spentCentavos: budgetSpend.reduce(
      (total, budget) => total + budget.spentCentavos,
      0
    ),
  }
}
