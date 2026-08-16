import type {
  FinanceBackup,
  LegacyFinanceBackup,
} from "@/lib/backup/types"
import { createBackupArchive, parseBackupArchive } from "@/lib/backup/archive"
import {
  createAttachmentArchiveBundle,
  restoreAttachmentArchiveData,
} from "@/lib/backup/attachment-archive"
import {
  createEncryptedBackupBlob,
  decryptBackupPayload,
  encryptBackupArchive,
  isEncryptedBackupEnvelope,
} from "@/lib/backup/encryption"
import {
  backupSchema,
  currentBackupSchema,
} from "@/lib/backup/schema"
import { notifyDataChanged } from "@/lib/db/change-events"
import {
  readBackupData,
  replaceBackupData,
  type RuntimeBackupData,
} from "@/lib/db/repositories/backup-data"
import { ensureSeedData } from "@/lib/db/seed"
import { recalculateAccountBalances } from "@/lib/db/services/account-balance-sync"

const MAX_ENCRYPTED_BACKUP_BYTES = 180 * 1024 * 1024

interface FinanceBackupPackage {
  archive: Uint8Array
  backup: FinanceBackup
}

export async function createFinanceBackup(): Promise<FinanceBackup> {
  return (await createFinanceBackupPackage()).backup
}

export async function createEncryptedBackup(password: string) {
  const { archive, backup } = await createFinanceBackupPackage()
  const envelope = await encryptBackupArchive(
    archive,
    backup.exportedAt,
    password
  )

  return {
    backup,
    blob: createEncryptedBackupBlob(envelope),
  }
}

export async function restoreBackupFile(file: File, password?: string) {
  if (file.size > MAX_ENCRYPTED_BACKUP_BYTES) {
    throw new Error("Backup file exceeds the supported size limit.")
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(await file.text()) as unknown
  } catch {
    throw new Error("Backup file is not valid JSON.")
  }

  if (!isEncryptedBackupEnvelope(parsed)) {
    await restoreLegacyFinanceBackup(parsed)
    return
  }

  if (!password) {
    throw new Error("Enter the backup password to restore this file.")
  }

  const decrypted = await decryptBackupPayload(parsed, password)

  if (decrypted.format === "json") {
    await restoreLegacyFinanceBackup(decrypted.value)
    return
  }

  await restoreFinanceBackupArchive(decrypted.value)
}

export async function restoreFinanceBackup(input: unknown) {
  return restoreLegacyFinanceBackup(input)
}

async function createFinanceBackupPackage(): Promise<FinanceBackupPackage> {
  const runtimeData = await readBackupData()
  const { attachments, entries } = createAttachmentArchiveBundle(
    runtimeData.attachments,
    runtimeData.attachmentContents
  )
  const backup: FinanceBackup = {
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    app: "PesoPilot",
    data: {
      accounts: runtimeData.accounts,
      categories: runtimeData.categories,
      transactions: runtimeData.transactions,
      budgets: runtimeData.budgets,
      goals: runtimeData.goals,
      bills: runtimeData.bills,
      settings: runtimeData.settings,
      attachments,
    },
  }

  return {
    backup,
    archive: await createBackupArchive(backup, entries),
  }
}

async function restoreLegacyFinanceBackup(input: unknown) {
  const parsed = backupSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error("Backup file is invalid or from an unsupported version.")
  }

  const backup = parsed.data as LegacyFinanceBackup

  await replaceAndMaintain({
    ...backup.data,
    attachments: [],
    attachmentContents: [],
  })
}

async function restoreFinanceBackupArchive(archive: Uint8Array) {
  const parsedArchive = await parseBackupArchive(archive)
  const parsedManifest = currentBackupSchema.safeParse(parsedArchive.manifest)

  if (!parsedManifest.success) {
    throw new Error("Backup archive manifest is invalid or unsupported.")
  }

  const backup = parsedManifest.data as FinanceBackup
  const { attachments, attachmentContents } = restoreAttachmentArchiveData(
    backup.data,
    backup.data.attachments,
    parsedArchive.files
  )

  await replaceAndMaintain({
    accounts: backup.data.accounts,
    categories: backup.data.categories,
    transactions: backup.data.transactions,
    budgets: backup.data.budgets,
    goals: backup.data.goals,
    bills: backup.data.bills,
    settings: backup.data.settings,
    attachments,
    attachmentContents,
  })
}

async function replaceAndMaintain(data: RuntimeBackupData) {
  // Validation and attachment decoding finish before this atomic replacement,
  // so a malformed archive cannot partially clear the current local database.
  await replaceBackupData(data)
  await ensureSeedData()
  await recalculateAccountBalances()
  notifyDataChanged()
}
