import type { Account, Transaction } from "@/types/finance"
import { isCreditCardAccount } from "@/lib/finance/accounts"
import {
  differenceInCalendarDays,
  getBillDueDate,
  getInputDateParts,
  getTodayInputDate,
  shiftMonth,
} from "@/lib/finance/dates"

export type CreditCardStatementStatus =
  | "no-statement"
  | "pending"
  | "due-soon"
  | "due-today"
  | "overdue"
  | "paid"

export interface CreditCardStatementSummary {
  account: Account
  availableCreditCentavos?: number
  canPay: boolean
  creditLimitCentavos?: number
  currentBalanceCentavos: number
  dueDate?: string
  isOverLimit: boolean
  lastStatementDate?: string
  paidTowardStatementCentavos: number
  remainingStatementBalanceCentavos: number
  statementBalanceCentavos: number
  status: CreditCardStatementStatus
  utilizationPercent?: number
}

export interface CreditCardStatementOptions {
  asOfDate?: string
  dueSoonDays?: number
}

const DEFAULT_DUE_SOON_DAYS = 7

function normalizeInputDate(date?: string) {
  if (!date) {
    return undefined
  }

  const inputDate = date.slice(0, 10)
  return getInputDateParts(inputDate) ? inputDate : undefined
}

function assertInputDate(date: string, label: string) {
  const inputDate = normalizeInputDate(date)

  if (!inputDate) {
    throw new RangeError(`${label} must be a valid input date.`)
  }

  return inputDate
}

function normalizeDueSoonDays(dueSoonDays: number) {
  if (!Number.isFinite(dueSoonDays)) {
    return DEFAULT_DUE_SOON_DAYS
  }

  return Math.max(0, Math.trunc(dueSoonDays))
}

export function getCreditCardAccounts(accounts: readonly Account[]) {
  return accounts.filter(
    (account) => !account.archived && isCreditCardAccount(account)
  )
}

export function getCreditUtilization(
  account: Pick<Account, "balanceCentavos" | "creditLimitCentavos">
) {
  const limitCentavos = account.creditLimitCentavos

  if (limitCentavos === undefined || limitCentavos <= 0) {
    return undefined
  }

  return (Math.max(account.balanceCentavos, 0) / limitCentavos) * 100
}

export function getCreditCardDueDate(
  lastStatementDate?: string,
  paymentDueDay?: number
) {
  const statementDate = normalizeInputDate(lastStatementDate)

  if (
    !statementDate ||
    paymentDueDay === undefined ||
    !Number.isInteger(paymentDueDay) ||
    paymentDueDay < 1 ||
    paymentDueDay > 31
  ) {
    return undefined
  }

  const statementMonthId = statementDate.slice(0, 7)
  const sameMonthDueDate = getBillDueDate(statementMonthId, paymentDueDay)

  if (sameMonthDueDate > statementDate) {
    return sameMonthDueDate
  }

  return getBillDueDate(shiftMonth(statementMonthId, 1), paymentDueDay)
}

export function getStatementPaymentTransactions(
  transactions: readonly Transaction[],
  cardAccountId: string,
  lastStatementDate: string,
  asOfDate = getTodayInputDate()
) {
  const statementDate = assertInputDate(lastStatementDate, "Statement date")
  const cutoffDate = assertInputDate(asOfDate, "As-of date")

  return transactions.filter((transaction) => {
    const transactionDate = normalizeInputDate(transaction.date)

    return (
      transaction.type === "transfer" &&
      transaction.transferAccountId === cardAccountId &&
      transaction.accountId !== cardAccountId &&
      transactionDate !== undefined &&
      transactionDate >= statementDate &&
      transactionDate <= cutoffDate
    )
  })
}

export function getStatementPaymentTotal(
  transactions: readonly Transaction[],
  cardAccountId: string,
  lastStatementDate: string,
  asOfDate = getTodayInputDate()
) {
  return getStatementPaymentTransactions(
    transactions,
    cardAccountId,
    lastStatementDate,
    asOfDate
  ).reduce(
    (totalCentavos, transaction) =>
      totalCentavos + transaction.amountCentavos,
    0
  )
}

