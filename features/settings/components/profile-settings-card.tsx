"use client"

import { useState } from "react"
import { RiSaveLine, RiUserLine } from "@remixicon/react"
import { toast } from "sonner"

import type { AppSettings } from "@/types/finance"
import {
  AttachmentField,
  type PreparedImageAttachment,
} from "@/features/attachments"
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
import { savePreparedAttachments } from "@/lib/db/services/attachment-writes"

export function ProfileSettingsCard({ settings }: { settings: AppSettings }) {
  const [displayName, setDisplayName] = useState(settings.displayName ?? "")
  const [attachmentDrafts, setAttachmentDrafts] = useState<
    PreparedImageAttachment[]
  >([])
  const [isSaving, setIsSaving] = useState(false)
  const previewName = getSettingsDisplayName({ ...settings, displayName })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const savedSettings = await saveDisplayName(displayName)
      await savePreparedAttachments({
        ownerType: "profile",
        ownerId: savedSettings.id,
        purpose: "profile_image",
        prepared: attachmentDrafts,
      })
      setAttachmentDrafts([])
      toast.success("Profile saved")
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
            <AttachmentField
              description="This picture is stored only in this browser and your encrypted backups."
              disabled={isSaving}
              id="profile-image"
              label="Profile picture"
              ownerId={settings.id}
              ownerType="profile"
              purpose="profile_image"
              value={attachmentDrafts}
              onChange={setAttachmentDrafts}
            />
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
            {isSaving ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
