import { getDb } from "@/lib/db/client"
import { deleteGoalRecord } from "@/lib/db/repositories/goals"
import { deleteAttachmentsForOwnerInTransaction } from "@/lib/db/services/attachment-writes"

export async function deleteGoalWithAttachments(id: string) {
  const db = getDb()

  await db.transaction(
    "rw",
    [db.goals, db.attachments, db.attachmentContents],
    async () => {
      await deleteAttachmentsForOwnerInTransaction(db, "goal", id)
      await deleteGoalRecord(id)
    }
  )
}
