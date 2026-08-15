"use client"

import { RiDeleteBinLine, RiEditLine } from "@remixicon/react"
import { toast } from "sonner"

import type { Account, SavingsGoal } from "@/types/finance"
import { GoalDialog } from "@/features/budget/components/goals/goal-dialog"
import { deleteGoal } from "@/features/budget/services/goal-commands"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatPeso } from "@/lib/finance/currency"
import { getGoalProgress } from "@/lib/finance/goal-progress"

export function GoalRow({
  accounts,
  goal,
}: {
  accounts: Account[]
  goal: SavingsGoal
}) {
  const progress = getGoalProgress(goal)

  return (
    <div className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{goal.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatPeso(goal.currentCentavos)} of{" "}
            {formatPeso(goal.targetCentavos)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GoalDialog
            accounts={accounts}
            goal={goal}
            trigger={
              <Button
                aria-label={`Edit ${goal.name}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete savings goal?"
            description="Only the goal tracker is removed. Account balances stay untouched."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${goal.name}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await deleteGoal(goal.id)
              toast.success("Goal deleted")
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <Badge className="capitalize" variant="secondary">
          {goal.status}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress className="mt-2" value={progress} />
    </div>
  )
}
