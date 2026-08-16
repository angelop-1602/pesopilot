"use client"

import { useMemo } from "react"

import { getBudgetSpend } from "@/lib/finance/budget-spending"
import { getCreditCardStatementSummaries } from "@/lib/finance/credit-card-statements"
import { getCurrentMonthId } from "@/lib/finance/dates"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function useBudgetWorkspaceData() {
  const result = useFinanceData()
  const monthId = getCurrentMonthId()
  const expenseCategories = useMemo(
    () =>
      result.data.categories.filter((category) => category.kind === "expense"),
    [result.data.categories]
  )
  const budgetSpend = useMemo(
    () => getBudgetSpend(result.data.budgets, result.data.transactions, monthId),
    [monthId, result.data.budgets, result.data.transactions]
  )
  const creditCardSummaries = useMemo(
    () =>
      getCreditCardStatementSummaries(
        result.data.accounts,
        result.data.transactions
      ),
    [result.data.accounts, result.data.transactions]
  )

  return {
    ...result,
    budgetSpend,
    creditCardSummaries,
    budgetedCentavos: budgetSpend.reduce(
      (total, budget) => total + budget.limitCentavos,
      0
    ),
    expenseCategories,
    monthId,
    spentCentavos: budgetSpend.reduce(
      (total, budget) => total + budget.spentCentavos,
      0
    ),
  }
}
