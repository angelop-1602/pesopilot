import type {
  Account,
  AccountProductType,
  AccountType,
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
  isCreditCardAccount,
  mapLegacyAccountTypeToProduct,
  mapProductToLegacyAccountType,
} from "@/lib/finance/accounts"

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

export function normalizeStoredAccount(account: Account, now: string) {
  const legacy = account as LegacyStoredAccount
  const institution = getInstitution(legacy.institutionKey)
  const accountProductType = getStoredAccountProductType(legacy, institution)
  const customDisplayName = getCustomDisplayName(
    legacy,
    institution,
    accountProductType
  )
  const displayName = generateAccountDisplayName(
    institution,
    accountProductType,
    customDisplayName
  )
  const creditCard = isCreditCardAccount({ accountProductType })
  const creditLimitCentavos = creditCard
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
    balanceNature: getBalanceNature({ accountProductType }),
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
    statementDay: creditCard ? legacy.statementDay : undefined,
    paymentDueDay: creditCard ? legacy.paymentDueDay : undefined,
    lastStatementDate: creditCard ? legacy.lastStatementDate : undefined,
    currentStatementBalanceCentavos: creditCard
      ? legacy.currentStatementBalanceCentavos
      : undefined,
    availableCreditCentavos: creditCard
      ? calculateAvailableCredit({ balanceCentavos, creditLimitCentavos })
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
