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
  const addBudget = (label: string) => (
    <BudgetDialog
      categories={categories}
      monthId={monthId}
      trigger={
        <Button className="rounded-full">
          <RiAddLine data-icon="inline-start" aria-hidden="true" />
          {label}
        </Button>
      }
    />
  )

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

            return (
              <BudgetRow
                budget={budget}
                categoryName={category?.name ?? "Category"}
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
