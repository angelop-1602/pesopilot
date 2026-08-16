import type { Transaction } from "@/types/finance"
import { getDb } from "@/lib/db/client"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  deleteTransactionRecord,
  putTransaction,
} from "@/lib/db/repositories/transactions"
import { syncAccountBalancesInTransaction } from "@/lib/db/services/account-balance-sync"
import { deleteAttachmentsForOwnerInTransaction } from "@/lib/db/services/attachment-writes"

export async function saveTransactionWithBalanceSync(
  transaction: Transaction
) {
  const db = getDb()

  await db.transaction("rw", [db.accounts, db.transactions], async () => {
    await putTransaction(transaction)
    await syncAccountBalancesInTransaction(db)
  })
  notifyDataChanged()

  return transaction
}

export async function deleteTransactionWithBalanceSync(id: string) {
  const db = getDb()

  await db.transaction(
    "rw",
    [
      db.accounts,
      db.transactions,
      db.attachments,
      db.attachmentContents,
    ],
    async () => {
      await deleteAttachmentsForOwnerInTransaction(db, "transaction", id)
      await deleteTransactionRecord(id)
      await syncAccountBalancesInTransaction(db)
    }
  )
  notifyDataChanged()
}
