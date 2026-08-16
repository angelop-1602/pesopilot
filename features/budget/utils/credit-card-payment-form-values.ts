import type { Account } from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions"
import type { CreditCardStatementSummary } from "@/lib/finance/credit-card-statements"
import { centavosToInput } from "@/lib/finance/currency"
import { getTodayInputDate } from "@/lib/finance/dates"

export function getCreditCardPaymentFormValues(
  summary: CreditCardStatementSummary,
  sourceAccounts: readonly Account[]
): TransactionFormValues {
  return {
    type: "transfer",
    amount: centavosToInput(summary.remainingStatementBalanceCentavos),
    accountId: sourceAccounts[0]?.id ?? "",
    transferAccountId: summary.account.id,
    date: getTodayInputDate(),
    description: `${summary.account.displayName} payment`,
    notes: "",
  }
}
