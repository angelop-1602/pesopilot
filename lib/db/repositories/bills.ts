import type { Bill, BillFormValues, TransactionFormValues } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getBillDueDate } from "@/lib/finance/dates"
import { pesosToCentavos, centavosToInput } from "@/lib/finance/currency"
import { createId, getDb, nowIso } from "@/lib/db/client"
import { saveTransaction } from "@/lib/db/repositories/transactions"

export async function saveBill(values: BillFormValues) {
  const db = getDb()
  const now = nowIso()
  const existing = values.id ? await db.bills.get(values.id) : undefined

  const bill: Bill = {
    id: existing?.id ?? createId(),
    name: values.name.trim(),
    amountCentavos: pesosToCentavos(values.amount),
    accountId: values.accountId || undefined,
    categoryId: values.categoryId || undefined,
    dueDay: values.dueDay,
    frequency: values.frequency,
    autopay: values.autopay,
    active: values.active,
    notes: values.notes?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  if (!bill.name) {
    throw new Error("Bill name is required.")
  }

  if (bill.amountCentavos <= 0) {
    throw new Error("Bill amount must be greater than zero.")
  }

  await db.bills.put(bill)
  notifyDataChanged()
  return bill
}

export async function deleteBill(id: string) {
  const db = getDb()
  await db.bills.delete(id)
  notifyDataChanged()
}

export async function markBillPaid(bill: Bill, monthId: string) {
  if (!bill.accountId) {
    throw new Error("Choose an account before marking this bill paid.")
  }

  const transaction: TransactionFormValues = {
    type: "expense",
    amount: centavosToInput(bill.amountCentavos),
    accountId: bill.accountId,
    categoryId: bill.categoryId,
    billId: bill.id,
    date: getBillDueDate(monthId, bill.dueDay),
    description: bill.name,
  }

  return saveTransaction(transaction)
}
