import type { GoalFormValues, SavingsGoal } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { pesosToCentavos } from "@/lib/finance/currency"
import { createId, getDb, nowIso } from "@/lib/db/client"

export async function saveGoal(values: GoalFormValues) {
  const db = getDb()
  const now = nowIso()
  const existing = values.id ? await db.goals.get(values.id) : undefined

  const goal: SavingsGoal = {
    id: existing?.id ?? createId(),
    name: values.name.trim(),
    targetCentavos: pesosToCentavos(values.target),
    currentCentavos: pesosToCentavos(values.current),
    targetDate: values.targetDate || undefined,
    linkedAccountId: values.linkedAccountId || undefined,
    status: values.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  if (!goal.name) {
    throw new Error("Goal name is required.")
  }

  if (goal.targetCentavos <= 0) {
    throw new Error("Goal target must be greater than zero.")
  }

  await db.goals.put(goal)
  notifyDataChanged()
  return goal
}

export async function deleteGoal(id: string) {
  const db = getDb()
  await db.goals.delete(id)
  notifyDataChanged()
}
