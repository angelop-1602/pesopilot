import type { SavingsGoal } from "@/types/finance"
import { getDb } from "@/lib/db/client"

export async function getGoalRecord(id: string) {
  return getDb().goals.get(id)
}

export async function putGoalRecord(goal: SavingsGoal) {
  await getDb().goals.put(goal)
}

export async function deleteGoalRecord(id: string) {
  await getDb().goals.delete(id)
}
