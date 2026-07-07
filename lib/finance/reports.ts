import type { Transaction } from "@/types/finance"
import { shiftMonth } from "@/lib/finance/dates"
import { getMonthlySummary, withNet } from "@/lib/finance/calculations"

export function getCashflowSeries(
  transactions: Transaction[],
  monthId: string,
  months = 6
) {
  return Array.from({ length: months }, (_, index) => {
    const targetMonth = shiftMonth(monthId, index - months + 1)
    const summary = withNet(getMonthlySummary(transactions, targetMonth))

    return {
      monthId: targetMonth,
      income: summary.incomeCentavos / 100,
      expenses: summary.expenseCentavos / 100,
      net: summary.netCentavos / 100,
    }
  })
}
