import type {
  AttachmentContent,
  AttachmentMetadata,
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"
import { getDb } from "@/lib/db/client"

export function getAttachmentMetadata(id: string) {
  return getDb().attachments.get(id)
}

export function getAttachmentContent(id: string) {
  return getDb().attachmentContents.get(id)
}

export async function listAttachmentMetadataForOwner(
  ownerType: AttachmentOwnerType,
  ownerId: string
) {
  const attachments = await getDb().attachments
    .where("[ownerType+ownerId]")
    .equals([ownerType, ownerId])
    .toArray()

  return attachments.sort(compareAttachments)
}

export function listAttachmentMetadataForOwnerPurpose(
  ownerType: AttachmentOwnerType,
  ownerId: string,
  purpose: AttachmentPurpose
) {
  return getDb().attachments
    .where("[ownerType+ownerId+purpose]")
    .equals([ownerType, ownerId, purpose])
    .toArray()
}

export function putAttachmentMetadata(attachment: AttachmentMetadata) {
  return getDb().attachments.put(attachment)
}

export function putAttachmentMetadataRecords(
  attachments: readonly AttachmentMetadata[]
) {
  return getDb().attachments.bulkPut([...attachments])
}

export function putAttachmentContent(content: AttachmentContent) {
  return getDb().attachmentContents.put(content)
}

export function putAttachmentContentRecords(
  contents: readonly AttachmentContent[]
) {
  return getDb().attachmentContents.bulkPut([...contents])
}

export function deleteAttachmentMetadataRecords(ids: readonly string[]) {
  return getDb().attachments.bulkDelete([...ids])
}

export function deleteAttachmentContentRecords(ids: readonly string[]) {
  return getDb().attachmentContents.bulkDelete([...ids])
}

function compareAttachments(
  left: AttachmentMetadata,
  right: AttachmentMetadata
) {
  return (
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  )
}
