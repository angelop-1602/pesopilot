import type {
  Account,
  AccountProductType,
  AccountType,
  BalanceNature,
} from "@/types/finance"
import {
  getAccountProduct,
  getAccountProductLabel,
  getBalanceNatureForProduct,
} from "@/lib/constants/account-products"
import type { InstitutionOption } from "@/lib/constants/institutions"
import { getTodayInputDate } from "@/lib/finance/dates"

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
  today = getTodayInputDate()
): Account | null {
  if (!isCreditCardAccount(account) || !account.statementDay) {
    return null
  }

  const statementDate = getStatementDateForCycle(today, account.statementDay)

  if (!statementDate || account.lastStatementDate === statementDate) {
    return null
  }

  return {
    ...account,
    currentStatementBalanceCentavos: account.balanceCentavos,
    lastStatementDate: statementDate,
    availableCreditCentavos: calculateAvailableCredit(account),
  }
}

export function getStatementDateForCycle(today: string, statementDay: number) {
  const [year, month, day] = today.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  const lastDay = new Date(year, month, 0).getDate()
  const cycleDay = Math.min(statementDay, lastDay)

  if (day < cycleDay) {
    return undefined
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(cycleDay).padStart(
    2,
    "0"
  )}`
}

export function getAccountProductDescription(
  accountProductType: AccountProductType
) {
  return getAccountProduct(accountProductType).description
}
