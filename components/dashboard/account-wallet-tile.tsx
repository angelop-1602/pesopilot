"use client"

import type { Account } from "@/types/finance"
import { InstitutionLogo } from "@/components/accounts/institution-logo"
import { getAccountProductLabel } from "@/lib/constants/account-products"
import { getAccountInstitution } from "@/lib/constants/institutions"
import {
  calculateAvailableCredit,
  getCreditCardStatus,
  isCreditCardAccount,
} from "@/lib/finance/accounts"
import { isDebtAccount } from "@/lib/finance/calculations"
import { formatPeso } from "@/lib/finance/currency"
import { cn } from "@/lib/utils"

export function AccountWalletTile({ account }: { account: Account }) {
  const isDebt = isDebtAccount(account)
  const isCreditCard = isCreditCardAccount(account)
  const institution = getAccountInstitution(account)
  const status = getCreditCardStatus(account)
  const availableCredit = calculateAvailableCredit(account)

  return (
    <div
      className="w-40 shrink-0 rounded-[1.4rem] border bg-white/78 p-3 shadow-[0_12px_28px_rgba(15,23,42,0.07)]"
      style={{ borderColor: `${account.color ?? institution.color}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <InstitutionLogo
          color={account.color ?? institution.color}
          institutionKey={account.institutionKey}
          logoAsset={institution.logoAsset}
          logoText={institution.logoText}
          size="md"
          textColor={institution.textColor}
        />
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.625rem] font-semibold",
            isDebt
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
          )}
        >
          {getAccountProductLabel(account.accountProductType)}
        </span>
      </div>
      <div className="mt-4 min-w-0">
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {account.displayName}
        </p>
        {isCreditCard ? (
          <>
            <p className="mt-1 truncate font-mono text-base font-semibold text-destructive">
              {formatPeso(account.balanceCentavos)} owed
            </p>
            <p className="mt-1 truncate text-[0.68rem] font-medium text-muted-foreground">
              {formatPeso(availableCredit ?? 0)} available
            </p>
            <p className="truncate text-[0.68rem] font-medium text-muted-foreground">
              of {formatPeso(account.creditLimitCentavos ?? 0)}
            </p>
            {status.dueLabel && (
              <p className="mt-1 truncate text-[0.65rem] font-semibold text-muted-foreground">
                {status.dueLabel}
              </p>
            )}
          </>
        ) : (
          <p
            className={cn(
              "mt-1 truncate font-mono text-lg font-semibold",
              isDebt && "text-destructive"
            )}
          >
            {formatPeso(account.balanceCentavos)}
          </p>
        )}
      </div>
    </div>
  )
}
