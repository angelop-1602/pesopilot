"use client"

import {
  RiBillLine,
  RiCalendarCheckLine,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react"
import { toast } from "sonner"

import type {
  Account,
  BillOccurrence,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import { BillDialog } from "@/features/bills/components/bill-dialog"
import { getBillPaymentFormValues } from "@/features/bills/utils/bill-payment-form-values"
import { TransactionDialog } from "@/features/transactions"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { deleteBill } from "@/features/bills/services/bill-commands"
import { formatPeso } from "@/lib/finance/currency"
import { formatShortDate } from "@/lib/finance/dates"

interface BillRowProps {
  accounts: Account[]
  budgets: MonthlyBudget[]
  categories: Category[]
  occurrence: BillOccurrence
  transactions: Transaction[]
}

export function BillRow({
  accounts,
  budgets,
  categories,
  occurrence,
  transactions,
}: BillRowProps) {
  const { bill, dueDate, status } = occurrence
  const account = accounts.find((item) => item.id === bill.accountId)
  const category = categories.find((item) => item.id === bill.categoryId)
  const isPaid = status === "paid"

  return (
    <div className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RiBillLine className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{bill.name}</p>
            <Badge
              variant={
                status === "paid"
                  ? "default"
                  : status === "overdue"
                    ? "destructive"
                    : "secondary"
              }
            >
              {status === "paid"
                ? "Paid"
                : status === "overdue"
                  ? "Overdue"
                  : "Pending"}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Due {formatShortDate(dueDate)}
            {bill.autopay ? " - autopay" : ""}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {account?.displayName ?? "No account"}{" "}
            {category ? `- ${category.name}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <BillDialog
              accounts={accounts}
              bill={bill}
              categories={categories}
              trigger={
                <Button
                  aria-label={`Edit ${bill.name}`}
                  className="rounded-full"
                  size="icon-sm"
                  variant="ghost"
                >
                  <RiEditLine aria-hidden="true" />
                </Button>
              }
            />
            <ConfirmDialog
              title="Delete recurring bill?"
              description="Existing transactions stay untouched. Only this recurring reminder is removed."
              confirmLabel="Delete"
              trigger={
                <Button
                  aria-label={`Delete ${bill.name}`}
                  className="rounded-full"
                  size="icon-sm"
                  variant="ghost"
                >
                  <RiDeleteBinLine aria-hidden="true" />
                </Button>
              }
              onConfirm={async () => {
                await deleteBill(bill.id)
                toast.success("Bill deleted")
              }}
            />
          </div>
        </div>
        <p className="min-w-[6rem] text-right font-mono text-sm font-semibold">
          {formatPeso(bill.amountCentavos)}
        </p>
      </div>
      {isPaid ? (
        <Button
          className="mt-3 w-full rounded-full"
          disabled
          variant="outline"
        >
          <RiCalendarCheckLine data-icon="inline-start" aria-hidden="true" />
          Paid {formatPeso(occurrence.paidAmountCentavos)}
        </Button>
      ) : (
        <TransactionDialog
          accounts={accounts}
          bills={[bill]}
          budgets={budgets}
          categories={categories}
          description="Review the actual amount, account, budget, payment date, and notes before saving."
          initialValues={getBillPaymentFormValues(
            bill,
            dueDate,
            accounts,
            budgets
          )}
          lockedBillId={bill.id}
          lockedType
          title={`Pay ${bill.name}`}
          transactions={transactions}
          trigger={
            <Button className="mt-3 w-full rounded-full" variant="outline">
              <RiCalendarCheckLine
                data-icon="inline-start"
                aria-hidden="true"
              />
              Pay bill
            </Button>
          }
        />
      )}
    </div>
  )
}
