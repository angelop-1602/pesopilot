import type {
  AttachmentContent,
  AttachmentMetadata,
} from "@/types/finance"
import type { FinanceBackupDataV1 } from "@/lib/backup/types"
import { getDb } from "@/lib/db/client"

export interface RuntimeBackupData extends FinanceBackupDataV1 {
  attachments: AttachmentMetadata[]
  attachmentContents: AttachmentContent[]
}

export async function readBackupData(): Promise<RuntimeBackupData> {
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
      db.attachments,
      db.attachmentContents,
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
        attachments,
        attachmentContents,
      ] = await Promise.all([
        db.accounts.toArray(),
        db.categories.toArray(),
        db.transactions.toArray(),
        db.budgets.toArray(),
        db.goals.toArray(),
        db.bills.toArray(),
        db.settings.toArray(),
        db.attachments.toArray(),
        db.attachmentContents.toArray(),
      ])

      return {
        accounts,
        categories,
        transactions,
        budgets,
        goals,
        bills,
        settings,
        attachments,
        attachmentContents,
      }
    }
  )
}

export async function replaceBackupData(data: RuntimeBackupData) {
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
      db.attachments,
      db.attachmentContents,
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
        db.attachments.clear(),
        db.attachmentContents.clear(),
      ])

      await Promise.all([
        db.accounts.bulkPut(data.accounts),
        db.categories.bulkPut(data.categories),
        db.transactions.bulkPut(data.transactions),
        db.budgets.bulkPut(data.budgets),
        db.goals.bulkPut(data.goals),
        db.bills.bulkPut(data.bills),
        db.settings.bulkPut(data.settings),
        db.attachments.bulkPut(data.attachments),
        db.attachmentContents.bulkPut(data.attachmentContents),
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
      db.attachments,
      db.attachmentContents,
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
        db.attachments.clear(),
        db.attachmentContents.clear(),
      ])
    }
  )
}
