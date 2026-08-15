import type {
  Account,
  AccountProductType,
  InstitutionKey,
} from "@/types/finance"
import {
  getInstitution,
  isAccountProductAllowed,
} from "@/lib/constants/institutions"
import {
  calculateAvailableCredit,
  generateAccountDisplayName,
  getBalanceNature,
  mapProductToLegacyAccountType,
} from "@/lib/finance/accounts"

export interface AccountRecordInput {
  institutionKey: InstitutionKey
  accountProductType: AccountProductType
  currentBalanceCentavos: number
  creditLimitCentavos?: number
  statementDay?: number
  paymentDueDay?: number
  includeInNetWorth: boolean
  allowOverLimit?: boolean
}

interface BuildAccountRecordOptions {
  input: AccountRecordInput
  existing?: Account
  id: string
  now: string
}

export function buildAccountRecord({
  input,
  existing,
  id,
  now,
}: BuildAccountRecordOptions): Account {
  if (!input.institutionKey) {
    throw new Error("Institution is required.")
  }

  const institution = getInstitution(input.institutionKey)
  const accountProductType = isAccountProductAllowed(
    institution,
    input.accountProductType
  )
    ? input.accountProductType
    : institution.defaultAccountProductType
  const isCreditCard = accountProductType === "credit_card"

  validateBalance(input.currentBalanceCentavos, isCreditCard)

  if (isCreditCard) {
    validateCreditCardInput(input)
  }

  const openingBalanceCentavos = existing
    ? existing.openingBalanceCentavos +
      (input.currentBalanceCentavos - existing.balanceCentavos)
    : input.currentBalanceCentavos
  const displayName = generateAccountDisplayName(
    institution,
    accountProductType,
    existing?.customDisplayName
  )
  const creditLimitCentavos = isCreditCard
    ? input.creditLimitCentavos
    : undefined
  const balanceCentavos = existing?.balanceCentavos ?? input.currentBalanceCentavos

  return {
    id: existing?.id ?? id,
    name: displayName,
    type: mapProductToLegacyAccountType(accountProductType),
    institutionKey: institution.key,
    institutionName: institution.name,
    institutionCategory: institution.institutionCategory,
    accountProductType,
    balanceNature: getBalanceNature({ accountProductType }),
    displayName,
    customDisplayName: existing?.customDisplayName,
    logoAsset: institution.logoAsset,
    logoText: institution.logoText,
    openingBalanceCentavos,
    balanceCentavos,
    currency: "PHP",
    includeInNetWorth: input.includeInNetWorth,
    color: institution.color,
    creditLimitCentavos,
    statementDay: isCreditCard ? input.statementDay : undefined,
    paymentDueDay: isCreditCard ? input.paymentDueDay : undefined,
    lastStatementDate: isCreditCard ? existing?.lastStatementDate : undefined,
    currentStatementBalanceCentavos: isCreditCard
      ? existing?.currentStatementBalanceCentavos
      : undefined,
    availableCreditCentavos: isCreditCard
      ? calculateAvailableCredit({
          balanceCentavos,
          creditLimitCentavos,
        })
      : undefined,
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
}

function validateBalance(balanceCentavos: number, isCreditCard: boolean) {
  if (balanceCentavos >= 0) {
    return
  }

  throw new Error(
    isCreditCard
      ? "Current amount owed cannot be negative."
      : "Balance cannot be negative."
  )
}

function validateCreditCardInput(input: AccountRecordInput) {
  if (!input.creditLimitCentavos || input.creditLimitCentavos <= 0) {
    throw new Error("Credit limit must be greater than zero.")
  }

  if (
    input.currentBalanceCentavos > input.creditLimitCentavos &&
    !input.allowOverLimit
  ) {
    throw new Error("Confirm before saving a credit card over its limit.")
  }

  if (!isValidDay(input.statementDay)) {
    throw new Error("Statement day must be from 1 to 31.")
  }

  if (!isValidDay(input.paymentDueDay)) {
    throw new Error("Payment due day must be from 1 to 31.")
  }
}

function isValidDay(day?: number) {
  return typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 31
}
