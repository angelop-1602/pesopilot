import type {
  Account,
  Category,
  Transaction,
} from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions/types/transaction-form-values"
import { centavosToInput } from "@/lib/finance/currency"
import { getTodayInputDate } from "@/lib/finance/dates"

export function getInitialTransactionFormValues(
  accounts: readonly Account[],
  categories: readonly Category[],
  transaction?: Transaction
): TransactionFormValues {
  const type = transaction?.type ?? "expense"
  const defaultCategory = categories.find((category) => category.kind === type)

  return {
    id: transaction?.id,
    type,
    amount: transaction ? centavosToInput(transaction.amountCentavos) : "",
    accountId: transaction?.accountId ?? accounts[0]?.id ?? "",
    transferAccountId:
      transaction?.transferAccountId ??
      accounts.find((account) => account.id !== accounts[0]?.id)?.id,
    categoryId: transaction?.categoryId ?? defaultCategory?.id,
    billId: transaction?.billId,
    billOccurrenceDate: transaction?.billOccurrenceDate,
    date: transaction?.date ?? getTodayInputDate(),
    description: transaction?.description ?? "",
    notes: transaction?.notes ?? "",
  }
}
