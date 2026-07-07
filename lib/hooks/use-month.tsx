"use client"

import { getCurrentMonthId, shiftMonth } from "@/lib/finance/dates"

export function MonthProvider({ children }: { children: React.ReactNode }) {
  return children
}

export function useMonth() {
  const monthId = getCurrentMonthId()

  return {
    monthId,
    setMonthId: () => {},
    previousMonth: () => shiftMonth(monthId, -1),
    nextMonth: () => shiftMonth(monthId, 1),
    resetMonth: () => {},
  }
}
