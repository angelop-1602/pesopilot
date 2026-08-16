import type {
  Account,
  Bill,
  MonthlyBudget,
} from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions"
import { getTransactionMonthBudgets } from "@/features/transactions/utils/transaction-form-values"
import { centavosToInput } from "@/lib/finance/currency"
import { getTodayInputDate } from "@/lib/finance/dates"

export function getBillPaymentFormValues(
  bill: Bill,
  occurrenceDate: string,
  accounts: readonly Account[],
  budgets: readonly MonthlyBudget[]
): TransactionFormValues {
  const date = getTodayInputDate()
  const matchingBudgets = bill.categoryId
    ? getTransactionMonthBudgets(budgets, date).filter(
        (budget) => budget.categoryId === bill.categoryId
      )
    : []

  return {
    type: "expense",
    amount: centavosToInput(bill.amountCentavos),
    accountId: bill.accountId ?? accounts[0]?.id ?? "",
    categoryId: bill.categoryId,
    budgetId:
      matchingBudgets.length === 1 ? matchingBudgets[0].id : undefined,
    billId: bill.id,
    billOccurrenceDate: occurrenceDate,
    date,
    description: bill.name,
    notes: "",
  }
}
