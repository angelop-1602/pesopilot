import type { Account } from "@/types/finance"
import type { AccountFormValues } from "@/features/accounts/types/account-form"
import {
  getDefaultInstitution,
  getInstitution,
  isAccountProductAllowed,
} from "@/lib/constants/institutions"
import { centavosToInput } from "@/lib/finance/currency"

export function getInitialAccountFormValues(
  account?: Account
): AccountFormValues {
  const institution = account
    ? getInstitution(account.institutionKey)
    : getDefaultInstitution()
  const accountProductType =
    account && isAccountProductAllowed(institution, account.accountProductType)
      ? account.accountProductType
      : institution.defaultAccountProductType

  return {
    id: account?.id,
    institutionKey: institution.key,
    accountProductType,
    openingBalance: account ? centavosToInput(account.balanceCentavos) : "",
    creditLimit:
      account?.creditLimitCentavos !== undefined
        ? centavosToInput(account.creditLimitCentavos)
        : "",
    statementDay: account?.statementDay,
    paymentDueDay: account?.paymentDueDay,
    includeInNetWorth: account?.includeInNetWorth ?? true,
  }
}

export function inputToNumber(value?: string) {
  const parsed = Number.parseFloat(value?.replace(/[^\d.-]/g, "") ?? "")

  return Number.isFinite(parsed) ? parsed : 0
}
