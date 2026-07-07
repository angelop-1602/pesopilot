"use client"

import { useState, type ReactElement } from "react"
import {
  RiAddLine,
  RiArchiveLine,
  RiBankLine,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react"
import { toast } from "sonner"

import type {
  Account,
  AccountFormValues,
  AccountProductType,
  InstitutionKey,
} from "@/types/finance"
import { InstitutionCombobox } from "@/components/accounts/institution-combobox"
import { InstitutionLogo } from "@/components/accounts/institution-logo"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
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
import { Switch } from "@/components/ui/switch"
import {
  getAccountProduct,
  getAccountProductLabel,
} from "@/lib/constants/account-products"
import {
  getAccountInstitution,
  getDefaultInstitution,
  getInstitution,
  isAccountProductAllowed,
} from "@/lib/constants/institutions"
import {
  archiveAccount,
  deleteAccount,
  saveAccount,
} from "@/lib/db/repositories/accounts"
import {
  calculateAvailableCredit,
  getBalanceNature,
  getCreditCardStatus,
  isCreditCardAccount,
} from "@/lib/finance/accounts"
import {
  getAvailableBalance,
  getDebtTotal,
  getNetWorth,
  isDebtAccount,
} from "@/lib/finance/calculations"
import { centavosToInput, formatPeso } from "@/lib/finance/currency"
import { useFinanceData } from "@/lib/hooks/use-finance-data"
import { cn } from "@/lib/utils"

function getInitialValues(account?: Account): AccountFormValues {
  const institution = account
    ? getInstitution(account.institutionKey)
    : getDefaultInstitution()
  const accountProductType =
    account && isAccountProductAllowed(institution, account.accountProductType)
      ? account.accountProductType
      : institution.defaultAccountProductType

  return {
    id: account?.id,
    institutionKey: institution.key,
    accountProductType,
    openingBalance: account ? centavosToInput(account.balanceCentavos) : "",
    creditLimit:
      account?.creditLimitCentavos !== undefined
        ? centavosToInput(account.creditLimitCentavos)
        : "",
    statementDay: account?.statementDay,
    paymentDueDay: account?.paymentDueDay,
    includeInNetWorth: account?.includeInNetWorth ?? true,
  }
}

export function AccountsWorkspace() {
  const { data } = useFinanceData()
  const accounts = data.accounts
  const netWorth = getNetWorth(accounts)
  const available = getAvailableBalance(accounts)
  const debt = getDebtTotal(accounts)

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[1.8rem] bg-[linear-gradient(145deg,oklch(0.24_0.08_165),oklch(0.21_0.07_225))] p-5 text-white shadow-[0_20px_48px_rgba(6,78,59,0.2)]">
        <div className="flex items-center justify-between">
          <div>
          <p className="text-xs font-medium text-white/68">Net worth</p>
          <p className="mt-2 break-words font-mono text-3xl font-semibold">
            {formatPeso(netWorth)}
          </p>
          </div>
           <AccountDialog
            trigger={
              <Button className="rounded-full">
                <RiAddLine data-icon="inline-start" aria-hidden="true" />
                Add account
              </Button>
            }
          />
          </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.1rem] bg-white/12 p-3">
            <p className="text-[0.7rem] font-medium text-white/68">
              Available
            </p>
         
            <p className="mt-1 truncate font-mono text-sm font-semibold">
              {formatPeso(available)}
            </p>
          </div>
          <div className="rounded-[1.1rem] bg-white/12 p-3">
            <p className="text-[0.7rem] font-medium text-white/68">Owed</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold">
              {formatPeso(debt)}
            </p>
          </div>
        </div>
      </div>
      {accounts.length === 0 ? (
        <EmptyState
          icon={<RiBankLine aria-hidden="true" />}
          title="No accounts yet"
          description="Start with an institution, then choose the product you have there."
          action={
            <AccountDialog
              trigger={
                <Button className="rounded-full">
                  <RiAddLine data-icon="inline-start" aria-hidden="true" />
                  Add first account
                </Button>
              }
            />
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
          {accounts.map((account) => (
            <AccountRow key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  )
}

function AccountRow({ account }: { account: Account }) {
  const institution = getAccountInstitution(account)
  const productLabel = getAccountProductLabel(account.accountProductType)
  const creditCard = isCreditCardAccount(account)
  const balanceTone = isDebtAccount(account)
    ? "text-destructive"
    : "text-foreground"
  const status = getCreditCardStatus(account)
  const availableCredit = calculateAvailableCredit(account)
  const color = account.color ?? institution.color

  return (
    <div className="flex items-start gap-3 border-b border-border/70 px-4 py-3 last:border-b-0">
      <InstitutionLogo
        color={color}
        institutionKey={account.institutionKey}
        logoAsset={institution.logoAsset}
        logoText={institution.logoText}
        size="lg"
        textColor={institution.textColor}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {account.displayName}
          </p>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-semibold text-muted-foreground">
            {productLabel}
          </span>
        </div>
        {creditCard ? (
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-destructive">
                {formatPeso(account.balanceCentavos)} owed
              </span>
            </p>
            <p>
              {formatPeso(availableCredit ?? 0)} available of{" "}
              {formatPeso(account.creditLimitCentavos ?? 0)}
            </p>
            {(status.statementLabel || status.dueLabel) && (
              <p>
                {[status.statementLabel, status.dueLabel]
                  .filter(Boolean)
                  .join(" - ")}
              </p>
            )}
            {status.isOverLimit && (
              <p className="font-semibold text-destructive">Over limit</p>
            )}
          </div>
        ) : (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {getBalanceNature(account) === "liability"
              ? `${formatPeso(account.balanceCentavos)} owed`
              : `${formatPeso(account.balanceCentavos)} balance`}
            {!account.includeInNetWorth ? " - excluded from net worth" : ""}
          </p>
        )}
        <div className="mt-2 flex items-center gap-1">
          <AccountDialog
            account={account}
            trigger={
              <Button
                aria-label={`Edit ${account.displayName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Archive this account?"
            description="Accounts with transactions are archived instead of removed so past balances stay correct."
            confirmLabel="Archive"
            trigger={
              <Button
                aria-label={`Archive ${account.displayName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiArchiveLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await archiveAccount(account.id)
              toast.success("Account archived")
            }}
          />
          <ConfirmDialog
            title="Delete this account?"
            description="If it has transactions, PesoPilot will archive it instead."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${account.displayName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              const result = await deleteAccount(account.id)
              toast.success(
                result === "archived" ? "Account archived" : "Account deleted"
              )
            }}
          />
        </div>
      </div>
      {!creditCard && (
        <div className="min-w-[7rem] text-right">
          <p className={cn("font-mono text-sm font-semibold", balanceTone)}>
            {formatPeso(account.balanceCentavos)}
          </p>
          <p className="mt-1 text-[0.68rem] font-semibold text-muted-foreground">
            {getBalanceNature(account) === "liability" ? "Owed" : "Asset"}
          </p>
        </div>
      )}
    </div>
  )
}

function AccountDialog({
  account,
  trigger,
}: {
  account?: Account
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)

  return (
    <BottomSheetForm
      description="Select an institution, then choose the product you have there."
      open={open}
      title={account ? "Edit account" : "Add account"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <AccountForm
        key={account?.id ?? "new-account"}
        initialValues={getInitialValues(account)}
        isEditing={!!account}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}

function AccountForm({
  initialValues,
  isEditing,
  onSaved,
}: {
  initialValues: AccountFormValues
  isEditing: boolean
  onSaved: () => void
}) {
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
          accountProductType === "credit_card" ? current.statementDay ?? 15 : undefined,
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
        accountProductType === "credit_card" ? current.statementDay ?? 15 : undefined,
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
      toNumber(values.openingBalance) > toNumber(values.creditLimit) &&
      window.confirm(
        "Current amount owed is above the credit limit. Save this over-limit balance?"
      )

    if (
      isCreditCard &&
      toNumber(values.openingBalance) > toNumber(values.creditLimit) &&
      !shouldSaveOverLimit
    ) {
      return
    }

    setIsSaving(true)

    try {
      await saveAccount({
        ...values,
        allowOverLimit: shouldSaveOverLimit,
      })
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
          <div className="grid grid-cols-2 gap-3">
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
          </div>
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
          {isSaving ? "Saving..." : "Save account"}
        </Button>
      </div>
    </form>
  )
}

function toNumber(value?: string) {
  const parsed = Number.parseFloat(value?.replace(/[^\d.-]/g, "") ?? "")

  return Number.isFinite(parsed) ? parsed : 0
}
