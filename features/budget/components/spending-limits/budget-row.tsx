"use client"

import { RiDeleteBinLine, RiEditLine } from "@remixicon/react"
import { toast } from "sonner"

import type { Category } from "@/types/finance"
import type { getBudgetSpend } from "@/lib/finance/budget-spending"
import { BudgetDialog } from "@/features/budget/components/spending-limits/budget-dialog"
import { deleteBudget } from "@/features/budget/services/budget-commands"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { centavosToInput, formatPeso } from "@/lib/finance/currency"

export function BudgetRow({
  budget,
  categoryName,
  categories,
  monthId,
}: {
  budget: ReturnType<typeof getBudgetSpend>[number]
  categoryName: string
  categories: Category[]
  monthId: string
}) {
  return (
    <div className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{categoryName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatPeso(budget.remainingCentavos)} remaining
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <BudgetDialog
            budget={{
              id: budget.id,
              monthId: budget.monthId,
              categoryId: budget.categoryId,
              limit: centavosToInput(budget.limitCentavos),
            }}
            categories={categories}
            monthId={monthId}
            trigger={
              <Button
                aria-label={`Edit ${categoryName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete budget?"
            description="This removes the monthly limit only. Transactions stay untouched."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${categoryName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await deleteBudget(budget.id)
              toast.success("Budget deleted")
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span>{formatPeso(budget.spentCentavos)} spent</span>
        <span>{formatPeso(budget.limitCentavos)} limit</span>
      </div>
      <Progress className="mt-2" value={budget.progress} />
    </div>
  )
}
