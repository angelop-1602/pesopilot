"use client"

import {
  RiArchiveLine,
  RiDeleteBinLine,
  RiEditLine,
} from "@remixicon/react"
import { toast } from "sonner"

import type { Account } from "@/types/finance"
import { AccountDialog } from "@/features/accounts/components/account-dialog"
import {
  archiveAccount,
  deleteAccount,
} from "@/features/accounts/services/account-commands"
import { InstitutionLogo } from "@/components/shared/institution-logo"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getAccountProductLabel } from "@/lib/constants/account-products"
import { getAccountInstitution } from "@/lib/constants/institutions"
import {
  calculateAvailableCredit,
  getBalanceNature,
  getCreditCardStatus,
  isCreditCardAccount,
} from "@/lib/finance/accounts"
import { isDebtAccount } from "@/lib/finance/account-metrics"
import { formatPeso } from "@/lib/finance/currency"
import { cn } from "@/lib/utils"

export function AccountRow({ account }: { account: Account }) {
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
          <Badge className="shrink-0" variant="secondary">
            {productLabel}
          </Badge>
        </div>
        {creditCard ? (
          <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
            <p className="font-medium text-destructive">
              {formatPeso(account.balanceCentavos)} owed
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
