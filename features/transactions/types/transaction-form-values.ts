import type { Id, TransactionType } from "@/types/finance"

export interface TransactionFormValues {
  id?: Id
  type: TransactionType
  amount: string
  accountId: Id
  transferAccountId?: Id
  categoryId?: Id
  budgetId?: Id
  billId?: Id
  billOccurrenceDate?: string
  date: string
  description: string
  notes?: string
}
