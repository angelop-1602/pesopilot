import type { Bill } from "@/types/finance"
import type { BillFormValues } from "@/features/bills/types/bill-form-values"
import { getBillRecurrenceAnchor } from "@/lib/finance/bill-occurrences"
import { centavosToInput } from "@/lib/finance/currency"
import {
  getBillDueDate,
  getCurrentMonthId,
  getTodayInputDate,
} from "@/lib/finance/dates"

export function getInitialBillFormValues(bill?: Bill): BillFormValues {
  const firstDueDate =
    bill?.firstDueDate ??
    (bill
      ? getBillRecurrenceAnchor(bill) ??
        getBillDueDate(getCurrentMonthId(), bill.dueDay)
      : getTodayInputDate())

  return {
    id: bill?.id,
    name: bill?.name ?? "",
    amount: bill ? centavosToInput(bill.amountCentavos) : "",
    accountId: bill?.accountId,
    categoryId: bill?.categoryId,
    dueDay: Number(firstDueDate.slice(-2)),
    firstDueDate,
    frequency: bill?.frequency ?? "monthly",
    autopay: bill?.autopay ?? false,
    active: bill?.active ?? true,
    notes: bill?.notes ?? "",
  }
}
