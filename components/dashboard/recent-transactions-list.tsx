"use client"

import Link from "next/link"
import {
  RiArrowDownLine,
  RiArrowLeftRightLine,
  RiArrowUpLine,
  RiFileList3Line,
} from "@remixicon/react"

import type { Account, Category, Transaction } from "@/types/finance"
import { formatPeso } from "@/lib/finance/currency"
import { formatShortDate } from "@/lib/finance/dates"
import { cn } from "@/lib/utils"

interface RecentTransactionsListProps {
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
}

export function RecentTransactionsList({
  accounts,
  categories,
  transactions,
}: RecentTransactionsListProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold">Recent</h2>
          <p className="text-xs text-muted-foreground">Latest money movement</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-primary"
        >
          See all
        </Link>
      </div>
      {transactions.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[1.4rem] bg-white/72 p-4 text-sm text-muted-foreground shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <RiFileList3Line className="size-5" aria-hidden="true" />
          </span>
          <span>No transactions yet.</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {transactions.map((transaction, index) => (
            <TransactionRow
              accounts={accounts}
              categories={categories}
              isLast={index === transactions.length - 1}
              key={transaction.id}
              transaction={transaction}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function TransactionRow({
  accounts,
  categories,
  isLast,
  transaction,
}: {
  accounts: Account[]
  categories: Category[]
  isLast: boolean
  transaction: Transaction
}) {
  const account = accounts.find((item) => item.id === transaction.accountId)
  const transferAccount = accounts.find(
    (item) => item.id === transaction.transferAccountId
  )
  const category = categories.find((item) => item.id === transaction.categoryId)
  const Icon =
    transaction.type === "income"
      ? RiArrowUpLine
      : transaction.type === "transfer"
        ? RiArrowLeftRightLine
        : RiArrowDownLine
  const amountPrefix =
    transaction.type === "income"
      ? "+"
      : transaction.type === "expense"
        ? "-"
        : ""
  const detail =
    transaction.type === "transfer"
      ? `${account?.displayName ?? "Account"} to ${transferAccount?.displayName ?? "Account"}`
      : `${account?.displayName ?? "Account"}${category ? ` - ${category.name}` : ""}`

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        !isLast && "border-b border-border/70"
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full",
          transaction.type === "expense"
            ? "bg-rose-50 text-rose-600"
            : transaction.type === "income"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-600"
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {transaction.description}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {formatShortDate(transaction.date)} - {detail}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 font-mono text-sm font-semibold",
          transaction.type === "expense" && "text-destructive",
          transaction.type === "income" && "text-primary"
        )}
      >
        {amountPrefix}
        {formatPeso(transaction.amountCentavos)}
      </p>
    </div>
  )
}
