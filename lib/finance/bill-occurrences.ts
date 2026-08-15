import type { Bill, BillOccurrence, Transaction } from "@/types/finance"
import {
  addDays,
  differenceInCalendarDays,
  getBillDueDate,
  getInputDateParts,
  getMonthDateRange,
  getTodayInputDate,
  isInputDate,
  shiftMonth,
} from "@/lib/finance/dates"
import { transactionCountsInMonth } from "@/lib/finance/transaction-summaries"

function getLegacyNonMonthlyAnchor(bill: Bill) {
  const createdDate = bill.createdAt.slice(0, 10)

  if (!isInputDate(createdDate)) {
    return undefined
  }

  const createdMonthId = createdDate.slice(0, 7)
  let anchor = getBillDueDate(createdMonthId, bill.dueDay)

  // Older bills did not persist a recurrence anchor. Using the bill's creation
  // month plus its due day is deterministic, but is only a compatibility
  // fallback; editing these bills should capture an explicit firstDueDate.
  if (bill.frequency === "weekly") {
    while (anchor < createdDate) {
      anchor = addDays(anchor, 7)
    }

    return anchor
  }

  if (anchor < createdDate) {
    anchor = getBillDueDate(shiftMonth(createdMonthId, 12), bill.dueDay)
  }

  return anchor
}

export function getBillRecurrenceAnchor(bill: Bill) {
  if (bill.firstDueDate && isInputDate(bill.firstDueDate)) {
    return bill.firstDueDate
  }

  return bill.frequency === "monthly"
    ? undefined
    : getLegacyNonMonthlyAnchor(bill)
}

export function getBillOccurrenceDatesForMonth(bill: Bill, monthId: string) {
  const { startDate, endDateExclusive } = getMonthDateRange(monthId)
  const anchor = getBillRecurrenceAnchor(bill)

  if (bill.frequency === "monthly") {
    const anchorParts = anchor ? getInputDateParts(anchor) : undefined
    const dueDate = getBillDueDate(monthId, anchorParts?.day ?? bill.dueDay)

    return anchor && dueDate < anchor ? [] : [dueDate]
  }

  if (!anchor) {
    return []
  }

  if (bill.frequency === "yearly") {
    const anchorParts = getInputDateParts(anchor)

    if (!anchorParts || Number(monthId.slice(5, 7)) !== anchorParts.month) {
      return []
    }

    const dueDate = getBillDueDate(monthId, anchorParts.day)
    return dueDate < anchor ? [] : [dueDate]
  }

  if (anchor >= endDateExclusive) {
    return []
  }

  const daysFromAnchor = differenceInCalendarDays(startDate, anchor)
  const weeksFromAnchor = daysFromAnchor > 0 ? Math.ceil(daysFromAnchor / 7) : 0
  let dueDate = addDays(anchor, weeksFromAnchor * 7)
  const dueDates: string[] = []

  while (dueDate < startDate) {
    dueDate = addDays(dueDate, 7)
  }

  while (dueDate < endDateExclusive) {
    dueDates.push(dueDate)
    dueDate = addDays(dueDate, 7)
  }

  return dueDates
}

function findNearestDueDate(transactionDate: string, dueDates: string[]) {
  return dueDates.reduce((nearest, dueDate) => {
    const distance = Math.abs(
      differenceInCalendarDays(transactionDate, dueDate)
    )
    const nearestDistance = Math.abs(
      differenceInCalendarDays(transactionDate, nearest)
    )

    return distance < nearestDistance ||
      (distance === nearestDistance && dueDate < nearest)
      ? dueDate
      : nearest
  })
}

function assignBillPayments(
  bill: Bill,
  dueDates: string[],
  transactions: readonly Transaction[],
  monthId: string
) {
  const paymentsByDueDate = new Map(
    dueDates.map((dueDate) => [dueDate, [] as Transaction[]])
  )
  const payments = transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" &&
        transaction.billId === bill.id &&
        transactionCountsInMonth(transaction, monthId)
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)
    )
  const untaggedPayments: Transaction[] = []

  for (const payment of payments) {
    if (payment.billOccurrenceDate) {
      paymentsByDueDate.get(payment.billOccurrenceDate)?.push(payment)
    } else {
      untaggedPayments.push(payment)
    }
  }

  if (bill.frequency !== "weekly") {
    const dueDate = dueDates[0]

    if (dueDate) {
      paymentsByDueDate.get(dueDate)?.push(...untaggedPayments)
    }

    return paymentsByDueDate
  }

  for (const payment of untaggedPayments) {
    const unpaidDueDates = dueDates.filter(
      (dueDate) => paymentsByDueDate.get(dueDate)?.length === 0
    )
    const candidateDueDates =
      unpaidDueDates.length > 0 ? unpaidDueDates : dueDates

    if (candidateDueDates.length === 0) {
      continue
    }

    const dueDate = findNearestDueDate(
      payment.date.slice(0, 10),
      candidateDueDates
    )
    paymentsByDueDate.get(dueDate)?.push(payment)
  }

  return paymentsByDueDate
}

export function getBillOccurrencesForMonth(
  bills: readonly Bill[],
  transactions: readonly Transaction[],
  monthId: string,
  asOfDate = getTodayInputDate()
): BillOccurrence[] {
  getMonthDateRange(monthId)
  const effectiveAsOfDate = isInputDate(asOfDate)
    ? asOfDate
    : getTodayInputDate()
  const occurrences = bills
    .filter((bill) => bill.active)
    .flatMap((bill) => {
      const dueDates = getBillOccurrenceDatesForMonth(bill, monthId)
      const paymentsByDueDate = assignBillPayments(
        bill,
        dueDates,
        transactions,
        monthId
      )

      return dueDates.map((dueDate): BillOccurrence => {
        const payments = paymentsByDueDate.get(dueDate) ?? []
        const isPaid = payments.length > 0

        return {
          occurrenceKey: `${bill.id}:${dueDate}`,
          billId: bill.id,
          bill,
          dueDate,
          expectedAmountCentavos: bill.amountCentavos,
          paidAmountCentavos: payments.reduce(
            (total, payment) => total + payment.amountCentavos,
            0
          ),
          paymentTransactionIds: payments.map((payment) => payment.id),
          status: isPaid
            ? "paid"
            : dueDate < effectiveAsOfDate
              ? "overdue"
              : "pending",
        }
      })
    })

  return occurrences.sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.bill.name.localeCompare(b.bill.name) ||
      a.occurrenceKey.localeCompare(b.occurrenceKey)
  )
}

export function getUpcomingBills(bills: readonly Bill[], monthId: string) {
  return bills
    .filter((bill) => bill.active)
    .flatMap((bill) =>
      getBillOccurrenceDatesForMonth(bill, monthId).map((dueDate) => ({
        ...bill,
        dueDate,
      }))
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
}
