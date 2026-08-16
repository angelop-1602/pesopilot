import type { Bill } from "@/types/finance"
import type { BillFormValues } from "@/features/bills/types/bill-form-values"
import { createId, nowIso } from "@/lib/db/client"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  getBill,
  putBill,
} from "@/lib/db/repositories/bills"
import { deleteBillWithAttachments } from "@/lib/db/services/bill-writes"
import { pesosToCentavos } from "@/lib/finance/currency"
import { isInputDate } from "@/lib/finance/dates"

interface SaveBillOptions {
  initialFirstDueDate?: string
}

export async function saveBill(
  values: BillFormValues,
  options: SaveBillOptions = {}
) {
  const now = nowIso()
  const existing = values.id ? await getBill(values.id) : undefined
  const preservesLegacyMonthlySchedule =
    existing?.frequency === "monthly" &&
    !existing.firstDueDate &&
    values.frequency === "monthly" &&
    values.firstDueDate === options.initialFirstDueDate
  const firstDueDate = preservesLegacyMonthlySchedule
    ? undefined
    : values.firstDueDate?.trim() || undefined
  const bill: Bill = {
    id: existing?.id ?? createId(),
    name: values.name.trim(),
    amountCentavos: pesosToCentavos(values.amount),
    accountId: values.accountId || undefined,
    categoryId: values.categoryId || undefined,
    dueDay: firstDueDate ? Number(firstDueDate.slice(-2)) : values.dueDay,
    firstDueDate,
    frequency: values.frequency,
    autopay: values.autopay,
    active: values.active,
    notes: values.notes?.trim() || undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  validateBill(bill)
  await putBill(bill)
  notifyDataChanged()

  return bill
}

export async function deleteBill(id: string) {
  await deleteBillWithAttachments(id)
  notifyDataChanged()
}

function validateBill(bill: Bill) {
  if (!bill.name) {
    throw new Error("Bill name is required.")
  }

  if (bill.amountCentavos <= 0) {
    throw new Error("Bill amount must be greater than zero.")
  }

  if (!Number.isInteger(bill.dueDay) || bill.dueDay < 1 || bill.dueDay > 31) {
    throw new Error("Bill due day must be from 1 to 31.")
  }

  if (bill.firstDueDate && !isInputDate(bill.firstDueDate)) {
    throw new Error("Choose a valid first due date.")
  }

  if (bill.frequency !== "monthly" && !bill.firstDueDate) {
    throw new Error("Weekly and yearly bills need a first due date.")
  }
}
