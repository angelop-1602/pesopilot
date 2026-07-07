import type { AppSettings } from "@/types/finance"
import { notifyDataChanged } from "@/lib/db/change-events"
import { getDb, nowIso } from "@/lib/db/client"
import { SETTINGS_ID, createDefaultSettings } from "@/lib/db/seed"

export async function getSettings() {
  const db = getDb()
  return (await db.settings.get(SETTINGS_ID)) ?? createDefaultSettings()
}

export async function updateSettings(values: Partial<AppSettings>) {
  const db = getDb()
  const current = await getSettings()
  const next: AppSettings = {
    ...current,
    ...values,
    id: SETTINGS_ID,
    currency: "PHP",
    locale: "en-PH",
    timezone: "Asia/Manila",
    updatedAt: nowIso(),
  }

  await db.settings.put(next)
  notifyDataChanged()
  return next
}
