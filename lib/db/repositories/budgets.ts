import type { MonthlyBudget } from "@/types/finance"
import { getDb } from "@/lib/db/client"

export async function getBudgetRecord(id: string) {
  return getDb().budgets.get(id)
}

export async function findBudgetRecordByMonthCategory(
  monthId: string,
  categoryId: string
) {
  const budgets = await listBudgetRecordsForMonthCategory(monthId, categoryId)

  return budgets[0]
}

export async function listBudgetRecordsForMonthCategory(
  monthId: string,
  categoryId: string
) {
  const budgets = await getDb().budgets
    .where("[monthId+categoryId]")
    .equals([monthId, categoryId])
    .toArray()

  return budgets.sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id)
  )
}

export async function putBudgetRecord(budget: MonthlyBudget) {
  await getDb().budgets.put(budget)
}

export async function deleteBudgetRecord(id: string) {
  await getDb().budgets.delete(id)
}
