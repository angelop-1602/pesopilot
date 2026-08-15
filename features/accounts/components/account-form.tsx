"use client"

import { useState } from "react"
import { toast } from "sonner"

import type {
  AccountProductType,
  InstitutionKey,
} from "@/types/finance"
import { InstitutionCombobox } from "@/features/accounts/components/institution-combobox"
import { saveAccount } from "@/features/accounts/services/account-commands"
import type { AccountFormValues } from "@/features/accounts/types/account-form"
import { inputToNumber } from "@/features/accounts/utils/account-form-values"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import {
  getAccountProduct,
  getAccountProductLabel,
} from "@/lib/constants/account-products"
import {
  getInstitution,
  isAccountProductAllowed,
} from "@/lib/constants/institutions"

interface AccountFormProps {
  initialValues: AccountFormValues
  isEditing: boolean
  onSaved: () => void
}

export function AccountForm({
  initialValues,
  isEditing,
  onSaved,
}: AccountFormProps) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)
  const institution = getInstitution(values.institutionKey)
  const selectedProduct = getAccountProduct(values.accountProductType)
  const isCreditCard = values.accountProductType === "credit_card"
  const isLiability = selectedProduct.balanceNature === "liability"
  const balanceLabel = isLiability
    ? "Current Amount Owed"
    : isEditing
      ? "Current Balance"
      : "Opening Balance"
  const balanceHelper = isCreditCard
    ? "Enter your current outstanding balance."
    : isLiability
      ? "How much do you currently owe?"
      : "How much is currently in this account?"

  const updateValue = <Key extends keyof AccountFormValues>(
    key: Key,
    value: AccountFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const applyInstitution = (institutionKey: InstitutionKey) => {
    const nextInstitution = getInstitution(institutionKey)

    setValues((current) => {
      const accountProductType = isAccountProductAllowed(
        nextInstitution,
        current.accountProductType
      )
        ? current.accountProductType
        : nextInstitution.defaultAccountProductType

      return {
        ...current,
        institutionKey: nextInstitution.key,
        accountProductType,
        statementDay:
          accountProductType === "credit_card"
            ? current.statementDay ?? 15
            : undefined,
        paymentDueDay:
          accountProductType === "credit_card"
            ? current.paymentDueDay ?? 25
            : undefined,
      }
    })
  }

  const applyProduct = (accountProductType: AccountProductType) => {
    setValues((current) => ({
      ...current,
      accountProductType,
      statementDay:
        accountProductType === "credit_card"
          ? current.statementDay ?? 15
          : undefined,
      paymentDueDay:
        accountProductType === "credit_card"
          ? current.paymentDueDay ?? 25
          : undefined,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const shouldSaveOverLimit =
      isCreditCard &&
      inputToNumber(values.openingBalance) > inputToNumber(values.creditLimit) &&
      window.confirm(
        "Current amount owed is above the credit limit. Save this over-limit balance?"
      )

    if (
      isCreditCard &&
      inputToNumber(values.openingBalance) > inputToNumber(values.creditLimit) &&
      !shouldSaveOverLimit
    ) {
      return
    }

    setIsSaving(true)

    try {
      await saveAccount({ ...values, allowOverLimit: shouldSaveOverLimit })
      toast.success("Account saved")
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
          <FieldLabel htmlFor="account-institution">Institution</FieldLabel>
          <InstitutionCombobox
            id="account-institution"
            value={values.institutionKey}
            onValueChange={applyInstitution}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="account-product">Account Product</FieldLabel>
          <NativeSelect
            id="account-product"
            value={values.accountProductType}
            onChange={(event) =>
              applyProduct(event.target.value as AccountProductType)
            }
          >
            {institution.allowedAccountProductTypes.map((productType) => (
              <NativeSelectOption key={productType} value={productType}>
                {getAccountProductLabel(productType)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>{selectedProduct.description}</FieldDescription>
        </Field>
        {isCreditCard && (
          <Field>
            <FieldLabel htmlFor="account-credit-limit">Credit Limit</FieldLabel>
            <Input
              id="account-credit-limit"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.creditLimit ?? ""}
              onChange={(event) =>
                updateValue("creditLimit", event.target.value)
              }
            />
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="account-opening">{balanceLabel}</FieldLabel>
          <Input
            id="account-opening"
            inputMode="decimal"
            min="0"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={values.openingBalance}
            onChange={(event) =>
              updateValue("openingBalance", event.target.value)
            }
          />
          <FieldDescription>{balanceHelper}</FieldDescription>
        </Field>
        {isCreditCard && (
          <FieldGroup className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="account-statement-day">
                Statement Day
              </FieldLabel>
              <Input
                id="account-statement-day"
                inputMode="numeric"
                max="31"
                min="1"
                type="number"
                value={values.statementDay ?? ""}
                onChange={(event) =>
                  updateValue("statementDay", Number(event.target.value))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="account-payment-day">
                Payment Due Day
              </FieldLabel>
              <Input
                id="account-payment-day"
                inputMode="numeric"
                max="31"
                min="1"
                type="number"
                value={values.paymentDueDay ?? ""}
                onChange={(event) =>
                  updateValue("paymentDueDay", Number(event.target.value))
                }
              />
            </Field>
          </FieldGroup>
        )}
        <Field orientation="horizontal">
          <Switch
            checked={values.includeInNetWorth}
            id="account-include-net-worth"
            onCheckedChange={(checked) =>
              updateValue("includeInNetWorth", checked)
            }
          />
          <FieldLabel htmlFor="account-include-net-worth">
            Include in Net Worth
          </FieldLabel>
        </Field>
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button
          className="h-11 w-full rounded-full"
          disabled={isSaving}
          type="submit"
        >
          {isSaving && <Spinner data-icon="inline-start" />}
          {isSaving ? "Saving..." : "Save account"}
        </Button>
      </div>
    </form>
  )
}
