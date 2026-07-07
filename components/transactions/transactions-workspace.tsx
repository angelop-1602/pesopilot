"use client"

import { useMemo, useState, type ReactElement } from "react"
import {
  RiAddLine,
  RiBillLine,
  RiCalendarCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileList3Line,
} from "@remixicon/react"
import { toast } from "sonner"

import type { Bill, BillFormValues, Transaction } from "@/types/finance"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { deleteBill, markBillPaid, saveBill } from "@/lib/db/repositories/bills"
import { deleteTransaction } from "@/lib/db/repositories/transactions"
import {
  getMonthlySummary,
  getUpcomingBills,
  withNet,
} from "@/lib/finance/calculations"
import { centavosToInput, formatPeso } from "@/lib/finance/currency"
import { formatShortDate, getCurrentMonthId } from "@/lib/finance/dates"
import { useFinanceData } from "@/lib/hooks/use-finance-data"
import { cn } from "@/lib/utils"

type TransactionFilter = "all" | "income" | "expense" | "transfer"

function getInitialBillValues(bill?: Bill): BillFormValues {
  return {
    id: bill?.id,
    name: bill?.name ?? "",
    amount: bill ? centavosToInput(bill.amountCentavos) : "",
    accountId: bill?.accountId,
    categoryId: bill?.categoryId,
    dueDay: bill?.dueDay ?? 1,
    frequency: bill?.frequency ?? "monthly",
    autopay: bill?.autopay ?? false,
    active: bill?.active ?? true,
    notes: bill?.notes ?? "",
  }
}

