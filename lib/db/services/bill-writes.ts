import { getDb } from "@/lib/db/client"
import { deleteBillRecord } from "@/lib/db/repositories/bills"
import { deleteAttachmentsForOwnerInTransaction } from "@/lib/db/services/attachment-writes"

export async function deleteBillWithAttachments(id: string) {
  const db = getDb()

  await db.transaction(
    "rw",
    [db.bills, db.attachments, db.attachmentContents],
    async () => {
      await deleteAttachmentsForOwnerInTransaction(db, "bill", id)
      await deleteBillRecord(id)
    }
  )
}
