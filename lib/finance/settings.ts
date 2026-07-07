import type { AppSettings } from "@/types/finance"

export function getSettingsDisplayName(settings: AppSettings) {
  return settings.displayName?.trim() || settings.appName
}
