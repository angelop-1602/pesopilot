"use client"

import { RiArrowDownLine, RiArrowUpLine, RiShieldCheckLine } from "@remixicon/react"

import { formatPeso } from "@/lib/finance/currency"
import { cn } from "@/lib/utils"

interface BalanceHeroProps {
  availableCentavos: number
  debtCentavos: number
  monthLabel: string
  netWorthCentavos: number
}

export function BalanceHero({
  availableCentavos,
  debtCentavos,
  monthLabel,
  netWorthCentavos,
}: BalanceHeroProps) {
  const netPositive = netWorthCentavos >= 0

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,oklch(0.24_0.08_165),oklch(0.31_0.11_175)_48%,oklch(0.21_0.07_225))] p-5 text-white shadow-[0_22px_60px_rgba(6,78,59,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0_1px,transparent_1px_18px)] opacity-35" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-white/68">Total balance</p>
          <h1 className="mt-2 break-words font-mono text-[2.35rem] font-semibold leading-none">
            {formatPeso(netWorthCentavos)}
          </h1>
          <p className="mt-3 text-xs text-white/70">{monthLabel}</p>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-white/14",
            netPositive ? "text-emerald-100" : "text-rose-100"
          )}
        >
          {netPositive ? (
            <RiArrowUpLine className="size-5" aria-hidden="true" />
          ) : (
            <RiArrowDownLine className="size-5" aria-hidden="true" />
          )}
        </span>
      </div>
      <div className="relative mt-7 grid grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] bg-white/12 p-3">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-white/68">
            <RiShieldCheckLine className="size-3.5" aria-hidden="true" />
            Available
          </p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">
            {formatPeso(availableCentavos)}
          </p>
        </div>
        <div className="rounded-[1.25rem] bg-white/12 p-3">
          <p className="text-[0.7rem] font-medium text-white/68">Debt</p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">
            {formatPeso(debtCentavos)}
          </p>
        </div>
      </div>
    </section>
  )
}
