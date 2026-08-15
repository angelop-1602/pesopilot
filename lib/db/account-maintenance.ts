import type { Account } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { nowIso } from "@/lib/db/client"
import {
  listAccounts,
  putAccounts,
} from "@/lib/db/repositories/accounts"
import { normalizeStoredAccount } from "@/lib/finance/account-normalization"
import { maybeCloseCreditCardStatement } from "@/lib/finance/accounts"

export async function migrateAccountsToProductModel() {
  const accounts = await listAccounts({ includeArchived: true })
  const now = nowIso()
  const updates = accounts
    .map((account) => normalizeStoredAccount(account, now))
    .filter((result) => result.changed)
    .map((result) => result.account)

  if (updates.length === 0) {
    return
  }

  await putAccounts(updates)
  notifyDataChanged()
}

export async function closeCreditCardStatementsIfNeeded() {
  const accounts = await listAccounts({ includeArchived: true })
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

  if (updates.length === 0) {
    return
  }

  await putAccounts(updates)
  notifyDataChanged()
}
