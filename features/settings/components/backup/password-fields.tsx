"use client"

import { useState } from "react"
import {
  RiEyeLine,
  RiEyeOffLine,
  RiFileCopyLine,
  RiMagicLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { generateBackupPassword } from "@/features/settings/utils/backup"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface PasswordFieldsProps {
  password: string
  confirmPassword: string
  passwordId: string
  confirmPasswordId: string
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
}

export function PasswordFields({
  password,
  confirmPassword,
  passwordId,
  confirmPasswordId,
  onPasswordChange,
  onConfirmPasswordChange,
}: PasswordFieldsProps) {
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
