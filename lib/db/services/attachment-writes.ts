import type {
  AttachmentMetadata,
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"
import type { PreparedImageAttachment } from "@/lib/attachments/image-processing"
import {
  isAttachmentPurposeValidForOwner,
  isSingleAttachmentPurpose,
} from "@/lib/attachments/attachment-rules"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  createId,
  getDb,
  nowIso,
  type PesoPilotDatabase,
} from "@/lib/db/client"
import {
  getAttachmentContent,
  listAttachmentMetadataForOwner,
  putAttachmentContentRecords,
  putAttachmentMetadataRecords,
} from "@/lib/db/repositories/attachments"

export interface SavePreparedAttachmentInput {
  ownerType: AttachmentOwnerType
  ownerId: string
  purpose: AttachmentPurpose
  prepared: PreparedImageAttachment
  replaceByPurpose?: boolean
}

export interface SavePreparedAttachmentsInput
  extends Omit<SavePreparedAttachmentInput, "prepared"> {
  prepared: readonly PreparedImageAttachment[]
}

export async function savePreparedAttachment(
  input: SavePreparedAttachmentInput
) {
  const saved = await savePreparedAttachments({
    ...input,
    prepared: [input.prepared],
  })

  return saved[0]
}

export async function savePreparedAttachments({
  ownerType,
  ownerId,
  purpose,
  prepared,
  replaceByPurpose = false,
}: SavePreparedAttachmentsInput) {
  validateOwnerPurpose(ownerType, purpose)

  if (prepared.length === 0) {
    return []
  }

  if (isSingleAttachmentPurpose(purpose) && prepared.length > 1) {
    throw new Error("This attachment purpose accepts only one image.")
  }

  for (const attachment of prepared) {
    validatePreparedAttachment(attachment)
  }

  const db = getDb()
  const timestamp = nowIso()
  const metadata = prepared.map<AttachmentMetadata>((attachment) => ({
    id: createId(),
    ownerType,
    ownerId,
    purpose,
    fileName: attachment.fileName.trim(),
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    width: attachment.width,
    height: attachment.height,
    thumbnailBlob: attachment.thumbnailBlob,
    thumbnailMimeType:
      attachment.thumbnailBlob.type || attachment.mimeType,
    thumbnailSizeBytes: attachment.thumbnailSizeBytes,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))

  await db.transaction(
    "rw",
    attachmentWriteTables(db, ownerType),
    async () => {
      if (!(await attachmentOwnerExists(db, ownerType, ownerId))) {
        throw new Error("The attachment owner no longer exists.")
      }

      if (replaceByPurpose || isSingleAttachmentPurpose(purpose)) {
        const replacedIds = await db.attachments
          .where("[ownerType+ownerId+purpose]")
          .equals([ownerType, ownerId, purpose])
          .primaryKeys()

        await deleteAttachmentsByIdInTransaction(db, replacedIds)
      }

      await putAttachmentMetadataRecords(metadata)
      await putAttachmentContentRecords(
        metadata.map((attachment, index) => ({
          attachmentId: attachment.id,
          blob: prepared[index].blob,
        }))
      )
    }
  )

  notifyDataChanged()
  return metadata
}

export function listAttachmentsForOwner(
  ownerType: AttachmentOwnerType,
  ownerId: string
) {
  return listAttachmentMetadataForOwner(ownerType, ownerId)
}

export async function getAttachmentOriginalBlob(id: string) {
  return (await getAttachmentContent(id))?.blob
}

export async function deleteAttachment(id: string) {
  const db = getDb()
  const deleted = await db.transaction(
    "rw",
    [db.attachments, db.attachmentContents],
    async () => {
      const [metadata, content] = await Promise.all([
        db.attachments.get(id),
        db.attachmentContents.get(id),
      ])

      if (!metadata && !content) {
        return false
      }

      await deleteAttachmentsByIdInTransaction(db, [id])
      return true
    }
  )

  if (deleted) {
    notifyDataChanged()
  }
}

export async function deleteAttachmentsForOwnerInTransaction(
  db: PesoPilotDatabase,
  ownerType: AttachmentOwnerType,
  ownerId: string
) {
  const attachmentIds = await db.attachments
    .where("[ownerType+ownerId]")
    .equals([ownerType, ownerId])
    .primaryKeys()

  await deleteAttachmentsByIdInTransaction(db, attachmentIds)
  return attachmentIds.length
}

async function deleteAttachmentsByIdInTransaction(
  db: PesoPilotDatabase,
  attachmentIds: readonly string[]
) {
  if (attachmentIds.length === 0) {
    return
  }

  await Promise.all([
    db.attachments.bulkDelete([...attachmentIds]),
    db.attachmentContents.bulkDelete([...attachmentIds]),
  ])
}

function attachmentWriteTables(
  db: PesoPilotDatabase,
  ownerType: AttachmentOwnerType
) {
  const commonTables = [db.attachments, db.attachmentContents]

  switch (ownerType) {
    case "account":
      return [...commonTables, db.accounts]
    case "transaction":
      return [...commonTables, db.transactions]
    case "bill":
      return [...commonTables, db.bills]
    case "goal":
      return [...commonTables, db.goals]
    case "profile":
      return [...commonTables, db.settings]
  }
}

async function attachmentOwnerExists(
  db: PesoPilotDatabase,
  ownerType: AttachmentOwnerType,
  ownerId: string
) {
  switch (ownerType) {
    case "account":
      return Boolean(await db.accounts.get(ownerId))
    case "transaction":
      return Boolean(await db.transactions.get(ownerId))
    case "bill":
      return Boolean(await db.bills.get(ownerId))
    case "goal":
      return Boolean(await db.goals.get(ownerId))
    case "profile":
      return Boolean(await db.settings.get(ownerId))
  }
}

function validateOwnerPurpose(
  ownerType: AttachmentOwnerType,
  purpose: AttachmentPurpose
) {
  if (!isAttachmentPurposeValidForOwner(ownerType, purpose)) {
    throw new Error("This attachment purpose is not valid for the owner.")
  }
}

function validatePreparedAttachment(prepared: PreparedImageAttachment) {
  if (!prepared.fileName.trim()) {
    throw new Error("Attachment file name is required.")
  }

  if (!prepared.mimeType.startsWith("image/")) {
    throw new Error("Attachment must be an image.")
  }

  if (
    prepared.sizeBytes <= 0 ||
    prepared.sizeBytes !== prepared.blob.size ||
    prepared.thumbnailSizeBytes <= 0 ||
    prepared.thumbnailSizeBytes !== prepared.thumbnailBlob.size
  ) {
    throw new Error("Attachment size metadata is invalid.")
  }

  if (
    !Number.isInteger(prepared.width) ||
    prepared.width <= 0 ||
    !Number.isInteger(prepared.height) ||
    prepared.height <= 0
  ) {
    throw new Error("Attachment dimensions are invalid.")
  }
}
