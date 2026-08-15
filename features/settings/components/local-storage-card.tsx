"use client"

import { RiDeleteBinLine } from "@remixicon/react"
import { toast } from "sonner"

import { resetLocalData } from "@/features/settings/services/local-data"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function LocalStorageCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Local-first storage</CardTitle>
        <CardDescription>
          Finance records are stored in IndexedDB on this device. No backend,
          account, or external finance API is used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConfirmDialog
          title="Reset all local data?"
          description="This clears accounts, transactions, budgets, goals, bills, settings, and automatic backup permissions from this browser."
          confirmLabel="Reset"
          trigger={
            <Button variant="destructive">
              <RiDeleteBinLine data-icon="inline-start" aria-hidden="true" />
              Reset data
            </Button>
          }
          onConfirm={async () => {
            await resetLocalData()
            toast.success("Local data reset")
          }}
        />
      </CardContent>
    </Card>
  )
}
