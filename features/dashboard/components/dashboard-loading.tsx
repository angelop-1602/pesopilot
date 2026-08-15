import type { AppSettings } from "@/types/finance"
import { PageLoading } from "@/components/shared/page-loading"
import { MobileAppHeader } from "@/features/dashboard/components/mobile-app-header"

export function DashboardLoading({ settings }: { settings: AppSettings }) {
  return (
    <div className="flex flex-col gap-5">
      <MobileAppHeader settings={settings} />
      <PageLoading label="Loading dashboard" sections={4} />
    </div>
  )
}
