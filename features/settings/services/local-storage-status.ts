import { getDb } from "@/lib/db/client"

export interface LocalStorageStatus {
  attachmentBytes: number
  attachmentCount: number
  persisted: boolean | null
  quotaBytes: number | null
  storageApiSupported: boolean
  usageBytes: number | null
}

export async function getLocalStorageStatus(): Promise<LocalStorageStatus> {
  const attachments = await getDb().attachments.toArray()
  const storage =
    typeof navigator === "undefined" ? undefined : navigator.storage
  const storageApiSupported = Boolean(storage?.estimate)

  const estimate = storage?.estimate
    ? await storage.estimate()
    : { quota: undefined, usage: undefined }
  const persisted = storage?.persisted
    ? await storage.persisted()
    : null

  return {
    attachmentBytes: attachments.reduce(
      (total, attachment) =>
        total + attachment.sizeBytes + attachment.thumbnailSizeBytes,
      0
    ),
    attachmentCount: attachments.length,
    persisted,
    quotaBytes: estimate.quota ?? null,
    storageApiSupported,
    usageBytes: estimate.usage ?? null,
  }
}

export async function requestPersistentLocalStorage() {
  const storage =
    typeof navigator === "undefined" ? undefined : navigator.storage

  if (!storage?.persist) {
    return false
  }

  return storage.persist()
}
