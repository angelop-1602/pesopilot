import type { Account } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getDb } from "@/lib/db/client"
import { putAccount } from "@/lib/db/repositories/accounts"
import { syncAccountBalancesInTransaction } from "@/lib/db/services/account-balance-sync"

export async function saveAccountWithBalanceSync(account: Account) {
  const db = getDb()

  await db.transaction("rw", [db.accounts, db.transactions], async () => {
    await putAccount(account)
    await syncAccountBalancesInTransaction(db)
  })
  notifyDataChanged()

  return account
}
