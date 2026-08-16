"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiImageLine,
} from "@remixicon/react"

import type {
  AttachmentMetadata,
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import {
  ImageAttachmentError,
  prepareImageAttachment,
  SUPPORTED_IMAGE_MIME_TYPES,
  type PreparedImageAttachment,
} from "@/lib/attachments/image-processing"
import {
  deleteAttachment,
  getAttachmentOriginalBlob,
} from "@/lib/db/services/attachment-writes"
import {
  useAttachmentObjectUrl,
  useOwnerAttachments,
} from "@/features/attachments/hooks/use-owner-attachments"

interface AttachmentPreview {
  blob: Blob
  fileName: string
  height: number
  width: number
}

export interface AttachmentFieldProps {
  description?: string
  disabled?: boolean
  id: string
  label: string
  maxFiles?: number
  multiple?: boolean
  ownerId?: string
  ownerType: AttachmentOwnerType
  purpose: AttachmentPurpose
  value: PreparedImageAttachment[]
  onChange: (value: PreparedImageAttachment[]) => void
}

export function AttachmentField({
  description,
  disabled = false,
  id,
  label,
  maxFiles: requestedMaxFiles,
  multiple = false,
  ownerId,
  ownerType,
  purpose,
  value,
  onChange,
}: AttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<AttachmentPreview>()
  const [previewLoadingId, setPreviewLoadingId] = useState<string>()
  const stored = useOwnerAttachments(ownerType, ownerId, purpose)
  const requestedLimit = requestedMaxFiles ?? (multiple ? 3 : 1)
  const maxFiles = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.trunc(requestedLimit))
    : multiple
      ? 3
      : 1
  const visibleStored = !multiple && value.length > 0 ? [] : stored.data
  const attachmentCount = multiple
    ? stored.data.length + value.length
    : value.length > 0
      ? value.length
      : stored.data.length
  const atLimit = multiple
    ? attachmentCount >= maxFiles
    : value.length >= 1
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = errorMessage || stored.error ? `${id}-error` : undefined

  const handleFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? [])

    if (selectedFiles.length === 0) {
      return
    }

    const availableSlots = multiple
      ? Math.max(maxFiles - attachmentCount, 0)
      : value.length > 0
        ? 0
        : 1

    if (availableSlots === 0) {
      setErrorMessage(`Remove an image before adding another one.`)
      return
    }

    const filesToProcess = selectedFiles.slice(
      0,
      multiple ? availableSlots : 1
    )
    const skippedCount = selectedFiles.length - filesToProcess.length
    const prepared: PreparedImageAttachment[] = []
    const processingErrors: string[] = []

    setIsProcessing(true)
    setErrorMessage(undefined)

    try {
      for (const file of filesToProcess) {
        try {
          prepared.push(await prepareImageAttachment(file))
        } catch (error) {
          processingErrors.push(getAttachmentErrorMessage(error, file.name))
        }
      }

      if (prepared.length > 0) {
        onChange([...value, ...prepared])
      }

      if (skippedCount > 0) {
        processingErrors.push(
          `${skippedCount} image${skippedCount === 1 ? " was" : "s were"} skipped because the ${maxFiles}-image limit was reached.`
        )
      }

      setErrorMessage(processingErrors.join(" ") || undefined)
    } finally {
      setIsProcessing(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const previewStoredAttachment = async (attachment: AttachmentMetadata) => {
    setPreviewLoadingId(attachment.id)
    setErrorMessage(undefined)

    try {
      const blob = await getAttachmentOriginalBlob(attachment.id)

      if (!blob) {
        throw new Error("The original image is no longer available.")
      }

      setPreview({
        blob,
        fileName: attachment.fileName,
        height: attachment.height,
        width: attachment.width,
      })
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to preview the image."
      )
    } finally {
      setPreviewLoadingId(undefined)
    }
  }

  return (
    <>
      <Field
        aria-busy={isProcessing || stored.isLoading}
        data-invalid={Boolean(errorId)}
        data-disabled={disabled || undefined}
      >
        <div className="flex items-center justify-between gap-3">
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Button
            aria-describedby={descriptionId}
            className="h-11 rounded-full px-4"
            disabled={disabled || isProcessing || stored.isLoading || atLimit}
            size="sm"
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
          >
            {isProcessing ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <RiAddLine data-icon="inline-start" aria-hidden="true" />
            )}
            {isProcessing ? "Processing..." : "Add image"}
          </Button>
        </div>
        <input
          accept={SUPPORTED_IMAGE_MIME_TYPES.join(",")}
          aria-describedby={
            [descriptionId, errorId].filter(Boolean).join(" ") || undefined
          }
          aria-invalid={Boolean(errorId)}
          className="sr-only"
          disabled={disabled || isProcessing || stored.isLoading || atLimit}
          id={id}
          multiple={multiple}
          ref={inputRef}
          type="file"
          onChange={(event) => void handleFiles(event.currentTarget.files)}
        />
        {description && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )}
        <div aria-live="polite" className="sr-only" role="status">
          {isProcessing
            ? "Processing selected images."
            : `${attachmentCount} of ${maxFiles} images selected.`}
        </div>
        {stored.isLoading ? (
          <div className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
            <Spinner />
            Loading saved images
          </div>
        ) : attachmentCount > 0 ? (
          <AttachmentGroup aria-label={`${label} images`} role="list">
            {visibleStored.map((attachment) => (
              <StoredAttachmentItem
                attachment={attachment}
                disabled={disabled}
                isPreviewLoading={previewLoadingId === attachment.id}
                key={attachment.id}
                onPreview={() => void previewStoredAttachment(attachment)}
              />
            ))}
            {value.map((attachment, index) => (
              <PendingAttachmentItem
                attachment={attachment}
                disabled={disabled}
                key={`${attachment.fileName}-${attachment.sizeBytes}-${index}`}
                onPreview={() =>
                  setPreview({
                    blob: attachment.blob,
                    fileName: attachment.fileName,
                    height: attachment.height,
                    width: attachment.width,
                  })
                }
                onRemove={() =>
                  onChange(value.filter((_, itemIndex) => itemIndex !== index))
                }
              />
            ))}
          </AttachmentGroup>
        ) : (
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-dashed px-3 text-xs text-muted-foreground">
            <RiImageLine aria-hidden="true" />
            No image selected
          </div>
        )}
        <FieldError id={errorId}>
          {errorMessage ??
            (stored.error
              ? "Unable to load saved images. Try reopening this form."
              : undefined)}
        </FieldError>
      </Field>
      <AttachmentPreviewDialog
        preview={preview}
        onOpenChange={(open) => {
          if (!open) {
            setPreview(undefined)
          }
        }}
      />
    </>
  )
}

