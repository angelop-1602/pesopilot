"use client"

import { RiArrowDownLine, RiArrowUpLine, RiLineChartLine } from "@remixicon/react"

import { formatPeso } from "@/lib/finance/currency"
import { cn } from "@/lib/utils"

interface QuickSummaryProps {
  expenseCentavos: number
  incomeCentavos: number
  netCentavos: number
}

export function QuickSummary({
  expenseCentavos,
  incomeCentavos,
  netCentavos,
}: QuickSummaryProps) {
  const items = [
    {
      label: "Income",
      value: incomeCentavos,
      icon: RiArrowUpLine,
      tone: "text-emerald-700",
    },
    {
      label: "Spent",
      value: expenseCentavos,
      icon: RiArrowDownLine,
      tone: "text-rose-600",
    },
    {
      label: "Flow",
      value: netCentavos,
      icon: RiLineChartLine,
      tone: netCentavos >= 0 ? "text-primary" : "text-rose-600",
    },
  ]

  return (
    <section className="rounded-[1.65rem] bg-white/76 p-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-3 divide-x divide-border/70">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <div className="min-w-0 px-2 text-center" key={item.label}>
              <span
                className={cn(
                  "mx-auto flex size-8 items-center justify-center rounded-full bg-muted",
                  item.tone
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <p className="mt-2 text-[0.68rem] font-semibold text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 truncate font-mono text-xs font-semibold">
                {formatPeso(item.value)}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
