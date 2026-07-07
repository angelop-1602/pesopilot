"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiFolderShieldLine,
  RiHardDrive3Line,
  RiMagicLine,
  RiRefreshLine,
  RiSaveLine,
  RiUploadLine,
  RiUserLine,
} from "@remixicon/react"
import { toast } from "sonner"

import type { AppSettings } from "@/types/finance"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { PageHeader } from "@/components/app/page-header"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  createEncryptedBackup,
  disableAutomaticBackup,
  enableAutomaticBackup,
  getAutomaticBackupStatus,
  resetLocalData,
  restoreBackupFile,
  writeAutomaticBackup,
  type AutomaticBackupStatus,
} from "@/lib/db/repositories/backup"
import { updateSettings } from "@/lib/db/repositories/settings"
import { getSettingsDisplayName } from "@/lib/finance/settings"
import { useFinanceData } from "@/lib/hooks/use-finance-data"

export function SettingsWorkspace() {
  const { data } = useFinanceData()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Settings"
        description="Profile, backup, and PWA storage controls."
      />
      <DisplayNameCard key={data.settings.updatedAt} settings={data.settings} />
      <BackupCard />
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
    </div>
  )
}

function DisplayNameCard({ settings }: { settings: AppSettings }) {
  const [displayName, setDisplayName] = useState(settings.displayName ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const previewName = getSettingsDisplayName({
    ...settings,
    displayName,
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await updateSettings({ displayName: displayName.trim() })
      toast.success("Display name saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <RiUserLine aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This name appears in headers and report-ready settings data.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="settings-display-name">
                Display name
              </FieldLabel>
              <Input
                id="settings-display-name"
                placeholder="Your name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
              <FieldDescription>
                Current display: {previewName}
              </FieldDescription>
            </Field>
          </FieldGroup>
          <Button className="self-start" disabled={isSaving} type="submit">
            <RiSaveLine data-icon="inline-start" aria-hidden="true" />
            {isSaving ? "Saving..." : "Save name"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function BackupCard() {
  const [status, setStatus] = useState<AutomaticBackupStatus | null>(null)
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)

  const refreshStatus = useCallback(async () => {
    setStatus(await getAutomaticBackupStatus())
  }, [])

  useEffect(() => {
    let active = true

    void getAutomaticBackupStatus().then((nextStatus) => {
      if (active) {
        setStatus(nextStatus)
      }
    })

    return () => {
      active = false
    }
  }, [])

  const automaticBackupReady = Boolean(
    status?.enabled && status.hasFileHandle
  )

  const handleBackupNow = async () => {
    setIsBackingUp(true)

    try {
      const result = await writeAutomaticBackup()

      if (result.wrote) {
        toast.success("Automatic backup updated")
      } else {
        toast.info("Automatic backup is not enabled")
      }

      await refreshStatus()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Backup failed.")
      await refreshStatus()
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDisable = async () => {
    setIsDisabling(true)

    try {
      await disableAutomaticBackup()
      toast.success("Automatic backup turned off")
      await refreshStatus()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to turn off backup."
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
            {status?.lastError && (
              <p className="text-destructive">{status.lastError}</p>
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
                  <RiRefreshLine data-icon="inline-start" aria-hidden="true" />
                  {isBackingUp ? "Backing up..." : "Back up now"}
                </Button>
                <Button
                  disabled={isDisabling}
                  variant="ghost"
                  onClick={handleDisable}
                >
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
          <ImportDialog />
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

function EnableAutomaticBackupDialog({
  disabled,
  onEnabled,
}: {
  disabled?: boolean
  onEnabled: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isEnabling, setIsEnabling] = useState(false)

  const reset = () => {
    setPassword("")
    setConfirmPassword("")
  }

  const handleEnable = async () => {
    if (password.trim().length < 8) {
      toast.error("Backup password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Backup passwords do not match.")
      return
    }

    setIsEnabling(true)

    try {
      await enableAutomaticBackup(password)
      toast.success("Automatic backup enabled")
      await onEnabled()
      reset()
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to enable automatic backup."
      )
    } finally {
      setIsEnabling(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}
    >
      <DialogTrigger render={<Button disabled={disabled} />}>
        <RiFolderShieldLine data-icon="inline-start" aria-hidden="true" />
        Enable automatic
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable automatic backup</DialogTitle>
          <DialogDescription>
            Choose a backup file and protect it with a password.
          </DialogDescription>
        </DialogHeader>
        <PasswordFields
          password={password}
          confirmPassword={confirmPassword}
          passwordId="auto-backup-password"
          confirmPasswordId="auto-backup-confirm-password"
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
        />
        <DialogFooter>
          <Button disabled={isEnabling} onClick={handleEnable}>
            {isEnabling ? "Enabling..." : "Choose file and enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EncryptedExportDialog() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isExporting, setIsExporting] = useState(false)

  const reset = () => {
    setPassword("")
    setConfirmPassword("")
  }

  const handleExport = async () => {
    if (password.trim().length < 8) {
      toast.error("Backup password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Backup passwords do not match.")
      return
    }

    setIsExporting(true)

    try {
      const { backup, blob } = await createEncryptedBackup(password)
      downloadBlob(
        blob,
        `pesopilot-backup-${backup.exportedAt.slice(0, 10)}.ppbackup`
      )
      toast.success("Encrypted backup exported")
      reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to export.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <RiDownloadLine data-icon="inline-start" aria-hidden="true" />
        Export encrypted
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export encrypted backup</DialogTitle>
          <DialogDescription>
            This creates a password-protected .ppbackup file.
          </DialogDescription>
        </DialogHeader>
        <PasswordFields
          password={password}
          confirmPassword={confirmPassword}
          passwordId="export-backup-password"
          confirmPasswordId="export-backup-confirm-password"
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
        />
        <DialogFooter>
          <Button disabled={isExporting} onClick={handleExport}>
            {isExporting ? "Exporting..." : "Export backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ImportDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setPassword("")
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  const handleRestore = async () => {
    if (!file) {
      toast.error("Choose a backup file first.")
      return
    }

    setIsRestoring(true)
    try {
      await restoreBackupFile(file, password || undefined)
      toast.success("Backup restored")
      reset()
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to restore.")
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          reset()
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <RiUploadLine data-icon="inline-start" aria-hidden="true" />
        Import backup
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore backup</DialogTitle>
          <DialogDescription>
            Restoring replaces the current local data after validation.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="backup-file">Backup file</FieldLabel>
            <Input
              accept=".json,.ppbackup,application/json"
              id="backup-file"
              ref={inputRef}
              type="file"
              onChange={(event) =>
                setFile(event.target.files?.item(0) ?? null)
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="backup-password">Backup password</FieldLabel>
            <Input
              autoComplete="current-password"
              id="backup-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <FieldDescription>
              Required for encrypted .ppbackup files.
            </FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            disabled={isRestoring}
            variant="destructive"
            onClick={handleRestore}
          >
            {isRestoring ? "Restoring..." : "Restore backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PasswordFields({
  password,
  confirmPassword,
  passwordId,
  confirmPasswordId,
  onPasswordChange,
  onConfirmPasswordChange,
}: {
  password: string
  confirmPassword: string
  passwordId: string
  confirmPasswordId: string
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
}) {
  const [passwordVisible, setPasswordVisible] = useState(false)

  const handleGeneratePassword = () => {
    try {
      const generatedPassword = generateBackupPassword()

      onPasswordChange(generatedPassword)
      onConfirmPasswordChange(generatedPassword)
      setPasswordVisible(true)
      toast.success("Password generated")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to generate password."
      )
    }
  }

  const handleCopyPassword = async () => {
    if (!password) {
      toast.error("Generate or enter a password first.")
      return
    }

    try {
      await navigator.clipboard.writeText(password)
      toast.success("Password copied")
    } catch {
      toast.error("Unable to copy password.")
    }
  }

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={passwordId}>Backup password</FieldLabel>
        <Input
          autoComplete="new-password"
          id={passwordId}
          type={passwordVisible ? "text" : "password"}
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
        />
        <FieldDescription>At least 8 characters.</FieldDescription>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={handleGeneratePassword}
          >
            <RiMagicLine data-icon="inline-start" aria-hidden="true" />
            Generate
          </Button>
          <Button
            size="sm"
            type="button"
            variant="outline"
            onClick={() => setPasswordVisible((current) => !current)}
          >
            {passwordVisible ? (
              <RiEyeOffLine data-icon="inline-start" aria-hidden="true" />
            ) : (
              <RiEyeLine data-icon="inline-start" aria-hidden="true" />
            )}
            {passwordVisible ? "Hide" : "Show"}
          </Button>
          <Button
            disabled={!password}
            size="sm"
            type="button"
            variant="outline"
            onClick={handleCopyPassword}
          >
            <RiFileCopyLine data-icon="inline-start" aria-hidden="true" />
            Copy
          </Button>
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor={confirmPasswordId}>Confirm password</FieldLabel>
        <Input
          autoComplete="new-password"
          id={confirmPasswordId}
          type={passwordVisible ? "text" : "password"}
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
        />
      </Field>
    </FieldGroup>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function formatBackupTimestamp(value?: string) {
  if (!value) {
    return "Never"
  }

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

const BACKUP_PASSWORD_ALPHABET =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?"

function generateBackupPassword(length = 24) {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure password generation is not available.")
  }

  const password: string[] = []
  const maxValue =
    Math.floor(256 / BACKUP_PASSWORD_ALPHABET.length) *
      BACKUP_PASSWORD_ALPHABET.length -
    1

  while (password.length < length) {
    const bytes = new Uint8Array(length)
    globalThis.crypto.getRandomValues(bytes)

    for (const byte of bytes) {
      if (byte > maxValue) {
        continue
      }

      password.push(
        BACKUP_PASSWORD_ALPHABET[byte % BACKUP_PASSWORD_ALPHABET.length]
      )

      if (password.length === length) {
        break
      }
    }
  }

  return password.join("")
}
