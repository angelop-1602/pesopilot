"use client"

import { useState } from "react"
import { RiFolderShieldLine } from "@remixicon/react"
import { toast } from "sonner"

import { PasswordFields } from "@/features/settings/components/backup/password-fields"
import { enableAutomaticBackup } from "@/features/settings/services/automatic-backup"
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

export function EnableAutomaticBackupDialog({
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
        if (!isEnabling) {
          setOpen(nextOpen)
          if (!nextOpen) reset()
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
            Choose a backup file for your records and saved images, then
            protect it with a password.
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
            {isEnabling && <Spinner data-icon="inline-start" />}
            {isEnabling ? "Enabling..." : "Choose file and enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
