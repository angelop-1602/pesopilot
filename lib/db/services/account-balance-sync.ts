import type { PesoPilotDatabase } from "@/lib/db/client"
import { getDb, nowIso } from "@/lib/db/client"
import { notifyDataChanged } from "@/lib/db/change-events"
import { replayAccountBalances } from "@/lib/finance/account-balance-replay"
import { maybeCloseCreditCardStatement } from "@/lib/finance/accounts"

export async function syncAccountBalancesInTransaction(
  db: PesoPilotDatabase
) {
  const [accounts, transactions] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
  ])
  const updatedAt = nowIso()
  const replayedBalances = replayAccountBalances(accounts, transactions)
  const accountsById = new Map(
    accounts.map((account) => [account.id, account])
  )

  await Promise.all(
    replayedBalances.map((result) => {
      const account = accountsById.get(result.accountId)
      const accountWithCurrentBalance = account
        ? {
            ...account,
            balanceCentavos: result.balanceCentavos,
            availableCreditCentavos: result.availableCreditCentavos,
          }
        : undefined
      const statementUpdate = accountWithCurrentBalance
        ? maybeCloseCreditCardStatement(
            accountWithCurrentBalance,
            transactions
          )
        : null

      return db.accounts.update(result.accountId, {
        balanceCentavos: result.balanceCentavos,
        availableCreditCentavos: result.availableCreditCentavos,
        ...(statementUpdate
          ? {
              currentStatementBalanceCentavos:
                statementUpdate.currentStatementBalanceCentavos,
              lastStatementDate: statementUpdate.lastStatementDate,
            }
          : {}),
        updatedAt,
      })
    })
  )
}

export async function recalculateAccountBalances() {
  const db = getDb()

  await db.transaction("rw", [db.accounts, db.transactions], () =>
    syncAccountBalancesInTransaction(db)
  )
  notifyDataChanged()
}
