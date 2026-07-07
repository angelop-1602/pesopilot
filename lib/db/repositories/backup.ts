import type {
  Account,
  AutomaticBackupTarget,
  FinanceBackup,
} from "@/types/finance"
import { backupSchema } from "@/lib/finance/validators"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getDb, nowIso } from "@/lib/db/client"
import { ensureSeedData } from "@/lib/db/seed"
import { recalculateAccountBalances } from "@/lib/db/repositories/transactions"
import {
  createEncryptedBackupBlob,
  decryptBackup,
  encryptBackup,
  isEncryptedBackupEnvelope,
} from "@/lib/finance/encrypted-backup"

const AUTOMATIC_BACKUP_ID = "automatic"
const AUTOMATIC_BACKUP_FILENAME = "pesopilot-auto-backup.ppbackup"

type FilePermissionState = "granted" | "denied" | "prompt"

interface BackupFileHandle {
  createWritable: () => Promise<BackupWritableFile>
  queryPermission?: (
    descriptor: BackupFilePermissionDescriptor
  ) => Promise<FilePermissionState>
  requestPermission?: (
    descriptor: BackupFilePermissionDescriptor
  ) => Promise<FilePermissionState>
}

interface BackupWritableFile {
  write: (data: Blob) => Promise<void>
  close: () => Promise<void>
}

interface BackupFilePermissionDescriptor {
  mode: "readwrite"
}

interface BackupSaveFilePickerOptions {
  suggestedName: string
  types: Array<{
    description: string
    accept: Record<string, string[]>
  }>
}

type BackupPickerWindow = Window & {
  showSaveFilePicker?: (
    options: BackupSaveFilePickerOptions
  ) => Promise<BackupFileHandle>
}

export interface AutomaticBackupStatus {
  supported: boolean
  enabled: boolean
  hasFileHandle: boolean
  lastBackupAt?: string
  lastError?: string
}

export interface AutomaticBackupWriteResult {
  wrote: boolean
  skippedReason?: "disabled" | "missing-file" | "missing-password"
  lastBackupAt?: string
}

export async function createBackup(): Promise<FinanceBackup> {
  const db = getDb()
  const [
    accounts,
    categories,
    transactions,
    budgets,
    goals,
    bills,
    settings,
  ] = await Promise.all([
    db.accounts.toArray(),
    db.categories.toArray(),
    db.transactions.toArray(),
    db.budgets.toArray(),
    db.goals.toArray(),
    db.bills.toArray(),
    db.settings.toArray(),
  ])

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    app: "PesoPilot",
    data: {
      accounts,
      categories,
      transactions,
      budgets,
      goals,
      bills,
      settings,
    },
  }
}

export async function createEncryptedBackup(password: string) {
  const backup = await createBackup()
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

  if (!isEncryptedBackupEnvelope(parsed)) {
    await restoreBackup(parsed)
    return
  }

  if (!password) {
    throw new Error("Enter the backup password to restore this file.")
  }

  await restoreBackup(await decryptBackup(parsed, password))
}

export function isAutomaticBackupSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof (window as BackupPickerWindow).showSaveFilePicker === "function"
  )
}

export async function getAutomaticBackupStatus(): Promise<AutomaticBackupStatus> {
  const target = await getDb().automaticBackups.get(AUTOMATIC_BACKUP_ID)

  return {
    supported: isAutomaticBackupSupported(),
    enabled: target?.enabled ?? false,
    hasFileHandle: Boolean(target?.fileHandle),
    lastBackupAt: target?.lastBackupAt,
    lastError: target?.lastError,
  }
}

