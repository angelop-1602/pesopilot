"use client"

import Image from "next/image"
import { useState } from "react"
import { RiAddLine, RiBuilding2Line, RiWallet3Line } from "@remixicon/react"

import type { InstitutionKey } from "@/lib/constants/institutions"
import { cn } from "@/lib/utils"

const logoSizes = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
} as const

interface InstitutionLogoProps {
  color: string
  institutionKey?: InstitutionKey | string
  logoAsset?: string
  logoText?: string
  size?: keyof typeof logoSizes | number
  textColor?: string
  className?: string
}

export function InstitutionLogo({
  color,
  institutionKey,
  logoAsset,
  logoText = "",
  size = "md",
  textColor = "#ffffff",
  className,
}: InstitutionLogoProps) {
  const [assetFailed, setAssetFailed] = useState(false)
  const pixelSize = typeof size === "number" ? size : logoSizes[size]
  const safeText = logoText.trim().slice(0, 4).toUpperCase() || "+"
  const showAsset = Boolean(logoAsset && !assetFailed)
  const iconClassName = pixelSize <= 32 ? "size-4" : "size-5"

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full font-heading text-[0.65rem] font-semibold",
        className
      )}
      style={{
        backgroundColor: showAsset ? "#ffffff" : color,
        color: textColor,
        height: pixelSize,
        width: pixelSize,
      }}
    >
      {showAsset && logoAsset ? (
        <Image
          alt=""
          className="size-full object-contain p-1.5"
          height={pixelSize}
          priority={false}
          src={logoAsset}
          width={pixelSize}
          onError={() => setAssetFailed(true)}
        />
      ) : institutionKey === "cash" ? (
        <RiWallet3Line className={iconClassName} aria-hidden="true" />
      ) : institutionKey === "other" ? (
        <RiAddLine className={iconClassName} aria-hidden="true" />
      ) : safeText === "+" ? (
        <RiBuilding2Line className={iconClassName} aria-hidden="true" />
      ) : (
        safeText
      )}
    </span>
  )
}
