import { RiAddLine, RiPieChartLine } from "@remixicon/react"

import type { Category } from "@/types/finance"
import type { getBudgetSpend } from "@/lib/finance/budget-spending"
import { BudgetDialog } from "@/features/budget/components/spending-limits/budget-dialog"
import { BudgetRow } from "@/features/budget/components/spending-limits/budget-row"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export function SpendingLimitsPanel({
  budgets,
  categories,
  monthId,
}: {
  budgets: ReturnType<typeof getBudgetSpend>
  categories: Category[]
  monthId: string
}) {
  const usedCategoryIds = new Set(budgets.map((budget) => budget.categoryId))
  const availableCategories = categories.filter(
    (category) => !usedCategoryIds.has(category.id)
  )

  const addBudget = (label: string) => {
    const trigger = (
      <Button
        className="rounded-full"
        disabled={availableCategories.length === 0}
        title={
          availableCategories.length === 0
            ? "Every expense category already has a budget this month."
            : undefined
        }
      >
        <RiAddLine data-icon="inline-start" aria-hidden="true" />
        {label}
      </Button>
    )

    if (availableCategories.length === 0) {
      return trigger
    }

    return (
      <BudgetDialog
        categories={availableCategories}
        monthId={monthId}
        trigger={trigger}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">{addBudget("Budget")}</div>
      {budgets.length === 0 ? (
        <EmptyState
          icon={<RiPieChartLine aria-hidden="true" />}
          title="No budgets set"
          description="Add monthly category limits to guide your spending."
          action={addBudget("Add budget")}
        />
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {budgets.map((budget) => {
            const category = categories.find(
              (item) => item.id === budget.categoryId
            )
            const editableCategories = categories.filter(
              (item) =>
                item.id === budget.categoryId ||
                !usedCategoryIds.has(item.id)
            )

            return (
              <BudgetRow
                budget={budget}
                categoryName={category?.name ?? "Unknown category"}
                categories={editableCategories}
                key={budget.id}
                monthId={monthId}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
