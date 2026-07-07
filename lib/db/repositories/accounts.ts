import type {
  Account,
  AccountFormValues,
  AccountProductType,
  AccountType,
  InstitutionKey,
} from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  getInstitution,
  isAccountProductAllowed,
} from "@/lib/constants/institutions"
import {
  calculateAvailableCredit,
  generateAccountDisplayName,
  getBalanceNature,
  isCreditCardAccount,
  mapLegacyAccountTypeToProduct,
  mapProductToLegacyAccountType,
  maybeCloseCreditCardStatement,
} from "@/lib/finance/accounts"
import { pesosToCentavos } from "@/lib/finance/currency"
import { createId, getDb, nowIso } from "@/lib/db/client"
import { recalculateAccountBalances } from "@/lib/db/repositories/transactions"

type LegacyStoredAccount = Account & {
  institutionKey?: InstitutionKey | string
  institutionName?: string
  institutionCategory?: Account["institutionCategory"]
  accountProductType?: AccountProductType
  balanceNature?: Account["balanceNature"]
  displayName?: string
  customDisplayName?: string
  currency?: Account["currency"]
  color?: string
  logoAsset?: string
  logoText?: string
  name?: string
  type?: AccountType
  notes?: string
  institutionDomain?: string
  institutionId?: string
  logoUrl?: string
}

export async function listAccounts(options?: { includeArchived?: boolean }) {
  const db = getDb()
  const accounts = await db.accounts.toArray()

  return accounts
    .filter((account) => options?.includeArchived || !account.archived)
    .sort((a, b) => getSortableName(a).localeCompare(getSortableName(b)))
}

