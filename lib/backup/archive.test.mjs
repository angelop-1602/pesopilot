import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  assertSafeArchivePath,
  createBackupArchive,
  parseBackupArchive,
} = jiti("./archive.ts")

test("backup archives preserve manifests and binary attachments", async () => {
  const bytes = await createBackupArchive(
    { schemaVersion: 2, app: "PesoPilot" },
    [
      {
        path: "attachments/attachment-1/image.webp",
        blob: new Blob([new Uint8Array([1, 2, 3])], {
          type: "image/webp",
        }),
      },
    ]
  )
  const parsed = await parseBackupArchive(bytes)

  assert.deepEqual(parsed.manifest, {
    schemaVersion: 2,
    app: "PesoPilot",
  })
  assert.deepEqual(
    [...parsed.files.get("attachments/attachment-1/image.webp")],
    [1, 2, 3]
  )
})

test("backup archive paths reject traversal, absolute, and duplicate entries", async () => {
  assert.throws(() => assertSafeArchivePath("../private.txt"), /unsafe/)
  assert.throws(() => assertSafeArchivePath("/private.txt"), /unsafe/)
  assert.throws(() => assertSafeArchivePath("C:/private.txt"), /unsafe/)
  assert.throws(() => assertSafeArchivePath("folder\\private.txt"), /unsafe/)

  await assert.rejects(
    createBackupArchive({}, [
      { path: "attachments/a/image.webp", blob: new Blob(["one"]) },
      { path: "attachments/a/image.webp", blob: new Blob(["two"]) },
    ]),
    /duplicate/
  )
})
