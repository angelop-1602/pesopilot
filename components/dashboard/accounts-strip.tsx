"use client"

import Link from "next/link"
import { RiAddLine, RiWallet3Line } from "@remixicon/react"

import type { Account } from "@/types/finance"
import { AccountWalletTile } from "@/components/dashboard/account-wallet-tile"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AccountsStrip({ accounts }: { accounts: Account[] }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Accounts</h2>
          <p className="text-xs text-muted-foreground">
            Wallets, banks, cards, and loans
          </p>
        </div>
        <Link
          href="/accounts"
          className="text-xs font-semibold text-primary"
        >
          Manage
        </Link>
      </div>
      {accounts.length === 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-white/74 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RiWallet3Line className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                Add your first account
              </p>
              <p className="text-xs text-muted-foreground">
                Start with cash, bank, or e-wallet.
              </p>
            </div>
          </div>
          <Link
            href="/accounts"
            className={cn(
              buttonVariants({ size: "sm" }),
              "shrink-0 rounded-full"
            )}
          >
            <RiAddLine data-icon="inline-start" aria-hidden="true" />
            Add
          </Link>
        </div>
      ) : (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {accounts.map((account) => (
            <AccountWalletTile account={account} key={account.id} />
          ))}
        </div>
      )}
    </section>
  )
}
