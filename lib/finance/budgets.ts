import type { MonthlyBudget } from "@/types/finance"

export const BUDGET_NAME_MAX_LENGTH = 80

export function normalizeBudgetName(value: string) {
  const name = value.trim()

  if (!name) {
    throw new Error("Budget name is required.")
  }

  if (name.length > BUDGET_NAME_MAX_LENGTH) {
    throw new Error(
      `Budget name must be ${BUDGET_NAME_MAX_LENGTH} characters or fewer.`
    )
  }

  return name
}

export function getBudgetDisplayName(
  budget: Pick<MonthlyBudget, "name">,
  categoryName?: string
) {
  return budget.name?.trim() || categoryName?.trim() || "Untitled budget"
}

export function assertBudgetCategoryAvailable(
  currentBudgetId?: string,
  matchingBudgetId?: string
) {
  if (matchingBudgetId && matchingBudgetId !== currentBudgetId) {
    throw new Error(
      "This category already has a budget for the selected month."
    )
  }
}
