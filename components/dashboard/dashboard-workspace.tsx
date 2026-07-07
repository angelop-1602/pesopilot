"use client"

import { AccountsStrip } from "@/components/dashboard/accounts-strip"
import { BalanceHero } from "@/components/dashboard/balance-hero"
import { BudgetGoalPreview } from "@/components/dashboard/budget-goal-preview"
import { MobileAppHeader } from "@/components/dashboard/mobile-app-header"
import { QuickSummary } from "@/components/dashboard/quick-summary"
import { RecentTransactionsList } from "@/components/dashboard/recent-transactions-list"
import {
  getAvailableBalance,
  getBudgetSpend,
  getDebtTotal,
  getMonthlySummary,
  getNetWorth,
  withNet,
} from "@/lib/finance/calculations"
import { formatMonthLabel, getCurrentMonthId } from "@/lib/finance/dates"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function DashboardWorkspace() {
  const { data } = useFinanceData()
  const monthId = getCurrentMonthId()
  const monthlySummary = withNet(getMonthlySummary(data.transactions, monthId))
  const netWorth = getNetWorth(data.accounts)
  const available = getAvailableBalance(data.accounts)
  const debt = getDebtTotal(data.accounts)
  const recentTransactions = data.transactions.slice(0, 5)
  const budgetSpend = getBudgetSpend(data.budgets, data.transactions, monthId)
  const budgeted = budgetSpend.reduce(
    (total, budget) => total + budget.limitCentavos,
    0
  )
  const spent = budgetSpend.reduce(
    (total, budget) => total + budget.spentCentavos,
    0
  )

  return (
    <div className="flex flex-col gap-5">
      <MobileAppHeader settings={data.settings} />
      <BalanceHero
        availableCentavos={available}
        debtCentavos={debt}
        monthLabel={formatMonthLabel(monthId)}
        netWorthCentavos={netWorth}
      />
      <AccountsStrip accounts={data.accounts} />
      <QuickSummary
        expenseCentavos={monthlySummary.expenseCentavos}
        incomeCentavos={monthlySummary.incomeCentavos}
        netCentavos={monthlySummary.netCentavos}
      />
      <RecentTransactionsList
        accounts={data.accounts}
        categories={data.categories}
        transactions={recentTransactions}
      />
      <BudgetGoalPreview
        budgetedCentavos={budgeted}
        goals={data.goals}
        spentCentavos={spent}
      />
    </div>
  )
}
