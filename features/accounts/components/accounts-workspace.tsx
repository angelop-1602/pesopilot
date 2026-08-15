"use client"

import { AccountsList } from "@/features/accounts/components/accounts-list"
import { AccountsSummary } from "@/features/accounts/components/accounts-summary"
import { useAccountsWorkspaceData } from "@/features/accounts/hooks/use-accounts-workspace-data"
import { PageError } from "@/components/shared/page-error"
import { PageLoading } from "@/components/shared/page-loading"

export function AccountsWorkspace() {
  const { data, error, isLoading, summary } = useAccountsWorkspaceData()

  if (isLoading) {
    return <PageLoading label="Loading accounts" />
  }

  if (error) {
    return <PageError title="Unable to load your accounts" />
  }

  return (
    <div className="flex flex-col gap-5">
      <AccountsSummary
        availableCentavos={summary.availableCentavos}
        debtCentavos={summary.debtCentavos}
        netWorthCentavos={summary.netWorthCentavos}
      />
      <AccountsList accounts={data.accounts} />
    </div>
  )
}
