import type { MonthlyBudget } from "@/types/finance"
import { getDb } from "@/lib/db/client"

export async function getBudgetRecord(id: string) {
  return getDb().budgets.get(id)
}

export async function findBudgetRecordByMonthCategory(
  monthId: string,
  categoryId: string
) {
  return getDb().budgets
    .where("[monthId+categoryId]")
    .equals([monthId, categoryId])
    .first()
}

export async function putBudgetRecord(budget: MonthlyBudget) {
  await getDb().budgets.put(budget)
}

export async function deleteBudgetRecord(id: string) {
  await getDb().budgets.delete(id)
}
