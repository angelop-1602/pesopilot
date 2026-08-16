import type { AttachmentMetadata, AttachmentOwnerType } from "@/types/finance"
import { getDb } from "@/lib/db/client"

export interface AttachmentCleanupResult {
  metadataDeleted: number
  contentsDeleted: number
}

export async function cleanupOrphanAttachments(): Promise<AttachmentCleanupResult> {
  const db = getDb()

  return db.transaction(
    "rw",
    [
      db.accounts,
      db.transactions,
      db.bills,
      db.goals,
      db.settings,
      db.attachments,
      db.attachmentContents,
    ],
    async () => {
      const [
        accountIds,
        transactionIds,
        billIds,
        goalIds,
        profileIds,
        attachments,
        contentIds,
      ] = await Promise.all([
        db.accounts.toCollection().primaryKeys(),
        db.transactions.toCollection().primaryKeys(),
        db.bills.toCollection().primaryKeys(),
        db.goals.toCollection().primaryKeys(),
        db.settings.toCollection().primaryKeys(),
        db.attachments.toArray(),
        db.attachmentContents.toCollection().primaryKeys(),
      ])
      const ownerIds: Record<AttachmentOwnerType, Set<string>> = {
        account: new Set(accountIds),
        transaction: new Set(transactionIds),
        bill: new Set(billIds),
        goal: new Set(goalIds),
        profile: new Set(profileIds),
      }
      const contentIdSet = new Set(contentIds)
      const invalidMetadataIds = attachments
        .filter(
          (attachment) =>
            !attachmentOwnerExists(attachment, ownerIds) ||
            !contentIdSet.has(attachment.id)
        )
        .map((attachment) => attachment.id)
      const invalidMetadataIdSet = new Set(invalidMetadataIds)
      const validMetadataIds = new Set(
        attachments
          .filter((attachment) => !invalidMetadataIdSet.has(attachment.id))
          .map((attachment) => attachment.id)
      )
      const orphanContentIds = contentIds.filter(
        (attachmentId) => !validMetadataIds.has(attachmentId)
      )

      await Promise.all([
        db.attachments.bulkDelete(invalidMetadataIds),
        db.attachmentContents.bulkDelete(orphanContentIds),
      ])

      return {
        metadataDeleted: invalidMetadataIds.length,
        contentsDeleted: orphanContentIds.length,
      }
    }
  )
}

function attachmentOwnerExists(
  attachment: AttachmentMetadata,
  ownerIds: Record<AttachmentOwnerType, Set<string>>
) {
  return ownerIds[attachment.ownerType]?.has(attachment.ownerId) ?? false
}
