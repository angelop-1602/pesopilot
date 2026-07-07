"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { PRIMARY_NAVIGATION } from "@/lib/constants/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()
  const leadingItems = PRIMARY_NAVIGATION.slice(0, 2)
  const trailingItems = PRIMARY_NAVIGATION.slice(2)

  const renderNavItem = (item: (typeof PRIMARY_NAVIGATION)[number]) => {
    const active =
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    const Icon = item.icon

    return (
      <Link
        key={item.href}
        aria-current={active ? "page" : undefined}
        aria-label={item.label}
        href={item.href}
        className="group flex h-14 min-w-0 items-center justify-center rounded-2xl outline-none transition-transform duration-200 ease-out focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span
          className={cn(
            "flex min-h-11 min-w-11 max-w-full flex-col items-center justify-center gap-0.5 rounded-full px-1 py-1.5 text-[11px] font-semibold leading-none text-muted-foreground transition-[color,background-color,transform] duration-200 ease-out group-hover:text-foreground group-active:scale-95",
            active && "bg-primary/10 text-primary group-hover:text-primary"
          )}
        >
          <Icon
            className="size-5 shrink-0 transition-transform duration-200 ease-out"
            aria-hidden="true"
          />
          <span className="max-w-full truncate">{item.label}</span>
        </span>
      </Link>
    )
  }

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-30 overflow-x-clip px-1.5 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto h-[4.5rem] w-full max-w-[480px] rounded-t-[1.5rem] border border-b-0 border-border/80 bg-card px-1.5 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
        <div className="grid h-full grid-cols-5 items-center gap-x-2">
          {leadingItems.map(renderNavItem)}
          <div aria-hidden="true" className="pointer-events-none min-w-0" />
          {trailingItems.map(renderNavItem)}
        </div>
      </div>
    </nav>
  )
}
