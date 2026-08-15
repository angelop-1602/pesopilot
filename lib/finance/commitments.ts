import type {
  Account,
  Bill,
  BillOccurrence,
  PendingCommitments,
  SafeToSpendSummary,
  Transaction,
} from "@/types/finance"
import { getAvailableBalance } from "@/lib/finance/account-metrics"
import { getBillOccurrencesForMonth } from "@/lib/finance/bill-occurrences"
import { getTodayInputDate } from "@/lib/finance/dates"

export function summarizePendingCommitments(
  occurrences: readonly BillOccurrence[]
): PendingCommitments {
  const items = occurrences.filter((occurrence) => occurrence.status !== "paid")

  return {
    items,
    totalCentavos: items.reduce(
      (total, occurrence) => total + occurrence.expectedAmountCentavos,
      0
    ),
  }
}

export function getPendingCommitments(
  bills: readonly Bill[],
  transactions: readonly Transaction[],
  monthId: string,
  asOfDate = getTodayInputDate()
) {
  return summarizePendingCommitments(
    getBillOccurrencesForMonth(bills, transactions, monthId, asOfDate)
  )
}

export function getSafeToSpend(
  accounts: readonly Account[],
  commitments: PendingCommitments | number
): SafeToSpendSummary {
  const availableAssetsCentavos = getAvailableBalance(accounts)
  const pendingCommitmentsCentavos = Math.max(
    typeof commitments === "number" ? commitments : commitments.totalCentavos,
    0
  )

  return {
    availableAssetsCentavos,
    pendingCommitmentsCentavos,
    safeToSpendCentavos: Math.max(
      availableAssetsCentavos - pendingCommitmentsCentavos,
      0
    ),
  }
}
