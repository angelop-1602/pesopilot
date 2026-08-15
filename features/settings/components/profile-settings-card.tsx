"use client"

import { useState } from "react"
import { RiSaveLine, RiUserLine } from "@remixicon/react"
import { toast } from "sonner"

import type { AppSettings } from "@/types/finance"
import { saveDisplayName } from "@/features/settings/services/profile-settings-commands"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { getSettingsDisplayName } from "@/lib/finance/settings"

export function ProfileSettingsCard({ settings }: { settings: AppSettings }) {
  const [displayName, setDisplayName] = useState(settings.displayName ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const previewName = getSettingsDisplayName({ ...settings, displayName })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveDisplayName(displayName)
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
            {isSaving ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RiSaveLine data-icon="inline-start" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Save name"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
