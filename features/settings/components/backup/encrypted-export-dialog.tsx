"use client"

import { useState } from "react"
import { RiDownloadLine } from "@remixicon/react"
import { toast } from "sonner"

import { PasswordFields } from "@/features/settings/components/backup/password-fields"
import { createEncryptedBackup } from "@/features/settings/services/finance-backup"
import { downloadBlob } from "@/features/settings/utils/backup"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function EncryptedExportDialog() {
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
        if (!isExporting) {
          setOpen(nextOpen)
          if (!nextOpen) reset()
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
            {isExporting && <Spinner data-icon="inline-start" />}
            {isExporting ? "Exporting..." : "Export backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
