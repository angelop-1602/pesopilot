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
    monthId,
    categoryId: categories[0]?.id ?? "",
    limit: "",
  }

  return (
    <BottomSheetForm
      description="Pick a category limit for the selected month."
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