export function TransactionsWorkspace() {
  const { data } = useFinanceData()
  const monthId = getCurrentMonthId()
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const summary = withNet(getMonthlySummary(data.transactions, monthId))

  const visibleTransactions = useMemo(
    () =>
      data.transactions.filter(
        (transaction) => filter === "all" || transaction.type === filter
      ),
    [data.transactions, filter]
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Transactions"
        description="Fast capture, quick filters, and recurring bill actions."
        action={
          <TransactionDialog
            accounts={data.accounts}
            bills={data.bills}
            categories={data.categories}
            trigger={
              <Button className="rounded-full">
                <RiAddLine data-icon="inline-start" aria-hidden="true" />
                Add
              </Button>
            }
          />
        }
      />
      <div className="rounded-[1.65rem] bg-white/76 p-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-3 divide-x divide-border/70">
          <SummaryValue label="Income" value={summary.incomeCentavos} />
          <SummaryValue
            label="Spent"
            tone={summary.expenseCentavos > summary.incomeCentavos ? "danger" : "default"}
            value={summary.expenseCentavos}
          />
          <SummaryValue
            label="Net"
            tone={summary.netCentavos >= 0 ? "good" : "danger"}
            value={summary.netCentavos}
          />
        </div>
      </div>
      <Tabs defaultValue="activity">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-white/72 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              <div>
                <p className="text-xs font-medium">Quick filter</p>
                <p className="text-xs text-muted-foreground">
                  Transfers are excluded from income and expense totals.
                </p>
              </div>
              <NativeSelect
                aria-label="Transaction filter"
                className="w-32 shrink-0"
                value={filter}
                onChange={(event) =>
                  setFilter(event.target.value as TransactionFilter)
                }
              >
                <NativeSelectOption value="all">All</NativeSelectOption>
                <NativeSelectOption value="expense">Expenses</NativeSelectOption>
                <NativeSelectOption value="income">Income</NativeSelectOption>
                <NativeSelectOption value="transfer">Transfers</NativeSelectOption>
              </NativeSelect>
          </div>
          {visibleTransactions.length === 0 ? (
            <EmptyState
              icon={<RiFileList3Line aria-hidden="true" />}
              title="No transactions here"
              description="Add income, expenses, or transfers for the selected month."
              action={
                <TransactionDialog
                  accounts={data.accounts}
                  bills={data.bills}
                  categories={data.categories}
                  trigger={
                    <Button className="rounded-full">
                      <RiAddLine data-icon="inline-start" aria-hidden="true" />
                      Add transaction
                    </Button>
                  }
                />
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              {visibleTransactions.map((transaction) => (
                <TransactionRow
                  accounts={data.accounts}
                  bills={data.bills}
                  categories={data.categories}
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="bills" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <BillDialog
              trigger={
                <Button className="rounded-full" variant="outline">
                  <RiAddLine data-icon="inline-start" aria-hidden="true" />
                  Bill
                </Button>
              }
            />
          </div>
          {data.bills.length === 0 ? (
            <EmptyState
              icon={<RiBillLine aria-hidden="true" />}
              title="No recurring bills"
              description="Track rent, subscriptions, utilities, and other repeated expenses."
              action={
                <BillDialog
                  trigger={
                    <Button className="rounded-full">
                      <RiAddLine data-icon="inline-start" aria-hidden="true" />
                      Add bill
                    </Button>
                  }
                />
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              {getUpcomingBills(data.bills, monthId).map((bill) => (
                <BillRow key={bill.id} bill={bill} monthId={monthId} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryValue({
  label,
  tone = "default",
  value,
}: {
  label: string
  tone?: "default" | "danger" | "good"
  value: number
}) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p className="text-[0.68rem] font-semibold text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-xs font-semibold",
          tone === "danger" && "text-destructive",
          tone === "good" && "text-primary"
        )}
      >
        {formatPeso(value)}
      </p>
    </div>
  )
}

function TransactionRow({
  accounts,
  bills,
  categories,
  transaction,
}: {
  accounts: ReturnType<typeof useFinanceData>["data"]["accounts"]
  bills: ReturnType<typeof useFinanceData>["data"]["bills"]
  categories: ReturnType<typeof useFinanceData>["data"]["categories"]
  transaction: Transaction
}) {
  const account = accounts.find((item) => item.id === transaction.accountId)
  const transferAccount = accounts.find(
    (item) => item.id === transaction.transferAccountId
  )
  const category = categories.find((item) => item.id === transaction.categoryId)
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
    <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {transaction.description}
          </p>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold capitalize",
              transaction.type === "expense"
                ? "bg-rose-50 text-rose-600"
                : transaction.type === "income"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
            )}
          >
            {transaction.type}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {formatShortDate(transaction.date)} - {detail}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <TransactionDialog
            accounts={accounts}
            bills={bills}
            categories={categories}
            transaction={transaction}
            trigger={
              <Button
                aria-label={`Edit ${transaction.description}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete transaction?"
            description="The account balance will be recalculated after this transaction is removed."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${transaction.description}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await deleteTransaction(transaction.id)
              toast.success("Transaction deleted")
            }}
          />
        </div>
      </div>
      <div
        className={cn(
          "min-w-[6.5rem] text-right font-mono text-sm font-semibold",
          transaction.type === "expense" && "text-destructive",
          transaction.type === "income" && "text-primary"
        )}
      >
        {amountPrefix}
        {formatPeso(transaction.amountCentavos)}
      </div>
    </div>
  )
}

function BillRow({
  bill,
  monthId,
}: {
  bill: Bill & { dueDate: string }
  monthId: string
}) {
  const { data } = useFinanceData()
  const account = data.accounts.find((item) => item.id === bill.accountId)
  const category = data.categories.find((item) => item.id === bill.categoryId)

  return (
    <div className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <RiBillLine className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{bill.name}</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold",
                bill.active
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {bill.active ? "Active" : "Paused"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Due {formatShortDate(bill.dueDate)}
            {bill.autopay ? " - autopay" : ""}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {account?.displayName ?? "No account"} {category ? `- ${category.name}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-1">
            <BillDialog
              bill={bill}
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
      <Button
        className="mt-3 w-full rounded-full"
        disabled={!bill.accountId}
        variant="outline"
        onClick={async () => {
          try {
            await markBillPaid(bill, monthId)
            toast.success("Bill marked paid")
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "Unable to mark paid."
            )
          }
        }}
      >
        <RiCalendarCheckLine data-icon="inline-start" aria-hidden="true" />
        Mark paid
      </Button>
    </div>
  )
}

function BillDialog({
  bill,
  trigger,
}: {
  bill?: Bill
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const { data } = useFinanceData()

  return (
    <BottomSheetForm
      description="Bills live here so transaction capture stays fast and navigation stays light."
      open={open}
      title={bill ? "Edit bill" : "Add recurring bill"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <BillForm
        accounts={data.accounts}
        bill={bill}
        categories={data.categories.filter(
          (category) => category.kind === "expense"
        )}
        initialValues={getInitialBillValues(bill)}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}

function BillForm({
  accounts,
  categories,
  initialValues,
  onSaved,
}: {
  accounts: ReturnType<typeof useFinanceData>["data"]["accounts"]
  categories: ReturnType<typeof useFinanceData>["data"]["categories"]
  bill?: Bill
  initialValues: BillFormValues
  onSaved: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  const updateValue = <Key extends keyof BillFormValues>(
    key: Key,
    value: BillFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveBill(values)
      toast.success("Bill saved")
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="flex flex-col gap-4 pb-1" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="bill-name">Name</FieldLabel>
          <Input
            id="bill-name"
            placeholder="Meralco, rent, Netflix..."
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="bill-amount">Amount</FieldLabel>
            <Input
              id="bill-amount"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.amount}
              onChange={(event) => updateValue("amount", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bill-due-day">Due day</FieldLabel>
            <Input
              id="bill-due-day"
              max="31"
              min="1"
              type="number"
              value={values.dueDay}
              onChange={(event) =>
                updateValue("dueDay", Number(event.target.value))
              }
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="bill-account">Payment account</FieldLabel>
          <NativeSelect
            id="bill-account"
            value={values.accountId ?? ""}
            onChange={(event) => updateValue("accountId", event.target.value)}
          >
            <NativeSelectOption value="">Choose when paid</NativeSelectOption>
            {accounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.displayName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="bill-category">Category</FieldLabel>
          <NativeSelect
            id="bill-category"
            value={values.categoryId ?? ""}
            onChange={(event) => updateValue("categoryId", event.target.value)}
          >
            <NativeSelectOption value="">Uncategorized</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="bill-frequency">Frequency</FieldLabel>
          <NativeSelect
            id="bill-frequency"
            value={values.frequency}
            onChange={(event) =>
              updateValue("frequency", event.target.value as Bill["frequency"])
            }
          >
            <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
            <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
            <NativeSelectOption value="yearly">Yearly</NativeSelectOption>
          </NativeSelect>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field orientation="horizontal">
            <Switch
              checked={values.autopay}
              onCheckedChange={(checked) => updateValue("autopay", checked)}
            />
            <FieldLabel>Autopay</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Switch
              checked={values.active}
              onCheckedChange={(checked) => updateValue("active", checked)}
            />
            <FieldLabel>Active</FieldLabel>
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="bill-notes">Notes</FieldLabel>
          <Textarea
            id="bill-notes"
            placeholder="Optional"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
          />
        </Field>
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button className="h-11 w-full rounded-full" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save bill"}
        </Button>
      </div>
    </form>
  )
}
