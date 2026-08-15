import type { BillFrequency, Id } from "@/types/finance"

export interface BillFormValues {
  id?: Id
  name: string
  amount: string
  accountId?: Id
  categoryId?: Id
  dueDay: number
  firstDueDate?: string
  frequency: BillFrequency
  autopay: boolean
  active: boolean
  notes?: string
}
