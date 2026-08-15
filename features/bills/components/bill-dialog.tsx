"use client"

import { useState, type ReactElement } from "react"

import type { Account, Bill, Category } from "@/types/finance"
import { BillForm } from "@/features/bills/components/bill-form"
import { getInitialBillFormValues } from "@/features/bills/utils/bill-form-values"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"

interface BillDialogProps {
  accounts: Account[]
  bill?: Bill
  categories: Category[]
  trigger: ReactElement
}

export function BillDialog({
  accounts,
  bill,
  categories,
  trigger,
}: BillDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <BottomSheetForm
      description="Bills live here so transaction capture stays fast and navigation stays light."
      open={open}
      title={bill ? "Edit bill" : "Add recurring bill"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <BillForm
        accounts={accounts}
        categories={categories.filter(
          (category) => category.kind === "expense"
        )}
        initialValues={getInitialBillFormValues(bill)}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}
