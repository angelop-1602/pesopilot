"use client"

import Link from "next/link"
import { RiPlaneLine, RiSettings3Line } from "@remixicon/react"

import type { AppSettings } from "@/types/finance"
import { buttonVariants } from "@/components/ui/button"
import { getSettingsDisplayName } from "@/lib/finance/settings"
import { cn } from "@/lib/utils"

export function TopBar({ settings }: { settings: AppSettings }) {
  const displayName = getSettingsDisplayName(settings)

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex min-h-14 w-full max-w-[480px] items-center gap-2 px-4">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <RiPlaneLine aria-hidden="true" />
          </span>
          <span className="truncate font-heading text-sm font-semibold">
            {displayName}
          </span>
        </Link>
        <Link
          aria-label="Settings"
          href="/settings"
          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
        >
          <RiSettings3Line aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
