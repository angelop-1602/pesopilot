"use client"

import { useMemo, useState } from "react"
import { RiAddLine, RiAlertLine } from "@remixicon/react"
import { toast } from "sonner"

import type {
  Account,
  Bill,
  Category,
  MonthlyBudget,
  Transaction,
  TransactionType,
} from "@/types/finance"
import type { TransactionFormValues } from "@/features/transactions/types/transaction-form-values"
import {
  AttachmentField,
  type PreparedImageAttachment,
} from "@/features/attachments"
import { BudgetDialog } from "@/features/budget/components/spending-limits/budget-dialog"
import { saveTransaction } from "@/features/transactions/services/transaction-commands"
import { getTransactionMonthBudgets } from "@/features/transactions/utils/transaction-form-values"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { getBudgetSpend } from "@/lib/finance/budget-spending"
import { getBudgetDisplayName } from "@/lib/finance/budgets"
import { savePreparedAttachments } from "@/lib/db/services/attachment-writes"
import {
  formatPeso,
  pesosToCentavos,
} from "@/lib/finance/currency"
import { formatMonthLabel, isInputDate } from "@/lib/finance/dates"

interface TransactionFormProps {
  accounts: Account[]
  bills: Bill[]
  budgets: MonthlyBudget[]
  categories: Category[]
  initialValues: TransactionFormValues
  lockedType?: boolean
  lockedBillId?: string
  lockedTransferAccountId?: string
  sourceAccountIds?: string[]
  transactions: Transaction[]
  onSaved: () => void
}

