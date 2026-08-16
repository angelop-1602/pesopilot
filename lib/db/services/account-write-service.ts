import type { Account } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getDb, nowIso } from "@/lib/db/client"
import {
  deleteAccountRecord,
  putAccount,
  updateAccount,
} from "@/lib/db/repositories/accounts"
import { syncAccountBalancesInTransaction } from "@/lib/db/services/account-balance-sync"
import { deleteAttachmentsForOwnerInTransaction } from "@/lib/db/services/attachment-writes"

export async function saveAccountWithBalanceSync(account: Account) {
  const db = getDb()

  await db.transaction("rw", [db.accounts, db.transactions], async () => {
    await putAccount(account)
    await syncAccountBalancesInTransaction(db)
  })
  notifyDataChanged()

  return account
}

export async function deleteOrArchiveAccountWithAttachments(id: string) {
  const db = getDb()
  const result = await db.transaction(
    "rw",
    [
      db.accounts,
      db.transactions,
      db.attachments,
      db.attachmentContents,
    ],
    async () => {
      const [accountTransactionCount, transferTransactionCount] =
        await Promise.all([
          db.transactions.where("accountId").equals(id).count(),
          db.transactions.where("transferAccountId").equals(id).count(),
        ])

      if (accountTransactionCount + transferTransactionCount > 0) {
        await updateAccount(id, {
          archived: true,
          updatedAt: nowIso(),
        })
        return "archived" as const
      }

      await deleteAttachmentsForOwnerInTransaction(db, "account", id)
      await deleteAccountRecord(id)
      return "deleted" as const
    }
  )

  notifyDataChanged()
  return result
}
