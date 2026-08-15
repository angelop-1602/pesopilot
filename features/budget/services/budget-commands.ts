import type { BudgetFormValues } from "@/features/budget/types/budget-form"
import type { MonthlyBudget } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { createId, nowIso } from "@/lib/db/client"
import {
  deleteBudgetRecord,
  findBudgetRecordByMonthCategory,
  getBudgetRecord,
  putBudgetRecord,
} from "@/lib/db/repositories/budgets"
import { pesosToCentavos } from "@/lib/finance/currency"

export async function saveBudget(values: BudgetFormValues) {
  const now = nowIso()
  const existing = values.id ? await getBudgetRecord(values.id) : undefined
  const duplicate = await findBudgetRecordByMonthCategory(
    values.monthId,
    values.categoryId
  )
  const limitCentavos = pesosToCentavos(values.limit)

  if (limitCentavos < 0) {
    throw new Error("Budget limit cannot be negative.")
  }

  const budget: MonthlyBudget = {
    id: existing?.id ?? duplicate?.id ?? createId(),
    monthId: values.monthId,
    categoryId: values.categoryId,
    limitCentavos,
    createdAt: existing?.createdAt ?? duplicate?.createdAt ?? now,
    updatedAt: now,
  }

  await putBudgetRecord(budget)
  notifyDataChanged()
  return budget
}

export async function deleteBudget(id: string) {
  await deleteBudgetRecord(id)
  notifyDataChanged()
}