function StoredAttachmentItem({
  attachment,
  disabled,
  isPreviewLoading,
  onPreview,
}: {
  attachment: AttachmentMetadata
  disabled: boolean
  isPreviewLoading: boolean
  onPreview: () => void
}) {
  const thumbnailUrl = useAttachmentObjectUrl(attachment.thumbnailBlob)

  return (
    <Attachment
      className="w-[min(22rem,calc(100vw-3rem))] flex-nowrap"
      role="listitem"
      state="done"
    >
      <AttachmentThumbnail
        fileName={attachment.fileName}
        source={thumbnailUrl}
      />
      <AttachmentContent>
        <AttachmentTitle>{attachment.fileName}</AttachmentTitle>
        <AttachmentDescription>
          Saved - {formatFileSize(attachment.sizeBytes)}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions className="gap-1">
        <AttachmentAction
          aria-label={`Preview ${attachment.fileName}`}
          className="size-11 rounded-full"
          disabled={disabled || isPreviewLoading}
          size="icon"
          type="button"
          onClick={onPreview}
        >
          {isPreviewLoading ? <Spinner /> : <RiEyeLine aria-hidden="true" />}
        </AttachmentAction>
        <ConfirmDialog
          confirmLabel="Remove"
          description={`Remove ${attachment.fileName} from this record? This cannot be undone.`}
          title="Remove saved image?"
          trigger={
            <AttachmentAction
              aria-label={`Remove ${attachment.fileName}`}
              className="size-11 rounded-full"
              disabled={disabled}
              size="icon"
              type="button"
            >
              <RiDeleteBinLine aria-hidden="true" />
            </AttachmentAction>
          }
          onConfirm={async () => {
            await deleteAttachment(attachment.id)
          }}
        />
      </AttachmentActions>
    </Attachment>
  )
}

