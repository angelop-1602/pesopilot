import assert from "node:assert/strict"
import { test } from "node:test"
import { createJiti } from "jiti"

const jiti = createJiti(import.meta.url, { tsconfigPaths: true })
const {
  decryptBackupPayload,
  encryptBackup,
  encryptBackupArchive,
  isEncryptedBackupEnvelope,
} = jiti("./encryption.ts")

const exportedAt = "2026-08-16T00:00:00.000Z"
const password = "secure-backup-password"

test("legacy JSON backups remain decryptable", async () => {
  const backup = {
    schemaVersion: 1,
    exportedAt,
    app: "PesoPilot",
    data: {
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      goals: [],
      bills: [],
      settings: [],
    },
  }
  const envelope = await encryptBackup(backup, password)
  const payload = await decryptBackupPayload(envelope, password)

  assert.equal(payload.format, "json")
  assert.deepEqual(payload.value, backup)
})

test("binary backup archives remain binary through encryption", async () => {
  const archive = new Uint8Array([0x50, 0x4b, 1, 2, 3, 4])
  const envelope = await encryptBackupArchive(archive, exportedAt, password)
  const payload = await decryptBackupPayload(envelope, password)

  assert.equal(envelope.version, 2)
  assert.equal(payload.format, "zip")
  assert.deepEqual(payload.value, archive)
  assert.equal(isEncryptedBackupEnvelope(envelope), true)
  assert.equal(
    isEncryptedBackupEnvelope({
      ...envelope,
      kdf: { ...envelope.kdf, iterations: Number.MAX_SAFE_INTEGER },
    }),
    false
  )
})
