import type { FinanceBackup } from "@/lib/backup/types"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  readBackupData,
  replaceBackupData,
} from "@/lib/db/repositories/backup-data"
import { ensureSeedData } from "@/lib/db/seed"
import { recalculateAccountBalances } from "@/lib/db/services/account-balance-sync"
import {
  createEncryptedBackupBlob,
  decryptBackup,
  encryptBackup,
  isEncryptedBackupEnvelope,
} from "@/lib/backup/encryption"
import { backupSchema } from "@/lib/backup/schema"

export async function createFinanceBackup(): Promise<FinanceBackup> {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "PesoPilot",
    data: await readBackupData(),
  }
}

export async function createEncryptedBackup(password: string) {
  const backup = await createFinanceBackup()
  const envelope = await encryptBackup(backup, password)

  return {
    backup,
    blob: createEncryptedBackupBlob(envelope),
  }
}

export async function restoreBackupFile(file: File, password?: string) {
  let parsed: unknown

  try {
    parsed = JSON.parse(await file.text()) as unknown
  } catch {
    throw new Error("Backup file is not valid JSON.")
  }

  if (isEncryptedBackupEnvelope(parsed)) {
    if (!password) {
      throw new Error("Enter the backup password to restore this file.")
    }

    await restoreFinanceBackup(await decryptBackup(parsed, password))
    return
  }

  await restoreFinanceBackup(parsed)
}

export async function restoreFinanceBackup(input: unknown) {
  const parsed = backupSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error("Backup file is invalid or from an unsupported version.")
  }

  // The validator intentionally accepts legacy account rows with fields that
  // became required later. Seed maintenance normalizes those rows after import.
  const backup = parsed.data as FinanceBackup

  await replaceBackupData(backup.data)
  await ensureSeedData()
  await recalculateAccountBalances()
  notifyDataChanged()
}
