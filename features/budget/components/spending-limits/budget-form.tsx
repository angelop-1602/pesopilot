"use client"

import { useState } from "react"
import { toast } from "sonner"

import type { Category, MonthlyBudget } from "@/types/finance"
import type { BudgetFormValues } from "@/features/budget/types/budget-form"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { saveBudget } from "@/features/budget/services/budget-commands"
import {
  BUDGET_NAME_MAX_LENGTH,
  normalizeBudgetName,
} from "@/lib/finance/budgets"

export function BudgetForm({
  categories,
  initialValues,
  onSaved,
}: {
  categories: Category[]
  initialValues: BudgetFormValues
  onSaved: (budget: MonthlyBudget) => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const [nameError, setNameError] = useState<string>()

  const updateValue = <Key extends keyof BudgetFormValues>(
    key: Key,
    value: BudgetFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    let name: string

    try {
      name = normalizeBudgetName(values.name)
      setNameError(undefined)
    } catch (error) {
      setNameError(
        error instanceof Error ? error.message : "Budget name is required."
      )
      return
    }

    setIsSaving(true)

    try {
      const budget = await saveBudget({ ...values, name })
      toast.success("Budget saved")
      onSaved(budget)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="flex flex-col gap-4 pb-1" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field data-invalid={nameError ? true : undefined}>
          <FieldLabel htmlFor="budget-name">Budget name</FieldLabel>
          <Input
            aria-describedby={nameError ? "budget-name-error" : undefined}
            aria-invalid={Boolean(nameError)}
            autoComplete="off"
            id="budget-name"
            maxLength={BUDGET_NAME_MAX_LENGTH}
            placeholder="e.g. Weekly groceries"
            required
            value={values.name}
            onChange={(event) => {
              updateValue("name", event.target.value)
              setNameError(undefined)
            }}
          />
          <FieldDescription>
            Give this spending plan a name you will recognize.
          </FieldDescription>
          <FieldError id="budget-name-error">{nameError}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="budget-category">Category</FieldLabel>
          <NativeSelect
            disabled={Boolean(initialValues.id)}
            id="budget-category"
            required
            value={values.categoryId}
            onChange={(event) => updateValue("categoryId", event.target.value)}
          >
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            {initialValues.id
              ? "The category stays fixed so linked expenses remain accurate."
              : "The same category can be shared by multiple named budgets."}
          </FieldDescription>
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
