"use client"

import { useState, type ReactElement } from "react"

import type { Account, SavingsGoal } from "@/types/finance"
import type { GoalFormValues } from "@/features/budget/types/goal-form"
import { GoalForm } from "@/features/budget/components/goals/goal-form"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"
import { centavosToInput } from "@/lib/finance/currency"

export function GoalDialog({
  accounts,
  goal,
  trigger,
}: {
  accounts: Account[]
  goal?: SavingsGoal
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const initialValues: GoalFormValues = {
    id: goal?.id,
    name: goal?.name ?? "",
    target: goal ? centavosToInput(goal.targetCentavos) : "",
    current: goal ? centavosToInput(goal.currentCentavos) : "",
    targetDate: goal?.targetDate,
    linkedAccountId: goal?.linkedAccountId,
    status: goal?.status ?? "active",
  }

  return (
    <BottomSheetForm
      description="Goal progress is local and manual, so it never changes account balances unless you record a transaction."
      open={open}
      title={goal ? "Edit goal" : "Add savings goal"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <GoalForm
        accounts={accounts}
        initialValues={initialValues}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}
