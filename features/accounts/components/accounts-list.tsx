import { RiAddLine, RiBankLine } from "@remixicon/react"

import type { Account } from "@/types/finance"
import { AccountDialog } from "@/features/accounts/components/account-dialog"
import { AccountRow } from "@/features/accounts/components/account-row"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export function AccountsList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
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
    )
  }

  return (
    <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
      {accounts.map((account) => (
        <AccountRow key={account.id} account={account} />
      ))}
    </div>
  )
}
