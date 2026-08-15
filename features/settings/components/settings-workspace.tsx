"use client"

import { BackupCard } from "@/features/settings/components/backup/backup-card"
import { LocalStorageCard } from "@/features/settings/components/local-storage-card"
import { ProfileSettingsCard } from "@/features/settings/components/profile-settings-card"
import { PageHeader } from "@/components/shared/page-header"
import { PageError } from "@/components/shared/page-error"
import { PageLoading } from "@/components/shared/page-loading"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function SettingsWorkspace() {
  const { data, error, isLoading } = useFinanceData()

  if (isLoading) {
    return <PageLoading label="Loading settings" />
  }

  if (error) {
    return <PageError title="Unable to load settings" />
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        description="Profile, backup, and PWA storage controls."
      />
      <ProfileSettingsCard
        key={data.settings.updatedAt}
        settings={data.settings}
      />
      <BackupCard />
      <LocalStorageCard />
    </div>
  )
}
