"use client"

import { useState, type ReactElement } from "react"

import type { Category } from "@/types/finance"
import type { BudgetFormValues } from "@/features/budget/types/budget-form"
import { BudgetForm } from "@/features/budget/components/spending-limits/budget-form"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"

export function BudgetDialog({
  budget,
  categories,
  monthId,
  trigger,
}: {
  budget?: BudgetFormValues
  categories: Category[]
  monthId: string
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const initialValues: BudgetFormValues = budget ?? {
    name: "",
    monthId,
    categoryId: categories[0]?.id ?? "",
    limit: "",
  }

  return (
    <BottomSheetForm
      description="Name this budget, then choose its category and monthly limit."
      open={open}
      title={budget ? "Edit budget" : "Add budget"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <BudgetForm
        categories={categories}
        initialValues={initialValues}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}
