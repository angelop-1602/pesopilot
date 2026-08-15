import type { AppSettings } from "@/types/finance"
import { PageError } from "@/components/shared/page-error"
import { MobileAppHeader } from "@/features/dashboard/components/mobile-app-header"

export function DashboardError({ settings }: { settings: AppSettings }) {
  return (
    <div className="flex flex-col gap-5">
      <MobileAppHeader settings={settings} />
      <PageError title="Unable to load your dashboard" />
    </div>
  )
}
