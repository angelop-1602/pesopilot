"use client"

import { useMemo } from "react"

import { createDashboardViewModel } from "@/features/dashboard/utils/create-dashboard-view-model"
import { getCurrentMonthId } from "@/lib/finance/dates"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function useDashboardData() {
  const result = useFinanceData()
  const viewModel = useMemo(
    () => createDashboardViewModel(result.data, getCurrentMonthId()),
    [result.data]
  )

  return { ...result, viewModel }
}
