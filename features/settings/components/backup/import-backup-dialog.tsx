"use client"

import { useRef, useState } from "react"
import { RiUploadLine } from "@remixicon/react"
import { toast } from "sonner"

import { restoreBackupFile } from "@/features/settings/services/finance-backup"
import { Button } from "@/components/ui/button"
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
import { Spinner } from "@/components/ui/spinner"

export function ImportBackupDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [isRestoring, setIsRestoring] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setFile(null)
    setPassword("")
    if (inputRef.current) inputRef.current.value = ""
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
        if (!isRestoring) {
          setOpen(nextOpen)
          if (!nextOpen) reset()
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
            {isRestoring && <Spinner data-icon="inline-start" />}
            {isRestoring ? "Restoring..." : "Restore backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
