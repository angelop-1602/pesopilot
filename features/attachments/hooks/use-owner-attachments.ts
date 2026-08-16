"use client"

import { useCallback, useEffect, useMemo } from "react"

import type {
  AttachmentMetadata,
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"
import { listAttachmentMetadataForOwnerPurpose } from "@/lib/db/repositories/attachments"
import { useLiveQuery } from "@/lib/hooks/use-live-query"

export function useOwnerAttachments(
  ownerType: AttachmentOwnerType,
  ownerId: string | undefined,
  purpose: AttachmentPurpose
) {
  const query = useCallback(async () => {
    if (!ownerId) {
      return []
    }

    const attachments = await listAttachmentMetadataForOwnerPurpose(
      ownerType,
      ownerId,
      purpose
    )

    return attachments.sort(
      (left, right) =>
        left.createdAt.localeCompare(right.createdAt) ||
        left.id.localeCompare(right.id)
    )
  }, [ownerId, ownerType, purpose])

  return useLiveQuery<AttachmentMetadata[]>(query, [])
}

export function useAttachmentObjectUrl(blob?: Blob) {
  const url = useMemo(
    () =>
      blob && typeof URL !== "undefined"
        ? URL.createObjectURL(blob)
        : undefined,
    [blob]
  )

  useEffect(() => {
    return () => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    }
  }, [url])

  return url
}
