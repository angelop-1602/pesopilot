"use client"

import { RiErrorWarningLine } from "@remixicon/react"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface PageErrorProps {
  title: string
  description?: string
  onRetry?: () => void
}

export function PageError({
  title,
  description = "Your local finance data could not be read. Reload the app to try again.",
  onRetry = () => window.location.reload(),
}: PageErrorProps) {
  return (
    <Alert variant="destructive">
      <RiErrorWarningLine aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={onRetry}>
          Reload
        </Button>
      </AlertAction>
    </Alert>
  )
}
