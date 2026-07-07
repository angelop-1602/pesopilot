"use client"

import Link from "next/link"
import { RiPlaneLine, RiSettings3Line } from "@remixicon/react"

import type { AppSettings } from "@/types/finance"
import { buttonVariants } from "@/components/ui/button"
import { getSettingsDisplayName } from "@/lib/finance/settings"
import { cn } from "@/lib/utils"

export function MobileAppHeader({ settings }: { settings: AppSettings }) {
  const displayName = getSettingsDisplayName(settings)

  return (
    <header className="pt-2">
      <div className="flex items-center justify-between gap-3">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <RiPlaneLine aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[0.7rem] font-semibold uppercase text-muted-foreground">
              PesoPilot
            </span>
            <span className="block truncate font-heading text-lg font-semibold">
              {displayName}
            </span>
          </span>
        </Link>
        <Link
          aria-label="Settings"
          href="/settings"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "rounded-full bg-white/70 shadow-sm"
          )}
        >
          <RiSettings3Line aria-hidden="true" />
        </Link>
      </div>
    </header>
  )
}
