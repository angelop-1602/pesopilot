import type {
  Account,
  AccountProductType,
  AccountType,
  BalanceNature,
  Transaction,
} from "@/types/finance"
import {
  getAccountProduct,
  getAccountProductLabel,
  getBalanceNatureForProduct,
} from "@/lib/constants/account-products"
import type { InstitutionOption } from "@/lib/constants/institutions"
import {
  getBillDueDate,
  getInputDateParts,
  getTodayInputDate,
  shiftMonth,
} from "@/lib/finance/dates"

function getTransactionInputDate(transaction: Transaction) {
  const inputDate = transaction.date.slice(0, 10)
  return getInputDateParts(inputDate) ? inputDate : undefined
}

export function getBalanceNature(
  account: Partial<
    Pick<Account, "balanceNature" | "accountProductType" | "type">
  >
): BalanceNature {
  if (account.balanceNature) {
    return account.balanceNature
  }

  if (account.accountProductType) {
    return getBalanceNatureForProduct(account.accountProductType)
  }

  return getBalanceNatureForProduct(
    mapLegacyAccountTypeToProduct(account.type)
  )
}

export function isCreditCardAccount(
  account: Partial<Pick<Account, "accountProductType" | "type">>
) {
  return (
    account.accountProductType === "credit_card" || account.type === "credit"
  )
}

export function calculateAvailableCredit(
  account: Pick<Account, "balanceCentavos" | "creditLimitCentavos">
) {
  if (account.creditLimitCentavos === undefined) {
    return undefined
  }

  return account.creditLimitCentavos - account.balanceCentavos
}

export function generateAccountDisplayName(
  institution: Pick<InstitutionOption, "key" | "name" | "shortName">,
  accountProductType: AccountProductType,
  customDisplayName?: string
) {
  const customName = customDisplayName?.trim()

  if (customName) {
    return customName
  }

  if (institution.key === "cash" && accountProductType === "cash") {
    return "Cash Wallet"
  }

  return `${institution.shortName ?? institution.name} ${getAccountProductLabel(
    accountProductType
  )}`
}

export function mapLegacyAccountTypeToProduct(
  type?: AccountType
): AccountProductType {
  switch (type) {
    case "cash":
      return "cash"
    case "ewallet":
      return "wallet"
    case "bank":
    case "digital_bank":
    case "savings":
      return "savings"
    case "investment":
      return "investment"
    case "debt":
    case "loan":
      return "loan"
    case "credit":
      return "credit_card"
    default:
      return "savings"
  }
}

export function mapProductToLegacyAccountType(
  accountProductType: AccountProductType
): AccountType {
  switch (accountProductType) {
    case "cash":
      return "cash"
    case "wallet":
      return "ewallet"
    case "investment":
      return "investment"
    case "credit_card":
      return "credit"
    case "loan":
      return "loan"
    default:
      return "bank"
  }
}

export function getCreditCardStatus(
  account: Account,
  today = getTodayInputDate()
) {
  if (!isCreditCardAccount(account)) {
    return {
      isOverLimit: false,
      statementLabel: undefined,
      dueLabel: undefined,
    }
  }

  return {
    isOverLimit:
      account.creditLimitCentavos !== undefined &&
      account.balanceCentavos > account.creditLimitCentavos,
    statementLabel: account.statementDay
      ? `Statement closes on ${account.statementDay}`
      : undefined,
    dueLabel: account.paymentDueDay
      ? `Payment due on ${account.paymentDueDay}`
      : undefined,
    today,
  }
}

export function maybeCloseCreditCardStatement(
  account: Account,
  transactions: readonly Transaction[],
  today = getTodayInputDate()
): Account | null {
  if (!isCreditCardAccount(account) || !account.statementDay) {
    return null
  }

  const statementDate = getStatementDateForCycle(today, account.statementDay)
  const accountCreatedDate = account.createdAt.slice(0, 10)

  if (
    !statementDate ||
    (getInputDateParts(accountCreatedDate) && statementDate < accountCreatedDate) ||
    (account.lastStatementDate && account.lastStatementDate > statementDate)
  ) {
    return null
  }

  const statementBalanceCentavos = Math.max(
    replayAccountBalanceBeforeDate(account, transactions, statementDate),
    0
  )

  if (
    account.lastStatementDate === statementDate &&
    account.currentStatementBalanceCentavos === statementBalanceCentavos
  ) {
    return null
  }

  return {
    ...account,
    currentStatementBalanceCentavos: statementBalanceCentavos,
    lastStatementDate: statementDate,
    availableCreditCentavos: calculateAvailableCredit(account),
  }
}

export function getStatementDateForCycle(today: string, statementDay: number) {
  const todayParts = getInputDateParts(today)

  if (
    !todayParts ||
    !Number.isInteger(statementDay) ||
    statementDay < 1 ||
    statementDay > 31
  ) {
    return undefined
  }

  const monthId = today.slice(0, 7)
  const currentMonthStatementDate = getBillDueDate(monthId, statementDay)

  if (today >= currentMonthStatementDate) {
    return currentMonthStatementDate
  }

  return getBillDueDate(shiftMonth(monthId, -1), statementDay)
}

function applyTransactionToAccountBalance(
  balanceCentavos: number,
  account: Account,
  transaction: Transaction
) {
  const amountCentavos = transaction.amountCentavos

  if (transaction.accountId === account.id) {
    if (transaction.type === "income") {
      return (
        balanceCentavos +
        (getBalanceNature(account) === "liability"
          ? -amountCentavos
          : amountCentavos)
      )
    }

    if (transaction.type === "expense") {
      return (
        balanceCentavos +
        (getBalanceNature(account) === "liability"
          ? amountCentavos
          : -amountCentavos)
      )
    }

    if (transaction.transferAccountId !== account.id) {
      return (
        balanceCentavos +
        (getBalanceNature(account) === "liability"
          ? amountCentavos
          : -amountCentavos)
      )
    }
  }

  if (
    transaction.type === "transfer" &&
    transaction.transferAccountId === account.id &&
    transaction.accountId !== account.id
  ) {
    return (
      balanceCentavos +
      (getBalanceNature(account) === "liability"
        ? -amountCentavos
        : amountCentavos)
    )
  }

  return balanceCentavos
}

/**
 * Replays one account strictly before a date-only cutoff. Transactions on the
 * cutoff date belong to the next period, which keeps statement-day transfers
 * on the payment side of the credit-card statement boundary.
 */
export function replayAccountBalanceBeforeDate(
  account: Account,
  transactions: readonly Transaction[],
  endDateExclusive: string
) {
  if (!getInputDateParts(endDateExclusive)) {
    throw new RangeError("Balance replay cutoff must be a valid input date.")
  }

  return transactions.reduce((balanceCentavos, transaction) => {
    const transactionDate = getTransactionInputDate(transaction)

    if (!transactionDate || transactionDate >= endDateExclusive) {
      return balanceCentavos
    }

    return applyTransactionToAccountBalance(
      balanceCentavos,
      account,
      transaction
    )
  }, account.openingBalanceCentavos)
}

export function getAccountProductDescription(
  accountProductType: AccountProductType
) {
  return getAccountProduct(accountProductType).description
}
