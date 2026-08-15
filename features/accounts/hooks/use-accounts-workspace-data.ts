"use client"

import { useMemo } from "react"

import {
  getAvailableBalance,
  getDebtTotal,
  getNetWorth,
} from "@/lib/finance/account-metrics"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function useAccountsWorkspaceData() {
  const financeData = useFinanceData()
  const summary = useMemo(
    () => ({
      availableCentavos: getAvailableBalance(financeData.data.accounts),
      debtCentavos: getDebtTotal(financeData.data.accounts),
      netWorthCentavos: getNetWorth(financeData.data.accounts),
    }),
    [financeData.data.accounts]
  )

  return { ...financeData, summary }
}
