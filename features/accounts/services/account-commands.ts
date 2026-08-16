import type { AccountFormValues } from "@/features/accounts/types/account-form"
import { notifyDataChanged } from "@/lib/db/change-events"
import { createId, nowIso } from "@/lib/db/client"
import {
  getAccount,
  updateAccount,
} from "@/lib/db/repositories/accounts"
import {
  deleteOrArchiveAccountWithAttachments,
  saveAccountWithBalanceSync,
} from "@/lib/db/services/account-write-service"
import { buildAccountRecord } from "@/lib/finance/account-record"
import { pesosToCentavos } from "@/lib/finance/currency"

export async function saveAccount(values: AccountFormValues) {
  const existing = values.id ? await getAccount(values.id) : undefined
  const account = buildAccountRecord({
    existing,
    id: existing?.id ?? createId(),
    now: nowIso(),
    input: {
      institutionKey: values.institutionKey,
      accountProductType: values.accountProductType,
      currentBalanceCentavos: pesosToCentavos(values.openingBalance),
      creditLimitCentavos: values.creditLimit
        ? pesosToCentavos(values.creditLimit)
        : undefined,
      statementDay: values.statementDay,
      paymentDueDay: values.paymentDueDay,
      includeInNetWorth: values.includeInNetWorth,
      allowOverLimit: values.allowOverLimit,
    },
  })

  return saveAccountWithBalanceSync(account)
}

export async function archiveAccount(id: string) {
  await updateAccount(id, {
    archived: true,
    updatedAt: nowIso(),
  })
  notifyDataChanged()
}

export async function restoreAccount(id: string) {
  await updateAccount(id, {
    archived: false,
    updatedAt: nowIso(),
  })
  notifyDataChanged()
}

export async function deleteAccount(id: string) {
  return deleteOrArchiveAccountWithAttachments(id)
}
