import type { AppSettings } from "@/types/finance"
import { getDb } from "@/lib/db/client"
import { SETTINGS_ID } from "@/lib/db/constants"

export async function getSettingsRecord() {
  return getDb().settings.get(SETTINGS_ID)
}

export async function putSettingsRecord(settings: AppSettings) {
  await getDb().settings.put(settings)
}
