import type { AppSettings } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { nowIso } from "@/lib/db/client"
import { SETTINGS_ID } from "@/lib/db/constants"
import {
  getSettingsRecord,
  putSettingsRecord,
} from "@/lib/db/repositories/settings"
import { createDefaultSettings } from "@/lib/db/seed"

export async function saveDisplayName(displayName: string): Promise<AppSettings> {
  const current = (await getSettingsRecord()) ?? createDefaultSettings()
  const next: AppSettings = {
    ...current,
    id: SETTINGS_ID,
    displayName: displayName.trim(),
    currency: "PHP",
    locale: "en-PH",
    timezone: "Asia/Manila",
    updatedAt: nowIso(),
  }

  await putSettingsRecord(next)
  notifyDataChanged()
  return next
}
