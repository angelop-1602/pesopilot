"use client"

import { useCallback, useState } from "react"
import {
  RiDeleteBinLine,
  RiHardDrive3Line,
  RiShieldCheckLine,
} from "@remixicon/react"
import { toast } from "sonner"

import {
  getLocalStorageStatus,
  requestPersistentLocalStorage,
} from "@/features/settings/services/local-storage-status"
import { resetLocalData } from "@/features/settings/services/local-data"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useLiveQuery } from "@/lib/hooks/use-live-query"

export function LocalStorageCard() {
  const query = useCallback(() => getLocalStorageStatus(), [])
  const { data, error, isLoading, refresh } = useLiveQuery(query, {
    attachmentBytes: 0,
    attachmentCount: 0,
    persisted: null,
    quotaBytes: null,
    storageApiSupported: false,
    usageBytes: null,
  })
  const [isRequestingPersistence, setIsRequestingPersistence] =
    useState(false)
  const usagePercentage =
    data.usageBytes !== null && data.quotaBytes
      ? Math.min(100, (data.usageBytes / data.quotaBytes) * 100)
      : 0

  const handleProtectStorage = async () => {
    setIsRequestingPersistence(true)

    try {
      const granted = await requestPersistentLocalStorage()
      toast[granted ? "success" : "info"](
        granted
          ? "Local data protection enabled"
          : "The browser did not grant persistent storage. Keep encrypted backups up to date."
      )
      await refresh()
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to request storage protection."
      )
    } finally {
      setIsRequestingPersistence(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Local-first storage</CardTitle>
        <CardDescription>
          Finance records are stored in IndexedDB on this device. No backend,
          account, image host, or external finance API is used.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <RiHardDrive3Line aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">On-device usage</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {isLoading
                    ? "Checking browser storage..."
                    : data.usageBytes === null || data.quotaBytes === null
                      ? "This browser does not report a storage estimate."
                      : `${formatFileSize(data.usageBytes)} used of about ${formatFileSize(data.quotaBytes)} available to this browser origin.`}
                </p>
              </div>
            </div>
            <Badge variant={data.persisted ? "default" : "outline"}>
              {data.persisted ? "Protected" : "Best effort"}
            </Badge>
          </div>
          {data.usageBytes !== null && data.quotaBytes !== null && (
            <Progress
              aria-label="Browser storage used"
              value={usagePercentage}
            />
          )}
          <p className="text-xs text-muted-foreground">
            {data.attachmentCount === 0
              ? "No locally saved images yet."
              : `${data.attachmentCount} saved ${data.attachmentCount === 1 ? "image uses" : "images use"} ${formatFileSize(data.attachmentBytes)}.`}
          </p>
          {Boolean(error) && (
            <p className="text-xs text-destructive">
              Unable to read the current storage estimate.
            </p>
          )}
          {data.storageApiSupported && !data.persisted && (
            <Button
              className="self-start"
              disabled={isRequestingPersistence}
              variant="outline"
              onClick={handleProtectStorage}
            >
              {isRequestingPersistence ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RiShieldCheckLine
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              )}
              {isRequestingPersistence
                ? "Requesting..."
                : "Protect local data"}
            </Button>
          )}
        </section>
        <Separator />
        <ConfirmDialog
          title="Reset all local data?"
          description="This clears accounts, transactions, budgets, goals, bills, settings, locally saved images, and automatic backup permissions from this browser. External .ppbackup files are not deleted."
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

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  const units = ["KB", "MB", "GB", "TB"]
  let value = sizeBytes / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}
