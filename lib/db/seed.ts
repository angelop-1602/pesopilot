import type { AppSettings } from "@/types/finance"
import { DEFAULT_CATEGORIES } from "@/lib/constants/categories"
import { migrateAccountsToProductModel } from "@/lib/db/repositories/accounts"
import { getDb, nowIso } from "@/lib/db/client"

export const SETTINGS_ID = "local"

export function createDefaultSettings(): AppSettings {
  const now = nowIso()

  return {
    id: SETTINGS_ID,
    appName: "PesoPilot",
    displayName: "",
    currency: "PHP",
    locale: "en-PH",
    timezone: "Asia/Manila",
    budgetMethod: "zero-based",
    showInstallTips: true,
    createdAt: now,
    updatedAt: now,
  }
}

export async function ensureSeedData() {
  const db = getDb()

  await db.transaction("rw", db.accounts, db.categories, db.settings, async () => {
    const categoryCount = await db.categories.count()
    const settings = await db.settings.get(SETTINGS_ID)

    if (categoryCount === 0) {
      await db.categories.bulkPut(DEFAULT_CATEGORIES)
    }

    if (!settings) {
      await db.settings.put(createDefaultSettings())
    }
  })

  await migrateAccountsToProductModel()
}
