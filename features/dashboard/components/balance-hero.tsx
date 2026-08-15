"use client"

import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiBillLine,
  RiShieldCheckLine,
  RiWallet3Line,
} from "@remixicon/react"

import { formatPeso } from "@/lib/finance/currency"

interface BalanceHeroProps {
  availableCentavos: number
  committedCentavos: number
  monthLabel: string
  netWorthCentavos: number
  safeToSpendCentavos: number
}

export function BalanceHero({
  availableCentavos,
  committedCentavos,
  monthLabel,
  netWorthCentavos,
  safeToSpendCentavos,
}: BalanceHeroProps) {
  const netPositive = netWorthCentavos >= 0

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,oklch(0.24_0.08_165),oklch(0.31_0.11_175)_48%,oklch(0.21_0.07_225))] p-5 text-white shadow-[0_22px_60px_rgba(6,78,59,0.24)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0_1px,transparent_1px_18px)] opacity-35" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-white/68">Net worth</p>
          <h1 className="mt-2 break-words font-mono text-[2.35rem] font-semibold leading-none">
            {formatPeso(netWorthCentavos)}
          </h1>
          <p className="mt-3 text-xs text-white/70">{monthLabel}</p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/14 text-white/90">
          {netPositive ? (
            <RiArrowUpLine className="size-5" aria-hidden="true" />
          ) : (
            <RiArrowDownLine className="size-5" aria-hidden="true" />
          )}
        </span>
      </div>
      <div className="relative mt-7 rounded-[1.35rem] bg-white/16 p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-white/72">
          <RiShieldCheckLine className="size-4" aria-hidden="true" />
          Safe to Spend
        </p>
        <p className="mt-2 break-words font-mono text-[1.8rem] font-semibold leading-none">
          {formatPeso(safeToSpendCentavos)}
        </p>
        <p className="mt-2 text-[0.7rem] text-white/68">
          Available after this month&apos;s unpaid bills
        </p>
      </div>
      <div className="relative mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[1.25rem] bg-white/12 p-3">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-white/68">
            <RiWallet3Line className="size-3.5" aria-hidden="true" />
            Available assets
          </p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">
            {formatPeso(availableCentavos)}
          </p>
        </div>
        <div className="rounded-[1.25rem] bg-white/12 p-3">
          <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-white/68">
            <RiBillLine className="size-3.5" aria-hidden="true" />
            Committed
          </p>
          <p className="mt-1 truncate font-mono text-sm font-semibold">
            {formatPeso(committedCentavos)}
          </p>
        </div>
      </div>
    </section>
  )
}
