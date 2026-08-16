import type { Account } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getDb, nowIso } from "@/lib/db/client"
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
  const db = getDb()
  const now = nowIso()
  const updateCount = await db.transaction(
    "rw",
    [db.accounts, db.transactions],
    async () => {
      const [accounts, transactions] = await Promise.all([
        db.accounts.toArray(),
        db.transactions.toArray(),
      ])
      const updates: Account[] = []

      for (const account of accounts) {
        const updatedAccount = maybeCloseCreditCardStatement(
          account,
          transactions
        )

        if (updatedAccount) {
          updates.push({
            ...updatedAccount,
            updatedAt: now,
          })
        }
      }

      if (updates.length > 0) {
        await db.accounts.bulkPut(updates)
      }

      return updates.length
    }
  )

  if (updateCount === 0) {
    return
  }

  notifyDataChanged()
}
