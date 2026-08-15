import type { FinanceBackup } from "@/lib/backup/types"
import { getDb } from "@/lib/db/client"

export async function readBackupData(): Promise<FinanceBackup["data"]> {
  const db = getDb()

  return db.transaction(
    "r",
    [
      db.accounts,
      db.categories,
      db.transactions,
      db.budgets,
      db.goals,
      db.bills,
      db.settings,
    ],
    async () => {
      const [
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        bills,
        settings,
      ] = await Promise.all([
        db.accounts.toArray(),
        db.categories.toArray(),
        db.transactions.toArray(),
        db.budgets.toArray(),
        db.goals.toArray(),
        db.bills.toArray(),
        db.settings.toArray(),
      ])

      return {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        bills,
        settings,
      }
    }
  )
}

export async function replaceBackupData(data: FinanceBackup["data"]) {
  const db = getDb()

  await db.transaction(
    "rw",
    [
      db.accounts,
      db.categories,
      db.transactions,
      db.budgets,
      db.goals,
      db.bills,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.bills.clear(),
        db.settings.clear(),
      ])

      await Promise.all([
        db.accounts.bulkPut(data.accounts),
        db.categories.bulkPut(data.categories),
        db.transactions.bulkPut(data.transactions),
        db.budgets.bulkPut(data.budgets),
        db.goals.bulkPut(data.goals),
        db.bills.bulkPut(data.bills),
        db.settings.bulkPut(data.settings),
      ])
    }
  )
}

export async function clearLocalData() {
  const db = getDb()

  await db.transaction(
    "rw",
    [
      db.accounts,
      db.categories,
      db.transactions,
      db.budgets,
      db.goals,
      db.bills,
      db.settings,
      db.automaticBackups,
    ],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.bills.clear(),
        db.settings.clear(),
        db.automaticBackups.clear(),
      ])
    }
  )
}