function PendingAttachmentItem({
  attachment,
  disabled,
  onPreview,
  onRemove,
}: {
  attachment: PreparedImageAttachment
  disabled: boolean
  onPreview: () => void
  onRemove: () => void
}) {
  const thumbnailUrl = useAttachmentObjectUrl(attachment.thumbnailBlob)

  return (
    <Attachment
      className="w-[min(22rem,calc(100vw-3rem))] flex-nowrap"
      role="listitem"
      state="idle"
    >
      <AttachmentThumbnail
        fileName={attachment.fileName}
        source={thumbnailUrl}
      />
      <AttachmentContent>
        <AttachmentTitle>{attachment.fileName}</AttachmentTitle>
        <AttachmentDescription>
          Ready to save - {formatFileSize(attachment.sizeBytes)}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions className="gap-1">
        <AttachmentAction
          aria-label={`Preview ${attachment.fileName}`}
          className="size-11 rounded-full"
          disabled={disabled}
          size="icon"
          type="button"
          onClick={onPreview}
        >
          <RiEyeLine aria-hidden="true" />
        </AttachmentAction>
        <AttachmentAction
          aria-label={`Remove ${attachment.fileName}`}
          className="size-11 rounded-full"
          disabled={disabled}
          size="icon"
          type="button"
          onClick={onRemove}
        >
          <RiDeleteBinLine aria-hidden="true" />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
}

function AttachmentThumbnail({
  fileName,
  source,
}: {
  fileName: string
  source?: string
}) {
  return (
    <AttachmentMedia variant="image">
      {source ? (
        <Image
          alt=""
          className="size-full object-cover"
          height={40}
          sizes="40px"
          src={source}
          unoptimized
          width={40}
        />
      ) : (
        <RiImageLine aria-label={`${fileName} thumbnail unavailable`} />
      )}
    </AttachmentMedia>
  )
}

function AttachmentPreviewDialog({
  preview,
  onOpenChange,
}: {
  preview?: AttachmentPreview
  onOpenChange: (open: boolean) => void
}) {
  const source = useAttachmentObjectUrl(preview?.blob)

  return (
    <Dialog open={Boolean(preview)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{preview?.fileName ?? "Image preview"}</DialogTitle>
          <DialogDescription>
            Preview of the locally stored attachment.
          </DialogDescription>
        </DialogHeader>
        {source && preview && (
          <Image
            alt={`Preview of ${preview.fileName}`}
            className="max-h-[70dvh] h-auto w-full rounded-lg object-contain"
            height={preview.height}
            sizes="(max-width: 480px) calc(100vw - 3rem), 28rem"
            src={source}
            unoptimized
            width={preview.width}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function getAttachmentErrorMessage(error: unknown, fileName: string) {
  if (error instanceof ImageAttachmentError || error instanceof Error) {
    return `${fileName}: ${error.message}`
  }

  return `${fileName}: Unable to process this image.`
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1_024) {
    return `${sizeBytes} B`
  }

  if (sizeBytes < 1_048_576) {
    return `${Math.round(sizeBytes / 1_024)} KB`
  }

  return `${(sizeBytes / 1_048_576).toFixed(1)} MB`
}
