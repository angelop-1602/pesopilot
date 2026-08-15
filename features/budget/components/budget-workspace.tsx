"use client"

import { BudgetSummary } from "@/features/budget/components/budget-summary"
import { GoalsPanel } from "@/features/budget/components/goals/goals-panel"
import { BudgetingMethodPanel } from "@/features/budget/components/method/budgeting-method-panel"
import { SpendingLimitsPanel } from "@/features/budget/components/spending-limits/spending-limits-panel"
import { useBudgetWorkspaceData } from "@/features/budget/hooks/use-budget-workspace-data"
import { PageError } from "@/components/shared/page-error"
import { PageLoading } from "@/components/shared/page-loading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BudgetWorkspace() {
  const {
    budgetSpend,
    budgetedCentavos,
    data,
    error,
    expenseCategories,
    isLoading,
    monthId,
    spentCentavos,
  } = useBudgetWorkspaceData()

  if (isLoading) {
    return <PageLoading label="Loading budgets and goals" />
  }

  if (error) {
    return <PageError title="Unable to load budgets and goals" />
  }

  return (
    <div className="flex flex-col gap-5">
      <BudgetSummary
        budgetedCentavos={budgetedCentavos}
        spentCentavos={spentCentavos}
      />
      <Tabs defaultValue="budgets">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="method">Method</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets">
          <SpendingLimitsPanel
            budgets={budgetSpend}
            categories={expenseCategories}
            monthId={monthId}
          />
        </TabsContent>
        <TabsContent value="goals">
          <GoalsPanel accounts={data.accounts} goals={data.goals} />
        </TabsContent>
        <TabsContent value="method">
          <BudgetingMethodPanel budgetMethod={data.settings.budgetMethod} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
