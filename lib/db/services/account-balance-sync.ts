import type { PesoPilotDatabase } from "@/lib/db/client"
import { getDb, nowIso } from "@/lib/db/client"
import { notifyDataChanged } from "@/lib/db/change-events"
import { replayAccountBalances } from "@/lib/finance/account-balance-replay"

export async function syncAccountBalancesInTransaction(
  db: PesoPilotDatabase
) {
  const [accounts, transactions] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
  ])
  const updatedAt = nowIso()
  const replayedBalances = replayAccountBalances(accounts, transactions)

  await Promise.all(
    replayedBalances.map((result) =>
      db.accounts.update(result.accountId, {
        balanceCentavos: result.balanceCentavos,
        availableCreditCentavos: result.availableCreditCentavos,
        updatedAt,
      })
    )
  )
}

export async function recalculateAccountBalances() {
  const db = getDb()

  await db.transaction("rw", [db.accounts, db.transactions], () =>
    syncAccountBalancesInTransaction(db)
  )
  notifyDataChanged()
}
