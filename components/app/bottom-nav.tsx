"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { PRIMARY_NAVIGATION } from "@/lib/constants/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)]">
      <div className="mx-auto grid h-16 max-w-[480px] grid-cols-4 gap-1 rounded-t-[1.75rem] border border-b-0 border-white/70 bg-background/90 px-2 pt-2 shadow-[0_-18px_42px_rgba(15,23,42,0.12)] backdrop-blur supports-backdrop-filter:bg-background/80">
        {PRIMARY_NAVIGATION.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-11 flex-col items-center justify-center gap-0.5 rounded-full text-[0.625rem] font-semibold text-muted-foreground transition-colors",
                active && "bg-primary/10 text-primary"
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
