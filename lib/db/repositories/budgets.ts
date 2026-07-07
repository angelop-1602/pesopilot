import type { BudgetFormValues, MonthlyBudget } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { pesosToCentavos } from "@/lib/finance/currency"
import { createId, getDb, nowIso } from "@/lib/db/client"

export async function saveBudget(values: BudgetFormValues) {
  const db = getDb()
  const now = nowIso()
  const existing = values.id ? await db.budgets.get(values.id) : undefined
  const duplicate = await db.budgets
    .where("[monthId+categoryId]")
    .equals([values.monthId, values.categoryId])
    .first()

  const budget: MonthlyBudget = {
    id: existing?.id ?? duplicate?.id ?? createId(),
    monthId: values.monthId,
    categoryId: values.categoryId,
    limitCentavos: pesosToCentavos(values.limit),
    createdAt: existing?.createdAt ?? duplicate?.createdAt ?? now,
    updatedAt: now,
  }

  if (budget.limitCentavos < 0) {
    throw new Error("Budget limit cannot be negative.")
  }

  await db.budgets.put(budget)
  notifyDataChanged()
  return budget
}

export async function deleteBudget(id: string) {
  const db = getDb()
  await db.budgets.delete(id)
  notifyDataChanged()
}