export async function saveAccount(values: AccountFormValues) {
  const db = getDb()
  const now = nowIso()
  const existing = values.id ? await db.accounts.get(values.id) : undefined
  const institution = getInstitution(values.institutionKey)
  const accountProductType = isAccountProductAllowed(
    institution,
    values.accountProductType
  )
    ? values.accountProductType
    : institution.defaultAccountProductType
  const balanceNature = getBalanceNature({ accountProductType })
  const requestedBalanceCentavos = pesosToCentavos(values.openingBalance)
  const openingBalanceCentavos = existing
    ? existing.openingBalanceCentavos +
      (requestedBalanceCentavos - existing.balanceCentavos)
    : requestedBalanceCentavos
  const displayName = generateAccountDisplayName(
    institution,
    accountProductType,
    existing?.customDisplayName
  )
  const creditLimitCentavos = values.creditLimit
    ? pesosToCentavos(values.creditLimit)
    : undefined
  const isCreditCard = accountProductType === "credit_card"

  if (!values.institutionKey) {
    throw new Error("Institution is required.")
  }

  if (requestedBalanceCentavos < 0) {
    throw new Error(
      isCreditCard ? "Current amount owed cannot be negative." : "Balance cannot be negative."
    )
  }

  if (isCreditCard) {
    validateCreditCardValues(values, requestedBalanceCentavos, creditLimitCentavos)
  }

  const account: Account = {
    id: existing?.id ?? createId(),
    name: displayName,
    type: mapProductToLegacyAccountType(accountProductType),
    institutionKey: institution.key,
    institutionName: institution.name,
    institutionCategory: institution.institutionCategory,
    accountProductType,
    balanceNature,
    displayName,
    customDisplayName: existing?.customDisplayName,
    logoAsset: institution.logoAsset,
    logoText: institution.logoText,
    openingBalanceCentavos,
    balanceCentavos: existing?.balanceCentavos ?? requestedBalanceCentavos,
    currency: "PHP",
    includeInNetWorth: values.includeInNetWorth,
    color: institution.color,
    creditLimitCentavos: isCreditCard ? creditLimitCentavos : undefined,
    statementDay: isCreditCard ? values.statementDay : undefined,
    paymentDueDay: isCreditCard ? values.paymentDueDay : undefined,
    lastStatementDate: isCreditCard ? existing?.lastStatementDate : undefined,
    currentStatementBalanceCentavos: isCreditCard
      ? existing?.currentStatementBalanceCentavos
      : undefined,
    availableCreditCentavos: isCreditCard
      ? calculateAvailableCredit({
          balanceCentavos: existing?.balanceCentavos ?? requestedBalanceCentavos,
          creditLimitCentavos,
        })
      : undefined,
    archived: existing?.archived ?? false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  await db.accounts.put(account)
  await recalculateAccountBalances()
  notifyDataChanged()
  return account
}

export function normalizeStoredAccount(account: Account, now = nowIso()) {
  const legacy = account as LegacyStoredAccount
  const institution = getInstitution(legacy.institutionKey)
  const accountProductType = getStoredAccountProductType(legacy, institution)
  const customDisplayName = getCustomDisplayName(legacy, institution, accountProductType)
  const displayName = generateAccountDisplayName(
    institution,
    accountProductType,
    customDisplayName
  )
  const balanceNature = getBalanceNature({ accountProductType })
  const creditLimitCentavos = isCreditCardAccount({ accountProductType })
    ? legacy.creditLimitCentavos
    : undefined
  const balanceCentavos = legacy.balanceCentavos ?? 0
  const normalized: Account = {
    id: legacy.id,
    name: displayName,
    type: mapProductToLegacyAccountType(accountProductType),
    institutionKey: institution.key,
    institutionName: institution.name,
    institutionCategory: institution.institutionCategory,
    accountProductType,
    balanceNature,
    displayName,
    customDisplayName,
    logoAsset: institution.logoAsset,
    logoText: institution.logoText,
    openingBalanceCentavos: legacy.openingBalanceCentavos ?? balanceCentavos,
    balanceCentavos,
    currency: "PHP",
    includeInNetWorth: legacy.includeInNetWorth ?? true,
    color: legacy.color ?? institution.color,
    creditLimitCentavos,
    statementDay: isCreditCardAccount({ accountProductType })
      ? legacy.statementDay
      : undefined,
    paymentDueDay: isCreditCardAccount({ accountProductType })
      ? legacy.paymentDueDay
      : undefined,
    lastStatementDate: isCreditCardAccount({ accountProductType })
      ? legacy.lastStatementDate
      : undefined,
    currentStatementBalanceCentavos: isCreditCardAccount({ accountProductType })
      ? legacy.currentStatementBalanceCentavos
      : undefined,
    availableCreditCentavos: isCreditCardAccount({ accountProductType })
      ? calculateAvailableCredit({
          balanceCentavos,
          creditLimitCentavos,
        })
      : undefined,
    archived: legacy.archived ?? false,
    createdAt: legacy.createdAt,
    updatedAt: legacy.updatedAt,
  }

  const changed = accountNeedsNormalization(legacy, normalized)

  return {
    account: changed ? { ...normalized, updatedAt: now } : normalized,
    changed,
  }
}

export async function migrateAccountsToProductModel() {
  const db = getDb()
  const accounts = await db.accounts.toArray()
  const now = nowIso()
  const updates = accounts
    .map((account) => normalizeStoredAccount(account, now))
    .filter((result) => result.changed)
    .map((result) => result.account)

  if (updates.length > 0) {
    await db.accounts.bulkPut(updates)
    notifyDataChanged()
  }
}

export async function closeCreditCardStatementsIfNeeded() {
  const db = getDb()
  const accounts = await db.accounts.toArray()
  const now = nowIso()
  const updates: Account[] = []

  for (const account of accounts) {
    const updatedAccount = maybeCloseCreditCardStatement(account)

    if (updatedAccount) {
      updates.push({
        ...updatedAccount,
        updatedAt: now,
      })
    }
  }

  if (updates.length > 0) {
    await db.accounts.bulkPut(updates)
    notifyDataChanged()
  }
}

function validateCreditCardValues(
  values: AccountFormValues,
  balanceCentavos: number,
  creditLimitCentavos?: number
) {
  if (!creditLimitCentavos || creditLimitCentavos <= 0) {
    throw new Error("Credit limit must be greater than zero.")
  }

  if (balanceCentavos > creditLimitCentavos && !values.allowOverLimit) {
    throw new Error("Confirm before saving a credit card over its limit.")
  }

  if (!isValidDay(values.statementDay)) {
    throw new Error("Statement day must be from 1 to 31.")
  }

  if (!isValidDay(values.paymentDueDay)) {
    throw new Error("Payment due day must be from 1 to 31.")
  }
}

function isValidDay(day?: number) {
  return typeof day === "number" && Number.isInteger(day) && day >= 1 && day <= 31
}

function getStoredAccountProductType(
  account: LegacyStoredAccount,
  institution: ReturnType<typeof getInstitution>
) {
  const productType =
    account.accountProductType ?? mapLegacyAccountTypeToProduct(account.type)

  return isAccountProductAllowed(institution, productType)
    ? productType
    : institution.defaultAccountProductType
}

function getCustomDisplayName(
  account: LegacyStoredAccount,
  institution: ReturnType<typeof getInstitution>,
  accountProductType: AccountProductType
) {
  if (account.customDisplayName?.trim()) {
    return account.customDisplayName.trim()
  }

  const existingName = account.displayName ?? account.name
  const generated = generateAccountDisplayName(institution, accountProductType)

  if (!existingName || existingName === generated || existingName === institution.name) {
    return undefined
  }

  return existingName
}

function accountNeedsNormalization(
  legacy: LegacyStoredAccount,
  normalized: Account
) {
  return (
    legacy.notes !== undefined ||
    legacy.institutionDomain !== undefined ||
    legacy.institutionId !== undefined ||
    legacy.logoUrl !== undefined ||
    legacy.institutionKey !== normalized.institutionKey ||
    legacy.institutionName !== normalized.institutionName ||
    legacy.institutionCategory !== normalized.institutionCategory ||
    legacy.accountProductType !== normalized.accountProductType ||
    legacy.balanceNature !== normalized.balanceNature ||
    legacy.displayName !== normalized.displayName ||
    legacy.name !== normalized.name ||
    legacy.currency !== normalized.currency ||
    legacy.color !== normalized.color ||
    legacy.logoAsset !== normalized.logoAsset ||
    legacy.logoText !== normalized.logoText ||
    legacy.availableCreditCentavos !== normalized.availableCreditCentavos
  )
}

function getSortableName(account: Account) {
  return account.displayName ?? account.name
}

export async function archiveAccount(id: string) {
  const db = getDb()
  await db.accounts.update(id, {
    archived: true,
    updatedAt: nowIso(),
  })
  notifyDataChanged()
}

export async function restoreAccount(id: string) {
  const db = getDb()
  await db.accounts.update(id, {
    archived: false,
    updatedAt: nowIso(),
  })
  notifyDataChanged()
}

export async function deleteAccount(id: string) {
  const db = getDb()
  const transactionCount = await db.transactions
    .where("accountId")
    .equals(id)
    .count()
  const transferCount = await db.transactions
    .where("transferAccountId")
    .equals(id)
    .count()

  if (transactionCount + transferCount > 0) {
    await archiveAccount(id)
    return "archived" as const
  }

  await db.accounts.delete(id)
  notifyDataChanged()
  return "deleted" as const
}