export function getRemainingStatementBalance(
  statementBalanceCentavos: number,
  paidTowardStatementCentavos: number
) {
  return Math.max(statementBalanceCentavos - paidTowardStatementCentavos, 0)
}

interface GetCreditCardStatementStatusOptions {
  asOfDate?: string
  dueDate?: string
  dueSoonDays?: number
  hasStatement: boolean
  remainingStatementBalanceCentavos: number
}

export function getCreditCardStatementStatus({
  asOfDate = getTodayInputDate(),
  dueDate,
  dueSoonDays = DEFAULT_DUE_SOON_DAYS,
  hasStatement,
  remainingStatementBalanceCentavos,
}: GetCreditCardStatementStatusOptions): CreditCardStatementStatus {
  if (!hasStatement) {
    return "no-statement"
  }

  if (remainingStatementBalanceCentavos <= 0) {
    return "paid"
  }

  const cutoffDate = assertInputDate(asOfDate, "As-of date")
  const normalizedDueDate = normalizeInputDate(dueDate)

  if (!normalizedDueDate) {
    return "pending"
  }

  const daysUntilDue = differenceInCalendarDays(
    normalizedDueDate,
    cutoffDate
  )

  if (daysUntilDue < 0) {
    return "overdue"
  }

  if (daysUntilDue === 0) {
    return "due-today"
  }

  if (daysUntilDue <= normalizeDueSoonDays(dueSoonDays)) {
    return "due-soon"
  }

  return "pending"
}

export function getCreditCardStatementSummary(
  account: Account,
  transactions: readonly Transaction[],
  options: CreditCardStatementOptions = {}
): CreditCardStatementSummary {
  const asOfDate = options.asOfDate ?? getTodayInputDate()
  assertInputDate(asOfDate, "As-of date")

  const lastStatementDate = normalizeInputDate(account.lastStatementDate)
  const hasStatement = lastStatementDate !== undefined
  const statementBalanceCentavos = hasStatement
    ? Math.max(account.currentStatementBalanceCentavos ?? 0, 0)
    : 0
  const paidTowardStatementCentavos = lastStatementDate
    ? getStatementPaymentTotal(
        transactions,
        account.id,
        lastStatementDate,
        asOfDate
      )
    : 0
  const remainingStatementBalanceCentavos = getRemainingStatementBalance(
    statementBalanceCentavos,
    paidTowardStatementCentavos
  )
  const dueDate = getCreditCardDueDate(
    lastStatementDate,
    account.paymentDueDay
  )
  const creditLimitCentavos = account.creditLimitCentavos
  const availableCreditCentavos =
    creditLimitCentavos === undefined
      ? undefined
      : creditLimitCentavos - account.balanceCentavos

  return {
    account,
    availableCreditCentavos,
    canPay: hasStatement && remainingStatementBalanceCentavos > 0,
    creditLimitCentavos,
    currentBalanceCentavos: account.balanceCentavos,
    dueDate,
    isOverLimit:
      creditLimitCentavos !== undefined &&
      account.balanceCentavos > creditLimitCentavos,
    lastStatementDate,
    paidTowardStatementCentavos,
    remainingStatementBalanceCentavos,
    statementBalanceCentavos,
    status: getCreditCardStatementStatus({
      asOfDate,
      dueDate,
      dueSoonDays: options.dueSoonDays,
      hasStatement,
      remainingStatementBalanceCentavos,
    }),
    utilizationPercent: getCreditUtilization(account),
  }
}

export function getCreditCardStatementSummaries(
  accounts: readonly Account[],
  transactions: readonly Transaction[],
  options: CreditCardStatementOptions = {}
) {
  return getCreditCardAccounts(accounts).map((account) =>
    getCreditCardStatementSummary(account, transactions, options)
  )
}