export async function enableAutomaticBackup(password: string) {
  if (!isAutomaticBackupSupported()) {
    throw new Error("Automatic file backup is not supported in this browser.")
  }

  const showSaveFilePicker = (window as BackupPickerWindow).showSaveFilePicker

  if (!showSaveFilePicker) {
    throw new Error("Automatic file backup is not supported in this browser.")
  }

  const fileHandle = await showSaveFilePicker({
    suggestedName: AUTOMATIC_BACKUP_FILENAME,
    types: [
      {
        description: "PesoPilot encrypted backup",
        accept: {
          "application/json": [".ppbackup"],
        },
      },
    ],
  })
  const timestamp = nowIso()
  const target: AutomaticBackupTarget = {
    id: AUTOMATIC_BACKUP_ID,
    enabled: true,
    fileHandle,
    encryptionPassword: password,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  await getDb().automaticBackups.put(target)
  return writeAutomaticBackup()
}

export async function disableAutomaticBackup() {
  const db = getDb()
  const existing = await db.automaticBackups.get(AUTOMATIC_BACKUP_ID)

  if (!existing) {
    return
  }

  await db.automaticBackups.put({
    ...existing,
    enabled: false,
    encryptionPassword: undefined,
    lastError: undefined,
    updatedAt: nowIso(),
  })
}

export async function writeAutomaticBackup(): Promise<AutomaticBackupWriteResult> {
  const db = getDb()
  const target = await db.automaticBackups.get(AUTOMATIC_BACKUP_ID)

  if (!target?.enabled) {
    return { wrote: false, skippedReason: "disabled" }
  }

  if (!target.fileHandle) {
    return { wrote: false, skippedReason: "missing-file" }
  }

  if (!target.encryptionPassword) {
    return { wrote: false, skippedReason: "missing-password" }
  }

  const fileHandle = target.fileHandle as BackupFileHandle

  try {
    const permission = await ensureFileWritePermission(fileHandle)

    if (permission !== "granted") {
      throw new Error("Backup file permission was not granted.")
    }

    const { blob } = await createEncryptedBackup(target.encryptionPassword)
    const writable = await fileHandle.createWritable()
    await writable.write(blob)
    await writable.close()

    const lastBackupAt = nowIso()

    await db.automaticBackups.put({
      ...target,
      lastBackupAt,
      lastError: undefined,
      updatedAt: lastBackupAt,
    })

    return { wrote: true, lastBackupAt }
  } catch (error) {
    await db.automaticBackups.put({
      ...target,
      lastError:
        error instanceof Error ? error.message : "Automatic backup failed.",
      updatedAt: nowIso(),
    })
    throw error
  }
}

export async function restoreBackup(input: unknown) {
  const parsed = backupSchema.safeParse(input)

  if (!parsed.success) {
    throw new Error("Backup file is invalid or from an unsupported version.")
  }

  const db = getDb()
  const backup = parsed.data

  await db.transaction(
    "rw",
    [
      db.accounts,
      db.categories,
      db.transactions,
      db.budgets,
      db.goals,
      db.bills,
      db.settings,
    ],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.bills.clear(),
        db.settings.clear(),
      ])

      await Promise.all([
        db.accounts.bulkPut(backup.data.accounts as unknown as Account[]),
        db.categories.bulkPut(backup.data.categories),
        db.transactions.bulkPut(backup.data.transactions),
        db.budgets.bulkPut(backup.data.budgets),
        db.goals.bulkPut(backup.data.goals),
        db.bills.bulkPut(backup.data.bills),
        db.settings.bulkPut(backup.data.settings),
      ])
    }
  )

  await ensureSeedData()
  await recalculateAccountBalances()
  notifyDataChanged()
}

export async function resetLocalData() {
  const db = getDb()

  await db.transaction(
    "rw",
    [
      db.accounts,
      db.categories,
      db.transactions,
      db.budgets,
      db.goals,
      db.bills,
      db.settings,
      db.automaticBackups,
    ],
    async () => {
      await Promise.all([
        db.accounts.clear(),
        db.categories.clear(),
        db.transactions.clear(),
        db.budgets.clear(),
        db.goals.clear(),
        db.bills.clear(),
        db.settings.clear(),
        db.automaticBackups.clear(),
      ])
    }
  )

  await ensureSeedData()
  notifyDataChanged()
}

async function ensureFileWritePermission(fileHandle: BackupFileHandle) {
  const descriptor: BackupFilePermissionDescriptor = { mode: "readwrite" }
  const currentPermission = await fileHandle.queryPermission?.(descriptor)

  if (!currentPermission || currentPermission === "granted") {
    return currentPermission ?? "granted"
  }

  return fileHandle.requestPermission?.(descriptor) ?? "denied"
}
