"use client"

import { useState, type ReactElement, type ReactNode } from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"

interface ConfirmDialogProps {
  trigger: ReactElement
  title: string
  description: string
  confirmLabel?: string
  children?: ReactNode
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Continue",
  children,
  onConfirm,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsConfirming(true)
    setError(null)

    try {
      await onConfirm()
      setOpen(false)
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Unable to complete this action."
      )
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isConfirming) {
          setOpen(nextOpen)
          if (!nextOpen) setError(null)
        }
      }}
    >
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isConfirming}
            variant="destructive"
            onClick={handleConfirm}
          >
            {isConfirming && <Spinner data-icon="inline-start" />}
            {isConfirming ? "Working..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
