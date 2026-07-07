"use client"

import { RiAddLine } from "@remixicon/react"

import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Button } from "@/components/ui/button"
import type { Account, Bill, Category } from "@/types/finance"

interface FloatingActionButtonProps {
  accounts: Account[]
  bills: Bill[]
  categories: Category[]
}

export function FloatingActionButton({
  accounts,
  bills,
  categories,
}: FloatingActionButtonProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.8rem)] z-40">
      <div className="mx-auto flex w-full max-w-[480px] justify-center">
        <TransactionDialog
          accounts={accounts}
          bills={bills}
          categories={categories}
          trigger={
            <Button
              aria-label="Add transaction"
              className="pointer-events-auto size-14 rounded-full border border-white/40 bg-primary text-primary-foreground shadow-[0_16px_36px_rgba(4,120,87,0.34)]"
              size="icon"
            >
              <RiAddLine aria-hidden="true" />
            </Button>
          }
        />
      </div>
    </div>
  )
}
