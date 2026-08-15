import type { AutomaticBackupTarget } from "@/lib/backup/types"
import type {
  AutomaticBackupStatus,
  AutomaticBackupWriteResult,
  BackupFileHandle,
  BackupFilePermissionDescriptor,
  BackupPickerWindow,
} from "@/features/settings/types/backup"
import { createEncryptedBackup } from "@/features/settings/services/finance-backup"
import { nowIso } from "@/lib/db/client"
import {
  AUTOMATIC_BACKUP_ID,
  getAutomaticBackupTarget,
  putAutomaticBackupTarget,
  updateAutomaticBackupTarget,
} from "@/lib/db/repositories/automatic-backups"
import { assertBackupPassword } from "@/lib/backup/encryption"

const AUTOMATIC_BACKUP_FILENAME = "pesopilot-auto-backup.ppbackup"
const disabledBackupResult: AutomaticBackupWriteResult = {
  wrote: false,
  skippedReason: "disabled",
}

let automaticBackupWriteQueue = Promise.resolve(disabledBackupResult)
let automaticBackupWriteQueued = false

export function isAutomaticBackupSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof (window as BackupPickerWindow).showSaveFilePicker === "function"
  )
}

export async function getAutomaticBackupStatus(): Promise<AutomaticBackupStatus> {
  const target = await getAutomaticBackupTarget()

  return {
    supported: isAutomaticBackupSupported(),
    enabled: target?.enabled ?? false,
    hasFileHandle: Boolean(target?.fileHandle),
    lastBackupAt: target?.lastBackupAt,
    lastError: target?.lastError,
  }
}

export async function enableAutomaticBackup(password: string) {
  assertBackupPassword(password)

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

  await putAutomaticBackupTarget(target)
  return writeAutomaticBackup()
}

export async function disableAutomaticBackup() {
  const existing = await getAutomaticBackupTarget()

  if (!existing) {
    return
  }

  await updateAutomaticBackupTarget(
    {
      enabled: false,
      encryptionPassword: undefined,
      lastError: undefined,
      updatedAt: nowIso(),
    },
    existing.updatedAt
  )
}

export function writeAutomaticBackup(): Promise<AutomaticBackupWriteResult> {
  // Coalesce calls waiting to start and allow at most one follow-up while a
  // file write is active, so the same handle is never written concurrently.
  if (automaticBackupWriteQueued) {
    return automaticBackupWriteQueue
  }

  automaticBackupWriteQueued = true
  automaticBackupWriteQueue = automaticBackupWriteQueue
    .catch(() => disabledBackupResult)
    .then(async () => {
      automaticBackupWriteQueued = false
      return writeAutomaticBackupOnce()
    })

  return automaticBackupWriteQueue
}

async function writeAutomaticBackupOnce(): Promise<AutomaticBackupWriteResult> {
  const target = await getAutomaticBackupTarget()

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

    await updateAutomaticBackupTarget(
      {
        lastBackupAt,
        lastError: undefined,
        updatedAt: lastBackupAt,
      },
      target.updatedAt
    )

    return { wrote: true, lastBackupAt }
  } catch (error) {
    await updateAutomaticBackupTarget(
      {
        lastError:
          error instanceof Error ? error.message : "Automatic backup failed.",
        updatedAt: nowIso(),
      },
      target.updatedAt
    )
    throw error
  }
}

async function ensureFileWritePermission(fileHandle: BackupFileHandle) {
  const descriptor: BackupFilePermissionDescriptor = { mode: "readwrite" }
  const currentPermission = await fileHandle.queryPermission?.(descriptor)

  if (!currentPermission || currentPermission === "granted") {
    return currentPermission ?? "granted"
  }

  return fileHandle.requestPermission?.(descriptor) ?? "denied"
}
