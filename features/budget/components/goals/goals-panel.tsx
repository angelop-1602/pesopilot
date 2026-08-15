import { RiAddLine, RiFlagLine } from "@remixicon/react"

import type { Account, SavingsGoal } from "@/types/finance"
import { GoalDialog } from "@/features/budget/components/goals/goal-dialog"
import { GoalRow } from "@/features/budget/components/goals/goal-row"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export function GoalsPanel({
  accounts,
  goals,
}: {
  accounts: Account[]
  goals: SavingsGoal[]
}) {
  const addGoal = (label: string) => (
    <GoalDialog
      accounts={accounts}
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
      <div className="flex justify-end">{addGoal("Goal")}</div>
      {goals.length === 0 ? (
        <EmptyState
          icon={<RiFlagLine aria-hidden="true" />}
          title="No savings goals"
          description="Track targets like emergency funds, tuition, travel, or debt payoff buffers."
          action={addGoal("Add goal")}
        />
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {goals.map((goal) => (
            <GoalRow accounts={accounts} key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  )
}
