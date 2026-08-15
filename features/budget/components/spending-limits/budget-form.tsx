"use client"

import { useState } from "react"
import { toast } from "sonner"

import type { Category } from "@/types/finance"
import type { BudgetFormValues } from "@/features/budget/types/budget-form"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { saveBudget } from "@/features/budget/services/budget-commands"

export function BudgetForm({
  categories,
  initialValues,
  onSaved,
}: {
  categories: Category[]
  initialValues: BudgetFormValues
  onSaved: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  const updateValue = <Key extends keyof BudgetFormValues>(
    key: Key,
    value: BudgetFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveBudget(values)
      toast.success("Budget saved")
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
          <FieldLabel htmlFor="budget-category">Category</FieldLabel>
          <NativeSelect
            id="budget-category"
            value={values.categoryId}
            onChange={(event) => updateValue("categoryId", event.target.value)}
          >
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="budget-limit">Monthly limit</FieldLabel>
          <Input
            id="budget-limit"
            inputMode="decimal"
            min="0"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={values.limit}
            onChange={(event) => updateValue("limit", event.target.value)}
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
          {isSaving ? "Saving..." : "Save budget"}
        </Button>
      </div>
    </form>
  )
}
