"use client"

import { RiAlertLine, RiBankCardLine } from "@remixicon/react"

import type {
  Account,
  Bill,
  Category,
  MonthlyBudget,
  Transaction,
} from "@/types/finance"
import type { CreditCardStatementSummary } from "@/lib/finance/credit-card-statements"
import { getCreditCardPaymentFormValues } from "@/features/budget/utils/credit-card-payment-form-values"
import { TransactionDialog } from "@/features/transactions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatPeso } from "@/lib/finance/currency"
import { formatShortDate } from "@/lib/finance/dates"

interface CreditCardRowProps {
  accounts: Account[]
  bills: Bill[]
  budgets: MonthlyBudget[]
  categories: Category[]
  sourceAccounts: Account[]
  summary: CreditCardStatementSummary
  transactions: Transaction[]
}

const statusLabels = {
  "no-statement": "No statement",
  pending: "Pending",
  "due-soon": "Due soon",
  "due-today": "Due today",
  overdue: "Overdue",
  paid: "Paid",
} as const

export function CreditCardRow({
  accounts,
  bills,
  budgets,
  categories,
  sourceAccounts,
  summary,
  transactions,
}: CreditCardRowProps) {
  const { account } = summary
  const utilization = summary.utilizationPercent
  const utilizationWarning =
    summary.isOverLimit || (utilization !== undefined && utilization >= 80)
  const statusIsUrgent =
    summary.status === "overdue" || summary.status === "due-today"

  return (
    <article className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RiBankCardLine className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">
              {account.displayName}
            </h3>
            <Badge
              variant={statusIsUrgent ? "destructive" : "secondary"}
            >
              {statusLabels[summary.status]}
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {summary.dueDate
              ? `Payment due ${formatShortDate(summary.dueDate)}`
              : "Add a statement day and payment due day in Accounts."}
          </p>
        </div>
        <div className="min-w-[6.5rem] text-right">
          <p className="font-mono text-sm font-semibold text-destructive">
            {formatPeso(summary.currentBalanceCentavos)}
          </p>
          <p className="mt-0.5 text-[0.68rem] font-semibold text-muted-foreground">
            Current balance
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl bg-muted/55 p-2.5">
          <p className="text-muted-foreground">Statement remaining</p>
          <p className="mt-1 font-mono font-semibold">
            {formatPeso(summary.remainingStatementBalanceCentavos)}
          </p>
        </div>
        <div className="rounded-xl bg-muted/55 p-2.5">
          <p className="text-muted-foreground">Available credit</p>
          <p className="mt-1 font-mono font-semibold">
            {summary.availableCreditCentavos === undefined
              ? "Not set"
              : formatPeso(summary.availableCreditCentavos)}
          </p>
        </div>
      </div>

      {summary.creditLimitCentavos !== undefined && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span>
              {utilization === undefined
                ? "Credit utilization"
                : `${Math.round(utilization)}% utilized`}
            </span>
            <span>{formatPeso(summary.creditLimitCentavos)} limit</span>
          </div>
          <Progress
            aria-label={`${account.displayName} credit utilization`}
            className="mt-2"
            value={Math.min(utilization ?? 0, 100)}
          />
        </div>
      )}

      {utilizationWarning && (
        <Alert className="mt-3" variant="destructive">
          <RiAlertLine aria-hidden="true" />
          <AlertTitle>
            {summary.isOverLimit ? "Credit limit exceeded" : "High utilization"}
          </AlertTitle>
          <AlertDescription>
            {summary.isOverLimit
              ? `This card is ${formatPeso(
                  summary.currentBalanceCentavos -
                    (summary.creditLimitCentavos ?? 0)
                )} over its limit.`
              : "This card has reached at least 80% of its credit limit."}
          </AlertDescription>
        </Alert>
      )}

      {summary.canPay && sourceAccounts.length === 0 && (
        <Alert className="mt-3" variant="destructive">
          <RiAlertLine aria-hidden="true" />
          <AlertTitle>No payment account available</AlertTitle>
          <AlertDescription>
            Add a cash, bank, wallet, or emergency-fund account before paying
            this credit card.
          </AlertDescription>
        </Alert>
      )}

      {summary.canPay && sourceAccounts.length > 0 && (
        <TransactionDialog
          accounts={accounts}
          bills={bills}
          budgets={budgets}
          categories={categories}
          description="Choose the bank, wallet, or cash account used to pay this card. Card payments are transfers and do not spend a budget twice."
          initialValues={getCreditCardPaymentFormValues(
            summary,
            sourceAccounts
          )}
          lockedTransferAccountId={account.id}
          lockedType
          sourceAccountIds={sourceAccounts.map((source) => source.id)}
          title={`Pay ${account.displayName}`}
          transactions={transactions}
          trigger={
            <Button
              className="mt-3 w-full rounded-full"
              variant="outline"
            >
              Pay credit card
            </Button>
          }
        />
      )}
    </article>
  )
}
