import type {
  AttachmentContent,
  AttachmentMetadata,
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"
import type {
  BackupAttachment,
  FinanceBackupDataV1,
} from "@/lib/backup/types"
import type { BackupArchiveEntry } from "@/lib/backup/archive"
import { assertSafeArchivePath } from "@/lib/backup/archive"
import { detectImageMimeType } from "@/lib/attachments/image-processing"

const SINGLE_PURPOSES = new Set<AttachmentPurpose>([
  "account_image",
  "goal_cover",
  "profile_image",
])

const PURPOSE_OWNERS: Record<
  Exclude<AttachmentPurpose, "other">,
  readonly AttachmentOwnerType[]
> = {
  receipt: ["transaction"],
  payment_proof: ["transaction"],
  bill_document: ["bill"],
  account_image: ["account"],
  goal_cover: ["goal"],
  profile_image: ["profile"],
}

export interface AttachmentArchiveBundle {
  attachments: BackupAttachment[]
  entries: BackupArchiveEntry[]
}

export interface RestoredAttachmentData {
  attachments: AttachmentMetadata[]
  attachmentContents: AttachmentContent[]
}

export function createAttachmentArchiveBundle(
  attachments: readonly AttachmentMetadata[],
  attachmentContents: readonly AttachmentContent[]
): AttachmentArchiveBundle {
  const contentById = new Map(
    attachmentContents.map((content) => [content.attachmentId, content])
  )
  const records: BackupAttachment[] = []
  const entries: BackupArchiveEntry[] = []

  for (const attachment of attachments) {
    const content = contentById.get(attachment.id)

    if (!content || content.blob.size !== attachment.sizeBytes) {
      throw new Error(`Attachment content is missing or invalid: ${attachment.fileName}`)
    }

    if (attachment.thumbnailBlob.size !== attachment.thumbnailSizeBytes) {
      throw new Error(`Attachment thumbnail is invalid: ${attachment.fileName}`)
    }

    const { originalPath, thumbnailPath } = getAttachmentArchivePaths(
      attachment.id
    )
    const { thumbnailBlob, ...metadata } = attachment

    records.push({
      ...metadata,
      originalPath,
      thumbnailPath,
    })
    entries.push(
      { path: originalPath, blob: content.blob },
      { path: thumbnailPath, blob: thumbnailBlob }
    )
  }

  return { attachments: records, entries }
}

export function restoreAttachmentArchiveData(
  financeData: FinanceBackupDataV1,
  attachments: readonly BackupAttachment[],
  files: ReadonlyMap<string, Uint8Array>
): RestoredAttachmentData {
  const ownerIds = getOwnerIds(financeData)
  const seenAttachmentIds = new Set<string>()
  const seenPaths = new Set<string>()
  const seenSinglePurposes = new Set<string>()
  const expectedPaths = new Set<string>()
  const restoredMetadata: AttachmentMetadata[] = []
  const restoredContents: AttachmentContent[] = []

  for (const attachment of attachments) {
    validateAttachmentOwner(attachment, ownerIds)

    if (seenAttachmentIds.has(attachment.id)) {
      throw new Error(`Backup contains duplicate attachment ID: ${attachment.id}`)
    }

    seenAttachmentIds.add(attachment.id)

    const canonicalPaths = getAttachmentArchivePaths(attachment.id)

    if (
      attachment.originalPath !== canonicalPaths.originalPath ||
      attachment.thumbnailPath !== canonicalPaths.thumbnailPath
    ) {
      throw new Error(`Backup attachment path is invalid: ${attachment.fileName}`)
    }

    for (const path of [attachment.originalPath, attachment.thumbnailPath]) {
      assertSafeArchivePath(path)

      if (seenPaths.has(path)) {
        throw new Error(`Backup contains duplicate attachment path: ${path}`)
      }

      seenPaths.add(path)
      expectedPaths.add(path)
    }

    if (SINGLE_PURPOSES.has(attachment.purpose)) {
      const purposeKey = `${attachment.ownerType}:${attachment.ownerId}:${attachment.purpose}`

      if (seenSinglePurposes.has(purposeKey)) {
        throw new Error("Backup contains multiple single-image attachments.")
      }

      seenSinglePurposes.add(purposeKey)
    }

    const originalBytes = files.get(attachment.originalPath)
    const thumbnailBytes = files.get(attachment.thumbnailPath)

    if (!originalBytes || !thumbnailBytes) {
      throw new Error(`Backup attachment file is missing: ${attachment.fileName}`)
    }

    if (
      originalBytes.byteLength !== attachment.sizeBytes ||
      thumbnailBytes.byteLength !== attachment.thumbnailSizeBytes
    ) {
      throw new Error(`Backup attachment size is invalid: ${attachment.fileName}`)
    }

    if (
      detectImageMimeType(originalBytes) !== attachment.mimeType ||
      detectImageMimeType(thumbnailBytes) !== attachment.thumbnailMimeType
    ) {
      throw new Error(`Backup attachment format is invalid: ${attachment.fileName}`)
    }

    const thumbnailBlob = new Blob([toArrayBuffer(thumbnailBytes)], {
      type: attachment.thumbnailMimeType,
    })
    restoredMetadata.push({
      id: attachment.id,
      ownerType: attachment.ownerType,
      ownerId: attachment.ownerId,
      purpose: attachment.purpose,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      width: attachment.width,
      height: attachment.height,
      thumbnailBlob,
      thumbnailMimeType: attachment.thumbnailMimeType,
      thumbnailSizeBytes: attachment.thumbnailSizeBytes,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    })
    restoredContents.push({
      attachmentId: attachment.id,
      blob: new Blob([toArrayBuffer(originalBytes)], {
        type: attachment.mimeType,
      }),
    })
  }

  for (const path of files.keys()) {
    if (!expectedPaths.has(path)) {
      throw new Error(`Backup contains an unexpected file: ${path}`)
    }
  }

  return {
    attachments: restoredMetadata,
    attachmentContents: restoredContents,
  }
}

export function getAttachmentArchivePaths(attachmentId: string) {
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(attachmentId)) {
    throw new Error("Attachment ID cannot be used in a backup path.")
  }

  return {
    originalPath: `attachments/${attachmentId}/image.jpg`,
    thumbnailPath: `attachments/${attachmentId}/thumbnail.jpg`,
  }
}

function getOwnerIds(financeData: FinanceBackupDataV1) {
  return {
    account: new Set(financeData.accounts.map((record) => record.id)),
    transaction: new Set(financeData.transactions.map((record) => record.id)),
    bill: new Set(financeData.bills.map((record) => record.id)),
    goal: new Set(financeData.goals.map((record) => record.id)),
    profile: new Set(financeData.settings.map((record) => record.id)),
  } satisfies Record<AttachmentOwnerType, Set<string>>
}

function validateAttachmentOwner(
  attachment: BackupAttachment,
  ownerIds: Record<AttachmentOwnerType, Set<string>>
) {
  if (!ownerIds[attachment.ownerType].has(attachment.ownerId)) {
    throw new Error(`Backup attachment has no matching ${attachment.ownerType}.`)
  }

  if (
    attachment.purpose !== "other" &&
    !PURPOSE_OWNERS[attachment.purpose].includes(attachment.ownerType)
  ) {
    throw new Error("Backup attachment purpose does not match its owner.")
  }
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer
}
