"use client"

import { AccountsStrip } from "@/features/dashboard/components/accounts-strip"
import { BalanceHero } from "@/features/dashboard/components/balance-hero"
import { BudgetGoalPreview } from "@/features/dashboard/components/budget-goal-preview"
import { DashboardError } from "@/features/dashboard/components/dashboard-error"
import { DashboardLoading } from "@/features/dashboard/components/dashboard-loading"
import { MobileAppHeader } from "@/features/dashboard/components/mobile-app-header"
import { QuickSummary } from "@/features/dashboard/components/quick-summary"
import { RecentTransactionsList } from "@/features/dashboard/components/recent-transactions-list"
import { useDashboardData } from "@/features/dashboard/hooks/use-dashboard-data"

export function DashboardWorkspace() {
  const { data, error, isLoading, viewModel } = useDashboardData()

  if (isLoading) {
    return <DashboardLoading settings={data.settings} />
  }

  if (error) {
    return <DashboardError settings={data.settings} />
  }

  return (
    <div className="flex flex-col gap-5">
      <MobileAppHeader settings={data.settings} />
      <BalanceHero
        availableCentavos={viewModel.availableAssetsCentavos}
        committedCentavos={viewModel.pendingCommitmentsCentavos}
        monthLabel={viewModel.monthLabel}
        netWorthCentavos={viewModel.netWorthCentavos}
        safeToSpendCentavos={viewModel.safeToSpendCentavos}
      />
      <AccountsStrip accounts={viewModel.accounts} />
      <QuickSummary
        expenseCentavos={viewModel.expenseCentavos}
        incomeCentavos={viewModel.incomeCentavos}
        netCentavos={viewModel.netCentavos}
      />
      <RecentTransactionsList
        accounts={viewModel.accounts}
        categories={viewModel.categories}
        transactions={viewModel.recentTransactions}
      />
      <BudgetGoalPreview
        budgetedCentavos={viewModel.budgetedCentavos}
        goals={viewModel.goals}
        spentCentavos={viewModel.spentCentavos}
      />
    </div>
  )
}
