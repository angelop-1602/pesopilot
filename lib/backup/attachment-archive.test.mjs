import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  createAttachmentArchiveBundle,
  getAttachmentArchivePaths,
  restoreAttachmentArchiveData,
} = jiti("./attachment-archive.ts")

const timestamp = "2026-08-16T00:00:00.000Z"
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])
const paths = getAttachmentArchivePaths("attachment-1")
const financeData = {
  accounts: [{ id: "account-1" }],
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  bills: [],
  settings: [],
}
const metadata = {
  id: "attachment-1",
  ownerType: "account",
  ownerId: "account-1",
  purpose: "account_image",
  fileName: "account.jpg",
  mimeType: "image/jpeg",
  sizeBytes: jpegBytes.byteLength,
  width: 1,
  height: 1,
  thumbnailBlob: new Blob([jpegBytes], { type: "image/jpeg" }),
  thumbnailMimeType: "image/jpeg",
  thumbnailSizeBytes: jpegBytes.byteLength,
  createdAt: timestamp,
  updatedAt: timestamp,
}

test("attachment archive data round-trips metadata and binary images", async () => {
  const bundle = createAttachmentArchiveBundle(
    [metadata],
    [{ attachmentId: metadata.id, blob: new Blob([jpegBytes]) }]
  )
  const files = new Map(
    await Promise.all(
      bundle.entries.map(async (entry) => [
        entry.path,
        new Uint8Array(await entry.blob.arrayBuffer()),
      ])
    )
  )
  const restored = restoreAttachmentArchiveData(
    financeData,
    bundle.attachments,
    files
  )

  assert.equal(restored.attachments.length, 1)
  assert.equal(restored.attachments[0].ownerId, "account-1")
  assert.equal(restored.attachments[0].thumbnailBlob.type, "image/jpeg")
  assert.deepEqual(
    new Uint8Array(await restored.attachmentContents[0].blob.arrayBuffer()),
    jpegBytes
  )
})

test("attachment restore rejects orphan owners and unexpected files", () => {
  const attachment = {
    ...metadata,
    thumbnailBlob: undefined,
    ...paths,
  }
  const files = new Map([
    [paths.originalPath, jpegBytes],
    [paths.thumbnailPath, jpegBytes],
    ["attachments/unexpected/image.jpg", jpegBytes],
  ])

  assert.throws(
    () =>
      restoreAttachmentArchiveData(
        financeData,
        [{ ...attachment, ownerId: "missing-account" }],
        files
      ),
    /no matching account/
  )
  assert.throws(
    () => restoreAttachmentArchiveData(financeData, [attachment], files),
    /unexpected file/
  )
})
