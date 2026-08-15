"use client"

import { useState } from "react"
import { toast } from "sonner"

import type { Account, Category } from "@/types/finance"
import type { BillFormValues } from "@/features/bills/types/bill-form-values"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { saveBill } from "@/features/bills/services/bill-commands"

interface BillFormProps {
  accounts: Account[]
  categories: Category[]
  initialValues: BillFormValues
  onSaved: () => void
}

export function BillForm({
  accounts,
  categories,
  initialValues,
  onSaved,
}: BillFormProps) {
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
      await saveBill(values, {
        initialFirstDueDate: initialValues.firstDueDate,
      })
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
          <FieldLabel htmlFor="bill-first-due-date">First due date</FieldLabel>
          <Input
            id="bill-first-due-date"
            required
            type="date"
            value={values.firstDueDate ?? ""}
            onChange={(event) => {
              const firstDueDate = event.target.value
              setValues((current) => ({
                ...current,
                firstDueDate,
                dueDay: Number(firstDueDate.slice(-2)),
              }))
            }}
          />
          <FieldDescription>
            Sets the starting date for this recurring schedule.
          </FieldDescription>
        </Field>
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
              updateValue(
                "frequency",
                event.target.value as BillFormValues["frequency"]
              )
            }
          >
            <NativeSelectOption value="monthly">Monthly</NativeSelectOption>
            <NativeSelectOption value="weekly">Weekly</NativeSelectOption>
            <NativeSelectOption value="yearly">Yearly</NativeSelectOption>
          </NativeSelect>
        </Field>
        <FieldGroup className="grid grid-cols-2 gap-3">
          <Field orientation="horizontal">
            <Switch
              checked={values.autopay}
              id="bill-autopay"
              onCheckedChange={(checked) => updateValue("autopay", checked)}
            />
            <FieldLabel htmlFor="bill-autopay">Autopay</FieldLabel>
          </Field>
          <Field orientation="horizontal">
            <Switch
              checked={values.active}
              id="bill-active"
              onCheckedChange={(checked) => updateValue("active", checked)}
            />
            <FieldLabel htmlFor="bill-active">Active</FieldLabel>
          </Field>
        </FieldGroup>
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
        <Button
          className="h-11 w-full rounded-full"
          disabled={isSaving}
          type="submit"
        >
          {isSaving && <Spinner data-icon="inline-start" />}
          {isSaving ? "Saving..." : "Save bill"}
        </Button>
      </div>
    </form>
  )
}
