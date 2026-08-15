import type { AutomaticBackupTarget } from "@/lib/backup/types"
import { getDb } from "@/lib/db/client"

export const AUTOMATIC_BACKUP_ID = "automatic"

export function getAutomaticBackupTarget() {
  return getDb().automaticBackups.get(AUTOMATIC_BACKUP_ID)
}

export function putAutomaticBackupTarget(target: AutomaticBackupTarget) {
  return getDb().automaticBackups.put(target)
}

export async function updateAutomaticBackupTarget(
  changes: Partial<Omit<AutomaticBackupTarget, "id">>,
  expectedUpdatedAt: string
) {
  const db = getDb()

  return db.transaction("rw", db.automaticBackups, async () => {
    const current = await db.automaticBackups.get(AUTOMATIC_BACKUP_ID)

    if (!current || current.updatedAt !== expectedUpdatedAt) {
      return false
    }

    await db.automaticBackups.update(AUTOMATIC_BACKUP_ID, changes)
    return true
  })
}
