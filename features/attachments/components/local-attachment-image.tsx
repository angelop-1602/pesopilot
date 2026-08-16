"use client"

import Image from "next/image"
import type { ReactNode } from "react"

import type {
  AttachmentOwnerType,
  AttachmentPurpose,
} from "@/types/finance"
import {
  useAttachmentObjectUrl,
  useOwnerAttachments,
} from "@/features/attachments/hooks/use-owner-attachments"

export interface LocalAttachmentImageState {
  error: unknown
  isLoading: boolean
}

export interface LocalAttachmentImageProps {
  alt: string
  className?: string
  fallback?:
    | ReactNode
    | ((state: LocalAttachmentImageState) => ReactNode)
  height: number
  ownerId?: string
  ownerType: AttachmentOwnerType
  preload?: boolean
  purpose: AttachmentPurpose
  sizes: string
  width: number
}

export function LocalAttachmentImage({
  alt,
  className,
  fallback = null,
  height,
  ownerId,
  ownerType,
  preload = false,
  purpose,
  sizes,
  width,
}: LocalAttachmentImageProps) {
  const { data, error, isLoading } = useOwnerAttachments(
    ownerType,
    ownerId,
    purpose
  )
  const source = useAttachmentObjectUrl(data[0]?.thumbnailBlob)

  if (!source) {
    return typeof fallback === "function"
      ? fallback({ error, isLoading })
      : fallback
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      preload={preload}
      sizes={sizes}
      src={source}
      unoptimized
      width={width}
    />
  )
}
