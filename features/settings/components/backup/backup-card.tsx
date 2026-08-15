"use client"

import { useState } from "react"
import {
  RiFolderShieldLine,
  RiHardDrive3Line,
  RiRefreshLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { EnableAutomaticBackupDialog } from "@/features/settings/components/backup/enable-automatic-backup-dialog"
import { EncryptedExportDialog } from "@/features/settings/components/backup/encrypted-export-dialog"
import { ImportBackupDialog } from "@/features/settings/components/backup/import-backup-dialog"
import { useAutomaticBackupStatus } from "@/features/settings/hooks/use-automatic-backup-status"
import {
  disableAutomaticBackup,
  writeAutomaticBackup,
} from "@/features/settings/services/automatic-backup"
import { formatBackupTimestamp } from "@/features/settings/utils/backup"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

export function BackupCard() {
  const { error, refreshStatus, status } = useAutomaticBackupStatus()
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const automaticBackupReady = Boolean(
    status?.enabled && status.hasFileHandle
  )

  const handleBackupNow = async () => {
    setIsBackingUp(true)

    try {
      const result = await writeAutomaticBackup()
      toast[result.wrote ? "success" : "info"](
        result.wrote
          ? "Automatic backup updated"
          : "Automatic backup is not enabled"
      )
    } catch (nextError) {
      toast.error(
        nextError instanceof Error ? nextError.message : "Backup failed."
      )
    } finally {
      await refreshStatus()
      setIsBackingUp(false)
    }
  }

  const handleDisable = async () => {
    setIsDisabling(true)
    try {
      await disableAutomaticBackup()
      toast.success("Automatic backup turned off")
      await refreshStatus()
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to turn off backup."
      )
    } finally {
      setIsDisabling(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup</CardTitle>
        <CardDescription>
          Keep an encrypted copy outside the app storage, then restore it when
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <section className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <RiFolderShieldLine aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  Automatic encrypted backup
                </div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Writes an encrypted .ppbackup file to a local file you choose.
                </div>
              </div>
            </div>
            <Badge variant={automaticBackupReady ? "default" : "outline"}>
              {automaticBackupReady ? "On" : "Off"}
            </Badge>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground">
            <p>
              Last backup:{" "}
              <span className="text-foreground">
                {formatBackupTimestamp(status?.lastBackupAt)}
              </span>
            </p>
            {(status?.lastError || error) && (
              <p className="text-destructive">
                {status?.lastError ?? error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <EnableAutomaticBackupDialog
              disabled={!status?.supported}
              onEnabled={refreshStatus}
            />
            {automaticBackupReady && (
              <>
                <Button
                  disabled={isBackingUp}
                  variant="outline"
                  onClick={handleBackupNow}
                >
                  {isBackingUp ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <RiRefreshLine
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                  )}
                  {isBackingUp ? "Backing up..." : "Back up now"}
                </Button>
                <Button
                  disabled={isDisabling}
                  variant="ghost"
                  onClick={handleDisable}
                >
                  {isDisabling && <Spinner data-icon="inline-start" />}
                  {isDisabling ? "Turning off..." : "Turn off"}
                </Button>
              </>
            )}
          </div>
          {status?.supported === false && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Automatic file backup needs browser file access. Manual encrypted
              export still works.
            </p>
          )}
        </section>
        <Separator />
        <section className="flex flex-col gap-3">
          <div>
            <div className="text-sm font-medium">Manual backup</div>
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Export an encrypted copy or restore one you already have.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <EncryptedExportDialog />
            <ImportBackupDialog />
          </div>
        </section>
        <Alert>
          <RiHardDrive3Line aria-hidden="true" />
          <AlertTitle>Device file backup</AlertTitle>
          <AlertDescription>
            The automatic copy can survive app uninstall only while the chosen
            backup file remains on the device.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
