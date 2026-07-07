"use client"

import { useMemo, useState, type ReactElement } from "react"
import { toast } from "sonner"

import type {
  Account,
  Bill,
  Category,
  Transaction,
  TransactionFormValues,
  TransactionType,
} from "@/types/finance"
import { EmptyState } from "@/components/app/empty-state"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"
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
import { Textarea } from "@/components/ui/textarea"
import { saveTransaction } from "@/lib/db/repositories/transactions"
import { centavosToInput } from "@/lib/finance/currency"
import { getTodayInputDate } from "@/lib/finance/dates"

interface TransactionDialogProps {
  accounts: Account[]
  categories: Category[]
  bills: Bill[]
  transaction?: Transaction
  trigger?: ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function getInitialValues(
  accounts: Account[],
  categories: Category[],
  transaction?: Transaction
): TransactionFormValues {
  const type = transaction?.type ?? "expense"
  const defaultCategory = categories.find((category) => category.kind === type)

  return {
    id: transaction?.id,
    type,
    amount: transaction ? centavosToInput(transaction.amountCentavos) : "",
    accountId: transaction?.accountId ?? accounts[0]?.id ?? "",
    transferAccountId:
      transaction?.transferAccountId ??
      accounts.find((account) => account.id !== accounts[0]?.id)?.id,
    categoryId: transaction?.categoryId ?? defaultCategory?.id,
    billId: transaction?.billId,
    date: transaction?.date ?? getTodayInputDate(),
    description: transaction?.description ?? "",
    notes: transaction?.notes ?? "",
  }
}

export function TransactionDialog({
  accounts,
  categories,
  bills,
  transaction,
  trigger,
  open,
  onOpenChange,
}: TransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const dialogOpen = open ?? internalOpen
  const setDialogOpen = onOpenChange ?? setInternalOpen

  return (
    <BottomSheetForm
      description="Transfers move money between accounts and stay out of income and expense totals."
      open={dialogOpen}
      title={transaction ? "Edit transaction" : "Add transaction"}
      trigger={trigger}
      onOpenChange={setDialogOpen}
    >
      {accounts.length === 0 ? (
        <EmptyState
          title="Add an account first"
          description="Transactions need at least one wallet, bank, e-wallet, credit card, or loan account."
        />
      ) : (
        <TransactionForm
          key={transaction?.id ?? "new-transaction"}
          accounts={accounts}
          bills={bills}
          categories={categories}
          initialValues={getInitialValues(accounts, categories, transaction)}
          onSaved={() => setDialogOpen(false)}
        />
      )}
    </BottomSheetForm>
  )
}

function TransactionForm({
  accounts,
  categories,
  bills,
  initialValues,
  onSaved,
}: {
  accounts: Account[]
  categories: Category[]
  bills: Bill[]
  initialValues: TransactionFormValues
  onSaved: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  const availableCategories = useMemo(
    () => {
      if (values.type === "transfer") {
        return []
      }

      return categories.filter((category) => category.kind === values.type)
    },
    [categories, values.type]
  )

  const updateValue = <Key extends keyof TransactionFormValues>(
    key: Key,
    value: TransactionFormValues[Key]
  ) => {
    setValues((current) => ({ ...current, [key]: value }))
  }

  const updateType = (type: TransactionType) => {
    const nextCategory = categories.find((category) => category.kind === type)
    setValues((current) => ({
      ...current,
      type,
      categoryId: type === "transfer" ? undefined : nextCategory?.id,
      transferAccountId:
        type === "transfer"
          ? current.transferAccountId ??
            accounts.find((account) => account.id !== current.accountId)?.id
          : undefined,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveTransaction(values)
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
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="transaction-amount">Amount</FieldLabel>
            <Input
              id="transaction-amount"
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
            <FieldLabel htmlFor="transaction-date">Date</FieldLabel>
            <Input
              id="transaction-date"
              type="date"
              value={values.date}
              onChange={(event) => updateValue("date", event.target.value)}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="transaction-account">
            {values.type === "transfer" ? "From account" : "Account"}
          </FieldLabel>
          <NativeSelect
            id="transaction-account"
            value={values.accountId}
            onChange={(event) => updateValue("accountId", event.target.value)}
          >
            {accounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.displayName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {values.type === "transfer" ? (
          <Field>
            <FieldLabel htmlFor="transaction-transfer-account">
              To account
            </FieldLabel>
            <NativeSelect
              id="transaction-transfer-account"
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
          </Field>
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
            <NativeSelect
              id="transaction-bill"
              value={values.billId ?? ""}
              onChange={(event) => updateValue("billId", event.target.value)}
            >
              <NativeSelectOption value="">No bill</NativeSelectOption>
              {bills.map((bill) => (
                <NativeSelectOption key={bill.id} value={bill.id}>
                  {bill.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="transaction-description">Description</FieldLabel>
          <Input
            id="transaction-description"
            placeholder="Grab, groceries, salary..."
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
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button className="h-11 w-full rounded-full" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save transaction"}
        </Button>
      </div>
    </form>
  )
}
