"use client"

import { useMemo, useState } from "react"

import type { TransactionFilter } from "@/features/transactions"
import { getBillOccurrencesForMonth } from "@/lib/finance/bill-occurrences"
import { getCurrentMonthId } from "@/lib/finance/dates"
import { getMonthlySummary, withNet } from "@/lib/finance/transaction-summaries"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function useFinancialActivity() {
  const result = useFinanceData()
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const monthId = getCurrentMonthId()
  const summary = useMemo(
    () => withNet(getMonthlySummary(result.data.transactions, monthId)),
    [monthId, result.data.transactions]
  )
  const visibleTransactions = useMemo(
    () =>
      result.data.transactions.filter(
        (transaction) => filter === "all" || transaction.type === filter
      ),
    [filter, result.data.transactions]
  )
  const billOccurrences = useMemo(
    () =>
      getBillOccurrencesForMonth(
        result.data.bills,
        result.data.transactions,
        monthId
      ),
    [monthId, result.data.bills, result.data.transactions]
  )

  return {
    ...result,
    billOccurrences,
    filter,
    setFilter,
    summary,
    visibleTransactions,
  }
}