export function TransactionForm({
  accounts,
  bills,
  budgets,
  categories,
  initialValues,
  lockedType = false,
  lockedBillId,
  lockedTransferAccountId,
  sourceAccountIds,
  transactions,
  onSaved,
}: TransactionFormProps) {
  const [values, setValues] = useState(initialValues)
  const [attachmentDrafts, setAttachmentDrafts] = useState<
    PreparedImageAttachment[]
  >([])
  const [isSaving, setIsSaving] = useState(false)
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === "expense"),
    [categories]
  )
  const availableCategories = useMemo(() => {
    if (values.type === "transfer") {
      return []
    }

    return categories.filter((category) => category.kind === values.type)
  }, [categories, values.type])
  const hasValidDate = isInputDate(values.date)
  const monthId = values.date.slice(0, 7)
  const monthBudgets = useMemo(
    () => getTransactionMonthBudgets(budgets, values.date),
    [budgets, values.date]
  )
  const selectedBudget = monthBudgets.find(
    (budget) => budget.id === values.budgetId
  )
  const selectedCategory = categories.find(
    (category) => category.id === values.categoryId
  )
  const selectableAccounts = sourceAccountIds
    ? accounts.filter((account) => sourceAccountIds.includes(account.id))
    : accounts
  const otherTransactions = useMemo(
    () =>
      values.id
        ? transactions.filter((transaction) => transaction.id !== values.id)
        : transactions,
    [transactions, values.id]
  )
  const selectedBudgetSpend = useMemo(
    () =>
      selectedBudget
        ? getBudgetSpend(budgets, otherTransactions, monthId).find(
            (budget) => budget.id === selectedBudget.id
          )
        : undefined,
    [budgets, monthId, otherTransactions, selectedBudget]
  )
  const projectedSpendCentavos = selectedBudget
    ? (selectedBudgetSpend?.spentCentavos ?? 0) +
      pesosToCentavos(values.amount)
    : 0
  const projectedOverageCentavos = selectedBudget
    ? Math.max(projectedSpendCentavos - selectedBudget.limitCentavos, 0)
    : 0

  const updateValue = <Key extends keyof TransactionFormValues>(
    key: Key,
    value: TransactionFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const updateType = (type: TransactionType) => {
    setValues((current) => {
      const currentMonthBudgets = getTransactionMonthBudgets(
        budgets,
        current.date
      )
      const nextBudget = type === "expense" ? currentMonthBudgets[0] : undefined
      const nextCategory = nextBudget
        ? categories.find((category) => category.id === nextBudget.categoryId)
        : categories.find((category) => category.kind === type)

      return {
        ...current,
        type,
        budgetId: nextBudget?.id,
        categoryId: type === "transfer" ? undefined : nextCategory?.id,
        billId: type === "expense" ? current.billId : undefined,
        billOccurrenceDate:
          type === "expense" ? current.billOccurrenceDate : undefined,
        transferAccountId:
          type === "transfer"
            ? current.transferAccountId ??
              accounts.find((account) => account.id !== current.accountId)?.id
            : undefined,
      }
    })
  }

  const updateDate = (date: string) => {
    setValues((current) => {
      if (current.type !== "expense") {
        return { ...current, date }
      }

      const nextBudgets = getTransactionMonthBudgets(budgets, date)
      const currentBudget = nextBudgets.find(
        (budget) => budget.id === current.budgetId
      )
      const nextBudget =
        currentBudget ?? (nextBudgets.length === 1 ? nextBudgets[0] : undefined)

      return {
        ...current,
        date,
        budgetId: nextBudget?.id,
        categoryId: nextBudget?.categoryId,
      }
    })
  }

  const updateBudget = (budgetId: string) => {
    const budget = monthBudgets.find((item) => item.id === budgetId)

    setValues((current) => ({
      ...current,
      budgetId: budget?.id,
      categoryId: budget?.categoryId,
    }))
  }

  const updateBill = (billId: string) => {
    const bill = bills.find((item) => item.id === billId)

    setValues((current) => {
      const matchingBudgets = bill?.categoryId
        ? getTransactionMonthBudgets(budgets, current.date).filter(
            (budget) => budget.categoryId === bill.categoryId
          )
        : []

      return {
        ...current,
        accountId: bill?.accountId ?? current.accountId,
        billId: bill?.id,
        billOccurrenceDate:
          bill?.id === current.billId ? current.billOccurrenceDate : undefined,
        budgetId:
          matchingBudgets.length === 1 ? matchingBudgets[0].id : undefined,
        categoryId: bill?.categoryId ?? current.categoryId,
        description: current.description || bill?.name || "",
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (values.type === "expense" && !values.budgetId) {
      toast.error("Choose a budget for this expense.")
      return
    }

    setIsSaving(true)

    try {
      const transaction = await saveTransaction(values)

      await savePreparedAttachments({
        ownerType: "transaction",
        ownerId: transaction.id,
        purpose:
          lockedBillId || lockedTransferAccountId || values.type === "transfer"
            ? "payment_proof"
            : values.type === "expense"
              ? "receipt"
              : "other",
        prepared: attachmentDrafts,
      })
      setAttachmentDrafts([])
      toast.success("Transaction saved")
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
          <FieldLabel htmlFor="transaction-type">Type</FieldLabel>
          {lockedType ? (
            <Input
              id="transaction-type"
              readOnly
              value={
                values.type === "expense"
                  ? "Expense"
                  : values.type === "income"
                    ? "Income"
                    : "Transfer"
              }
            />
          ) : (
            <NativeSelect
              id="transaction-type"
              value={values.type}
              onChange={(event) =>
                updateType(event.target.value as TransactionType)
              }
            >
              <NativeSelectOption value="expense">Expense</NativeSelectOption>
              <NativeSelectOption value="income">Income</NativeSelectOption>
              <NativeSelectOption value="transfer">Transfer</NativeSelectOption>
            </NativeSelect>
          )}
        </Field>
        <FieldGroup className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="transaction-amount">Amount</FieldLabel>
            <Input
              id="transaction-amount"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              required
              step="0.01"
              type="number"
              value={values.amount}
              onChange={(event) => updateValue("amount", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
            <Input
              id="transaction-date"
              required
              type="date"
              value={values.date}
              onChange={(event) => updateDate(event.target.value)}
            />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel htmlFor="transaction-account">
            {values.type === "transfer"
              ? lockedTransferAccountId
                ? "Paid from"
                : "From account"
              : "Account"}
          </FieldLabel>
          <NativeSelect
            id="transaction-account"
            required
            value={values.accountId}
            onChange={(event) => updateValue("accountId", event.target.value)}
          >
            <NativeSelectOption value="">Choose account</NativeSelectOption>
            {selectableAccounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.displayName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {values.type === "transfer" ? (
          <Field>
            <FieldLabel htmlFor="transaction-transfer-account">
              {lockedTransferAccountId ? "Paid to" : "To account"}
            </FieldLabel>
            {lockedTransferAccountId ? (
              <Input
                id="transaction-transfer-account"
                readOnly
                value={
                  accounts.find(
                    (account) => account.id === lockedTransferAccountId
                  )?.displayName ?? "Credit card"
                }
              />
            ) : (
              <NativeSelect
                id="transaction-transfer-account"
                required
                value={values.transferAccountId ?? ""}
                onChange={(event) =>
                  updateValue("transferAccountId", event.target.value)
                }
              >
                <NativeSelectOption value="">Choose account</NativeSelectOption>
                {accounts
                  .filter((account) => account.id !== values.accountId)
                  .map((account) => (
                    <NativeSelectOption key={account.id} value={account.id}>
                      {account.displayName}
                    </NativeSelectOption>
                  ))}
              </NativeSelect>
            )}
          </Field>
        ) : values.type === "expense" ? (
          <>
            {!hasValidDate ? (
              <Alert variant="destructive">
                <RiAlertLine aria-hidden="true" />
                <AlertTitle>Choose a transaction date</AlertTitle>
                <AlertDescription>
                  The date determines which monthly budgets are available.
                </AlertDescription>
              </Alert>
            ) : monthBudgets.length === 0 ? (
              <Alert variant="destructive">
                <RiAlertLine aria-hidden="true" />
                <AlertTitle>
                  Create a budget for {formatMonthLabel(monthId)}
                </AlertTitle>
                <AlertDescription>
                  <span className="block">
                    Every expense needs a monthly budget before it can be saved.
                  </span>
                  <span className="mt-2 block">
                    <BudgetDialog
                      categories={expenseCategories}
                      monthId={monthId}
                      onSaved={(budget) => {
                        updateValue("budgetId", budget.id)
                        updateValue("categoryId", budget.categoryId)
                      }}
                      trigger={
                        <Button
                          className="rounded-full"
                          size="sm"
                          type="button"
                        >
                          <RiAddLine
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                          Create budget
                        </Button>
                      }
                    />
                  </span>
                </AlertDescription>
              </Alert>
            ) : (
              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="transaction-budget">Budget</FieldLabel>
                  <BudgetDialog
                    categories={expenseCategories}
                    monthId={monthId}
                    onSaved={(budget) => {
                      updateValue("budgetId", budget.id)
                      updateValue("categoryId", budget.categoryId)
                    }}
                    trigger={
                      <Button size="xs" type="button" variant="ghost">
                        <RiAddLine data-icon="inline-start" aria-hidden="true" />
                        New
                      </Button>
                    }
                  />
                </div>
                <NativeSelect
                  id="transaction-budget"
                  required
                  value={values.budgetId ?? ""}
                  onChange={(event) => updateBudget(event.target.value)}
                >
                  <NativeSelectOption value="">Choose budget</NativeSelectOption>
                  {monthBudgets.map((budget) => {
                    const category = categories.find(
                      (item) => item.id === budget.categoryId
                    )

                    return (
                      <NativeSelectOption key={budget.id} value={budget.id}>
                        {getBudgetDisplayName(budget, category?.name)}
                        {category ? ` (${category.name})` : ""}
                      </NativeSelectOption>
                    )
                  })}
                </NativeSelect>
                <FieldDescription>
                  The budget sets the category and receives this expense.
                </FieldDescription>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="transaction-category">Category</FieldLabel>
              <Input
                id="transaction-category"
                readOnly
                value={selectedCategory?.name ?? "Choose a budget first"}
              />
              <FieldDescription>
                Categories can be reused across named budgets.
              </FieldDescription>
            </Field>
          </>
        ) : (
          <Field>
            <FieldLabel htmlFor="transaction-category">Category</FieldLabel>
            <NativeSelect
              id="transaction-category"
              value={values.categoryId ?? ""}
              onChange={(event) =>
                updateValue("categoryId", event.target.value)
              }
            >
              <NativeSelectOption value="">Uncategorized</NativeSelectOption>
              {availableCategories.map((category) => (
                <NativeSelectOption key={category.id} value={category.id}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        )}
        {bills.length > 0 && values.type === "expense" && (
          <Field>
            <FieldLabel htmlFor="transaction-bill">Bill link</FieldLabel>
            {lockedBillId ? (
              <Input
                id="transaction-bill"
                readOnly
                value={
                  bills.find((bill) => bill.id === lockedBillId)?.name ??
                  "Linked bill"
                }
              />
            ) : (
              <NativeSelect
                id="transaction-bill"
                value={values.billId ?? ""}
                onChange={(event) => updateBill(event.target.value)}
              >
                <NativeSelectOption value="">No bill</NativeSelectOption>
                {bills.map((bill) => (
                  <NativeSelectOption key={bill.id} value={bill.id}>
                    {bill.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </Field>
        )}
        {projectedOverageCentavos > 0 && selectedBudget && (
          <Alert variant="destructive">
            <RiAlertLine aria-hidden="true" />
            <AlertTitle>Budget limit exceeded</AlertTitle>
            <AlertDescription>
              This expense puts {getBudgetDisplayName(selectedBudget)} {" "}
              {formatPeso(projectedOverageCentavos)} over its limit. You can
              still record the expense.
            </AlertDescription>
          </Alert>
        )}
        <Field>
          <FieldLabel htmlFor="transaction-description">Description</FieldLabel>
          <Input
            id="transaction-description"
            placeholder="Grab, groceries, salary..."
            required
            value={values.description}
            onChange={(event) =>
              updateValue("description", event.target.value)
            }
          />
          <FieldDescription>
            Keep it short so the list stays easy to scan on your phone.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="transaction-notes">Notes</FieldLabel>
          <Textarea
            id="transaction-notes"
            placeholder="Optional"
            value={values.notes}
            onChange={(event) => updateValue("notes", event.target.value)}
          />
        </Field>
        <AttachmentField
          description={
            lockedBillId || lockedTransferAccountId || values.type === "transfer"
              ? "Add payment confirmation or another proof image. It stays on this device and is included in encrypted backups."
              : values.type === "expense"
                ? "Add receipt photos. Images are resized and stripped of location metadata before saving."
                : "Add a supporting image for this transaction."
          }
          disabled={isSaving}
          id="transaction-attachments"
          label={
            lockedBillId || lockedTransferAccountId || values.type === "transfer"
              ? "Payment proof"
              : values.type === "expense"
                ? "Receipts"
                : "Images"
          }
          maxFiles={5}
          multiple
          ownerId={initialValues.id}
          ownerType="transaction"
          purpose={
            lockedBillId || lockedTransferAccountId || values.type === "transfer"
              ? "payment_proof"
              : values.type === "expense"
                ? "receipt"
                : "other"
          }
          value={attachmentDrafts}
          onChange={setAttachmentDrafts}
        />
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button
          className="h-11 w-full rounded-full"
          disabled={
            isSaving || (values.type === "expense" && !values.budgetId)
          }
          type="submit"
        >
          {isSaving && <Spinner data-icon="inline-start" />}
          {isSaving ? "Saving..." : "Save transaction"}
        </Button>
      </div>
    </form>
  )
}
