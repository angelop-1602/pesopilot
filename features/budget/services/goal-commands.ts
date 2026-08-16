import type { GoalFormValues } from "@/features/budget/types/goal-form"
import type { SavingsGoal } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { createId, nowIso } from "@/lib/db/client"
import {
  getGoalRecord,
  putGoalRecord,
} from "@/lib/db/repositories/goals"
import { deleteGoalWithAttachments } from "@/lib/db/services/goal-writes"
import { pesosToCentavos } from "@/lib/finance/currency"

export async function saveGoal(values: GoalFormValues) {
  const now = nowIso()
  const existing = values.id ? await getGoalRecord(values.id) : undefined
  const name = values.name.trim()
  const targetCentavos = pesosToCentavos(values.target)

  if (!name) {
    throw new Error("Goal name is required.")
  }

  if (targetCentavos <= 0) {
    throw new Error("Goal target must be greater than zero.")
  }

  const goal: SavingsGoal = {
    id: existing?.id ?? createId(),
    name,
    targetCentavos,
    currentCentavos: pesosToCentavos(values.current),
    targetDate: values.targetDate || undefined,
    linkedAccountId: values.linkedAccountId || undefined,
    status: values.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await putGoalRecord(goal)
  notifyDataChanged()
  return goal
}

export async function deleteGoal(id: string) {
  await deleteGoalWithAttachments(id)
  notifyDataChanged()
}
