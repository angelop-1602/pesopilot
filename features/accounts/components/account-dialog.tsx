"use client"

import { useState, type ReactElement } from "react"

import type { Account } from "@/types/finance"
import { AccountForm } from "@/features/accounts/components/account-form"
import { getInitialAccountFormValues } from "@/features/accounts/utils/account-form-values"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"

export function AccountDialog({
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
        initialValues={getInitialAccountFormValues(account)}
        isEditing={Boolean(account)}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}
