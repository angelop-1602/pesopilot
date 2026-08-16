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
  const addBudget = (label: string) => {
    const trigger = (
      <Button
        className="rounded-full"
        disabled={categories.length === 0}
        title={
          categories.length === 0
            ? "Add an expense category before creating a budget."
            : undefined
        }
      >
        <RiAddLine data-icon="inline-start" aria-hidden="true" />
        {label}
      </Button>
    )

    if (categories.length === 0) {
      return trigger
    }

    return (
      <BudgetDialog
        categories={categories}
        monthId={monthId}
        trigger={trigger}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        {addBudget("Budget")}
      </div>
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
            return (
              <BudgetRow
                budget={budget}
                categoryName={category?.name ?? "Unknown category"}
                categories={categories}
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
