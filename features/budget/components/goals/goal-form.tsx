"use client"

import { useState } from "react"
import { toast } from "sonner"

import type {
  Account,
  SavingsGoal,
} from "@/types/finance"
import type { GoalFormValues } from "@/features/budget/types/goal-form"
import {
  AttachmentField,
  type PreparedImageAttachment,
} from "@/features/attachments"
import { saveGoal } from "@/features/budget/services/goal-commands"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { savePreparedAttachments } from "@/lib/db/services/attachment-writes"

export function GoalForm({
  accounts,
  initialValues,
  onSaved,
}: {
  accounts: Account[]
  initialValues: GoalFormValues
  onSaved: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [attachmentDrafts, setAttachmentDrafts] = useState<
    PreparedImageAttachment[]
  >([])
  const [isSaving, setIsSaving] = useState(false)

  const updateValue = <Key extends keyof GoalFormValues>(
    key: Key,
    value: GoalFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const goal = await saveGoal(values)
      await savePreparedAttachments({
        ownerType: "goal",
        ownerId: goal.id,
        purpose: "goal_cover",
        prepared: attachmentDrafts,
      })
      setAttachmentDrafts([])
      toast.success("Goal saved")
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="flex flex-col gap-4 pb-1" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="goal-name">Name</FieldLabel>
          <Input
            id="goal-name"
            placeholder="Emergency fund"
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
          />
        </Field>
        <AttachmentField
          description="Choose an optional cover image that makes this goal easy to recognize."
          disabled={isSaving}
          id="goal-cover"
          label="Cover image"
          ownerId={initialValues.id}
          ownerType="goal"
          purpose="goal_cover"
          value={attachmentDrafts}
          onChange={setAttachmentDrafts}
        />
        <FieldGroup className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="goal-target">Target</FieldLabel>
            <Input
              id="goal-target"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.target}
              onChange={(event) => updateValue("target", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="goal-current">Current</FieldLabel>
            <Input
              id="goal-current"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.current}
              onChange={(event) => updateValue("current", event.target.value)}
            />
          </Field>
        </FieldGroup>
        <Field>
          <FieldLabel htmlFor="goal-target-date">Target date</FieldLabel>
          <Input
            id="goal-target-date"
            type="date"
            value={values.targetDate ?? ""}
            onChange={(event) => updateValue("targetDate", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="goal-account">Linked account</FieldLabel>
          <NativeSelect
            id="goal-account"
            value={values.linkedAccountId ?? ""}
            onChange={(event) =>
              updateValue("linkedAccountId", event.target.value)
            }
          >
            <NativeSelectOption value="">No link</NativeSelectOption>
            {accounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.displayName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="goal-status">Status</FieldLabel>
          <NativeSelect
            id="goal-status"
            value={values.status}
            onChange={(event) =>
              updateValue("status", event.target.value as SavingsGoal["status"])
            }
          >
            <NativeSelectOption value="active">Active</NativeSelectOption>
            <NativeSelectOption value="paused">Paused</NativeSelectOption>
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
          </NativeSelect>
        </Field>
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button
          className="h-11 w-full rounded-full"
          disabled={isSaving}
          type="submit"
        >
          {isSaving && <Spinner data-icon="inline-start" />}
          {isSaving ? "Saving..." : "Save goal"}
        </Button>
      </div>
    </form>
  )
}
